import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import { DEFAULT_PUJA_TEMPLATES } from './src/data/defaultTemplates';
import { DEFAULT_TEMPLES } from './src/data/defaultTemples';
import { DEFAULT_DISTRICT_ITEMS } from './src/data/defaultDistrictItems';
import { Pujari, PujaList, PaymentRequest, QrConfig, PujaTemplate, Temple, SpiritualStory, DistrictItem, ODISHA_DISTRICTS } from './src/types';
import { uploadToS3, createPresignedUploadUrl, getAwsConfig } from './server/s3';
import { isBotRequest, proxyToPrerender, PRERENDER_TOKEN } from './server/prerender';
import { syncAllStoriesFromFirestore, getStoryById, cacheStory, updatePostsJson } from './server/firebaseSync';
import { generateStaticStoryPages } from './server/generateStaticStories';

const app = express();
const PORT = 3000;

// Configure Multer for in-memory multipart form uploads
const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // up to 50MB
});

// Enable CORS for all API and asset endpoints
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-amz-acl, x-amz-storage-class');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static public and uploaded media files
const publicUploadsDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(publicUploadsDir)) {
  fs.mkdirSync(publicUploadsDir, { recursive: true });
}
app.use('/uploads', express.static(publicUploadsDir, { maxAge: '1y' }));
app.use(express.static(path.join(process.cwd(), 'public')));

// Database Persistence File
const DB_FILE = path.join(process.cwd(), 'data', 'db.json');

interface DatabaseSchema {
  pujaris: Pujari[];
  lists: PujaList[];
  payments: PaymentRequest[];
  qrConfig: QrConfig;
  templates: PujaTemplate[];
  temples?: Temple[];
  stories?: SpiritualStory[];
  districtItems?: DistrictItem[];
}

const DEFAULT_QR_CONFIG: QrConfig = {
  newCreationQrUrl: '',
  newCreationUpiId: 'pujasamagri@upi',
  newCreationAmount: 5,
  reDownloadQrUrl: '',
  reDownloadUpiId: 'pujasamagri@upi',
  reDownloadAmount: 2,
};

const INITIAL_PUJARIS: Pujari[] = [
  {
    id: 'PJR-1001',
    name: 'Pandit Ramesh Sharma',
    phone: '9876543210',
    address: 'Varanasi, UP',
    status: 'active',
    freeTierUsed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'PJR-1002',
    name: 'Pandit Suresh Shastri',
    phone: '9812345678',
    address: 'Haridwar, UK',
    status: 'active',
    freeTierUsed: true,
    createdAt: new Date().toISOString(),
  },
];

// Helper to Load Data
function loadDb(): DatabaseSchema {
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const data = JSON.parse(raw);
      return {
        pujaris: data.pujaris || INITIAL_PUJARIS,
        lists: data.lists || [],
        payments: data.payments || [],
        qrConfig: { ...DEFAULT_QR_CONFIG, ...(data.qrConfig || {}) },
        templates: data.templates && data.templates.length > 0 ? data.templates : DEFAULT_PUJA_TEMPLATES,
        temples: data.temples && data.temples.length > 0 ? data.temples : DEFAULT_TEMPLES,
        stories: data.stories || [],
        districtItems: data.districtItems && data.districtItems.length > 0 ? data.districtItems : DEFAULT_DISTRICT_ITEMS,
      };
    }
  } catch (err) {
    console.error('Failed to load db.json, using fallback initial data', err);
  }

  const initialDb: DatabaseSchema = {
    pujaris: INITIAL_PUJARIS,
    lists: [],
    payments: [],
    qrConfig: DEFAULT_QR_CONFIG,
    templates: DEFAULT_PUJA_TEMPLATES,
    temples: DEFAULT_TEMPLES,
    stories: [],
    districtItems: DEFAULT_DISTRICT_ITEMS,
  };
  saveDb(initialDb);
  return initialDb;
}

// Helper to Save Data
function saveDb(data: DatabaseSchema) {
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save db.json', err);
  }
}

// Initialize database
let db = loadDb();

// ----------------------------------------------------
// REST API ENDPOINTS
// ----------------------------------------------------

// 0. AWS S3 Photo & Media Upload Endpoint (Bucket: bhakti-ananda-photos, Region: ap-south-1)
// Supports both direct multipart/form-data streaming AND JSON base64 payloads
app.post(['/api/upload', '/api/s3/upload'], memoryUpload.single('file'), async (req, res) => {
  // Set explicit request timeout to prevent hanging connections
  req.setTimeout(60000);

  try {
    let buffer: Buffer | null = null;
    let originalName = 'photo.jpg';
    let detectedMime = 'image/jpeg';
    let folder = (req.body.folder || 'photos').trim();

    // 1. Multipart Form Data (Fastest binary upload)
    if (req.file) {
      buffer = req.file.buffer;
      originalName = req.file.originalname || originalName;
      detectedMime = req.file.mimetype || detectedMime;
    } 
    // 2. Base64 JSON Payload
    else if (req.body.fileData && typeof req.body.fileData === 'string') {
      const fileData = req.body.fileData;
      originalName = req.body.fileName || originalName;
      detectedMime = req.body.mimeType || detectedMime;

      if (fileData.startsWith('data:')) {
        const match = fileData.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          detectedMime = match[1];
          buffer = Buffer.from(match[2], 'base64');
        } else {
          const parts = fileData.split(',');
          buffer = Buffer.from(parts[1] || parts[0], 'base64');
        }
      } else {
        buffer = Buffer.from(fileData, 'base64');
      }
    }

    if (!buffer || buffer.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No image file or data received. Please provide a valid image.',
      });
    }

    const hostHeader = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
    const protoHeader = req.headers['x-forwarded-proto'] || 'https';
    const hostOrigin = `${protoHeader}://${hostHeader}`;

    const uploadResult = await uploadToS3({
      buffer,
      originalName,
      mimeType: detectedMime,
      folder,
      hostOrigin,
    });

    console.log(
      `[AWS S3 Upload Success] Stored in bucket: ${uploadResult.bucket} (${uploadResult.region}), URL: ${uploadResult.url}`
    );

    return res.json({
      success: true,
      url: uploadResult.url,
      imageUrl: uploadResult.url,
      key: uploadResult.key,
      bucket: uploadResult.bucket,
      region: uploadResult.region,
      isLocalFallback: uploadResult.isLocalFallback || false,
      message: uploadResult.message || 'Photo successfully uploaded to AWS S3 bucket bhakti-ananda-photos',
    });
  } catch (error: any) {
    console.error('[AWS S3 Upload Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload photo to AWS S3 bucket',
      error: String(error),
    });
  }
});

// Presigned URL generation endpoint for high-speed direct AWS S3 client uploads
app.post(['/api/upload/presigned-url', '/api/s3/presigned-url'], async (req, res) => {
  try {
    const { fileName, mimeType, folder = 'photos' } = req.body || {};
    const hostHeader = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
    const protoHeader = req.headers['x-forwarded-proto'] || 'https';
    const hostOrigin = `${protoHeader}://${hostHeader}`;

    const presigned = await createPresignedUploadUrl({
      originalName: fileName || 'photo.jpg',
      mimeType: mimeType || 'image/jpeg',
      folder,
      hostOrigin,
    });

    res.json(presigned);
  } catch (error: any) {
    console.error('[AWS S3 Presigned URL Error]:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate presigned URL',
    });
  }
});

// AWS S3 Config & Status Endpoint
app.get('/api/s3/config', (req, res) => {
  const { bucket, region, accessKeyId, secretAccessKey } = getAwsConfig();
  const isConfigured = Boolean(accessKeyId && secretAccessKey);

  res.json({
    success: true,
    bucket,
    region,
    isConfigured,
    provider: 'AWS S3 (Amazon Web Services)',
  });
});

// 1. Admin Verification
const ADMIN_MASTER_PASSWORD = (process.env.ADMIN_MASTER_PASSWORD || 'nayakjitu@986933').trim();

app.post('/api/admin/verify', (req, res) => {
  const { masterId } = req.body;
  if (masterId && (masterId.trim() === ADMIN_MASTER_PASSWORD || masterId.trim() === 'nayakjitu@986933')) {
    res.json({ success: true, message: 'Admin access granted' });
  } else {
    res.json({ success: false, message: 'Invalid Admin Master ID / Password' });
  }
});

// 2. Pujari Auth / Profile
app.post('/api/pujaris/login', (req, res) => {
  const { pujariId, name, phone, address } = req.body;
  if (!pujariId || typeof pujariId !== 'string') {
    return res.json({ success: false, message: 'Pujari ID is required' });
  }

  const cleanId = pujariId.trim().toUpperCase();
  let pujari = db.pujaris.find((p) => p.id === cleanId);

  if (!pujari) {
    // Self-register new Pujari
    pujari = {
      id: cleanId,
      name: name || `Pandit (${cleanId})`,
      phone: phone || '',
      address: address || '',
      status: 'active',
      freeTierUsed: false,
      createdAt: new Date().toISOString(),
    };
    db.pujaris.push(pujari);
    saveDb(db);
  } else if (name || phone || address) {
    // Update existing Pujari details if provided
    if (name) pujari.name = name;
    if (phone) pujari.phone = phone;
    if (address) pujari.address = address;
    saveDb(db);
  }

  if (pujari.status === 'suspended') {
    return res.json({
      success: false,
      message: 'Your Pujari ID has been suspended by Admin. Please contact Admin.',
      pujari,
    });
  }

  res.json({ success: true, pujari });
});

app.get('/api/pujaris', (req, res) => {
  res.json({ success: true, pujaris: db.pujaris });
});

app.post('/api/pujaris', (req, res) => {
  const { id, name, phone, address } = req.body;
  if (!id || !name) {
    return res.json({ success: false, message: 'Pujari ID and Name are required' });
  }

  const cleanId = id.trim().toUpperCase();
  const existing = db.pujaris.find((p) => p.id === cleanId);
  if (existing) {
    return res.json({ success: false, message: 'Pujari ID already exists' });
  }

  const newPujari: Pujari = {
    id: cleanId,
    name,
    phone: phone || '',
    address: address || '',
    status: 'active',
    freeTierUsed: false,
    createdAt: new Date().toISOString(),
  };

  db.pujaris.push(newPujari);
  saveDb(db);
  res.json({ success: true, pujari: newPujari });
});

app.patch('/api/pujaris/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const pujari = db.pujaris.find((p) => p.id === id);
  if (!pujari) {
    return res.json({ success: false, message: 'Pujari not found' });
  }

  pujari.status = status === 'suspended' ? 'suspended' : 'active';
  saveDb(db);
  res.json({ success: true, pujari });
});

// 3. Puja List Management
app.get('/api/lists', (req, res) => {
  const { pujariId } = req.query;
  if (pujariId && typeof pujariId === 'string') {
    const userLists = db.lists.filter((l) => l.pujariId === pujariId.trim().toUpperCase());
    return res.json({ success: true, lists: userLists });
  }
  res.json({ success: true, lists: db.lists });
});

app.get('/api/lists/search', (req, res) => {
  const { q, pujariId } = req.query;
  const query = (q as string || '').toLowerCase().trim();

  let filtered = db.lists;
  if (pujariId && typeof pujariId === 'string') {
    filtered = filtered.filter((l) => l.pujariId === pujariId.trim().toUpperCase());
  }

  if (query) {
    filtered = filtered.filter(
      (l) =>
        l.pujaName.toLowerCase().includes(query) ||
        l.yajamanaName.toLowerCase().includes(query) ||
        l.id.toLowerCase().includes(query) ||
        l.contact.includes(query) ||
        l.date.includes(query)
    );
  }

  res.json({ success: true, lists: filtered });
});

app.post('/api/lists/:id/utr', (req, res) => {
  const { id } = req.params;
  const { pujariId, utrRef } = req.body;

  const list = db.lists.find((l) => l.id === id);
  if (!list) {
    return res.json({ success: false, message: 'Puja List not found' });
  }

  list.utrRef = utrRef || list.utrRef;
  list.paymentStatus = 'pending';

  // Check if there is an existing payment request or create a new one
  let pmt = db.payments.find((p) => p.listId === id && p.status === 'pending');
  if (pmt) {
    pmt.utrRef = utrRef;
  } else {
    pmt = {
      id: 'PAY-' + Math.floor(100000 + Math.random() * 900000),
      pujariId: list.pujariId,
      pujariName: list.pujariName,
      listId: list.id,
      pujaName: list.pujaName,
      yajamanaName: list.yajamanaName,
      type: (list.paymentType === 'search_redownload' ? 'search_redownload' : 'new_creation'),
      amount: list.paymentAmount || 5,
      utrRef: utrRef,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    db.payments.push(pmt);
  }

  saveDb(db);

  // Trigger automated Admin Telegram alert & WhatsApp backup alert
  const docType = list.yajnaDetails ? 'Nama Yajna Card' : 'Puja List';
  const payloadData = {
    pujariName: list.pujariName,
    pujariId: list.pujariId,
    documentType: docType,
    utrRef: utrRef || list.utrRef || 'N/A',
    listId: list.id,
    timestamp: new Date().toISOString(),
  };

  sendAdminTelegramAlert(payloadData).catch((e) => console.warn('Server Telegram notification warning:', e));
  sendAdminWhatsappAlert(payloadData).catch((e) => console.warn('Server WhatsApp notification warning:', e));

  res.json({ success: true, list, payment: pmt });
});

app.post('/api/lists', (req, res) => {
  const { pujariId, pujaName, yajamanaName, date, time, contact, location, notes, items, utrRef } = req.body;

  if (!pujariId || !pujaName || !yajamanaName || !items || !Array.isArray(items)) {
    return res.json({ success: false, message: 'Missing required fields for Puja List' });
  }

  const cleanPujariId = pujariId.trim().toUpperCase();
  const pujari = db.pujaris.find((p) => p.id === cleanPujariId);

  if (!pujari) {
    return res.json({ success: false, message: 'Pujari profile not found' });
  }

  if (pujari.status === 'suspended') {
    return res.json({ success: false, message: 'Suspended Pujari cannot create lists' });
  }

  const listId = 'LIST-' + Math.floor(100000 + Math.random() * 900000);
  const now = new Date().toISOString();

  let isUnlocked = false;
  let paymentStatus: PujaList['paymentStatus'] = 'pending';
  let paymentType: PujaList['paymentType'] = 'new_creation';
  let paymentAmount = db.qrConfig.newCreationAmount || 5;

  // Check 1st time Creation vs 2nd time onwards
  if (!pujari.freeTierUsed) {
    // 1st Time Creation: Completely FREE!
    isUnlocked = true;
    paymentStatus = 'free';
    paymentType = 'free_first_time';
    paymentAmount = 0;
    pujari.freeTierUsed = true;
  }

  const newList: PujaList = {
    id: listId,
    pujariId: cleanPujariId,
    pujariName: pujari.name,
    pujaName,
    yajamanaName,
    date: date || new Date().toISOString().split('T')[0],
    time: time || '09:00 AM',
    contact: contact || pujari.phone || '',
    location: location || '',
    notes: notes || '',
    items,
    createdAt: now,
    updatedAt: now,
    isUnlocked,
    paymentStatus,
    paymentType,
    paymentAmount,
    utrRef: utrRef || '',
  };

  db.lists.push(newList);

  // If not free, create pending payment request for Admin
  if (!isUnlocked) {
    const paymentReq: PaymentRequest = {
      id: 'PAY-' + Math.floor(100000 + Math.random() * 900000),
      pujariId: cleanPujariId,
      pujariName: pujari.name,
      listId: listId,
      pujaName,
      yajamanaName,
      type: 'new_creation',
      amount: paymentAmount,
      utrRef: utrRef || 'Pending submission',
      status: 'pending',
      createdAt: now,
    };
    db.payments.push(paymentReq);
  }

  saveDb(db);
  res.json({ success: true, list: newList, freeTierUsedNow: isUnlocked && paymentType === 'free_first_time' });
});

// Re-download / Search unlock request for ₹2
app.post('/api/lists/:id/redownload-request', (req, res) => {
  const { id } = req.params;
  const { pujariId, utrRef } = req.body;

  const list = db.lists.find((l) => l.id === id);
  if (!list) {
    return res.json({ success: false, message: 'Puja List not found' });
  }

  const cleanPujariId = (pujariId || list.pujariId).trim().toUpperCase();
  const pujari = db.pujaris.find((p) => p.id === cleanPujariId);

  const amount = db.qrConfig.reDownloadAmount || 2;
  const now = new Date().toISOString();

  // Create payment request for search/redownload
  const paymentReq: PaymentRequest = {
    id: 'PAY-' + Math.floor(100000 + Math.random() * 900000),
    pujariId: cleanPujariId,
    pujariName: pujari ? pujari.name : list.pujariName,
    listId: list.id,
    pujaName: list.pujaName,
    yajamanaName: list.yajamanaName,
    type: 'search_redownload',
    amount,
    utrRef: utrRef || 'Search re-download request',
    status: 'pending',
    createdAt: now,
  };

  list.paymentStatus = 'pending';
  list.paymentType = 'search_redownload';
  list.paymentAmount = amount;
  list.utrRef = utrRef || list.utrRef;

  db.payments.push(paymentReq);
  saveDb(db);

  res.json({ success: true, paymentRequest: paymentReq, list });
});

// 4. Payment Management & Lock/Unlock
app.get('/api/payments', (req, res) => {
  res.json({ success: true, payments: db.payments });
});

app.post('/api/payments/:id/approve', (req, res) => {
  const { id } = req.params;
  const payment = db.payments.find((p) => p.id === id);

  if (!payment) {
    return res.json({ success: false, message: 'Payment request not found' });
  }

  payment.status = 'approved';
  payment.approvedAt = new Date().toISOString();

  // Unlock corresponding list
  const list = db.lists.find((l) => l.id === payment.listId);
  if (list) {
    list.isUnlocked = true;
    list.paymentStatus = 'approved';
  }

  saveDb(db);
  res.json({ success: true, payment, list });
});

app.post('/api/payments/:id/reject', (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const payment = db.payments.find((p) => p.id === id);
  if (!payment) {
    return res.json({ success: false, message: 'Payment request not found' });
  }

  payment.status = 'rejected';
  payment.rejectionReason = reason || 'Payment details could not be verified.';

  const list = db.lists.find((l) => l.id === payment.listId);
  if (list) {
    list.paymentStatus = 'rejected';
    list.rejectionReason = reason || 'Payment verification failed.';
  }

  saveDb(db);
  res.json({ success: true, payment, list });
});

// 5. QR Config Management
app.get('/api/qr-config', (req, res) => {
  res.json({ success: true, qrConfig: db.qrConfig });
});

app.post('/api/qr-config', (req, res) => {
  const {
    newCreationQrUrl,
    newCreationUpiId,
    newCreationAmount,
    reDownloadQrUrl,
    reDownloadUpiId,
    reDownloadAmount,
  } = req.body;

  if (newCreationQrUrl !== undefined) db.qrConfig.newCreationQrUrl = newCreationQrUrl;
  if (newCreationUpiId !== undefined) db.qrConfig.newCreationUpiId = newCreationUpiId;
  if (newCreationAmount !== undefined) db.qrConfig.newCreationAmount = Number(newCreationAmount) || 5;
  if (reDownloadQrUrl !== undefined) db.qrConfig.reDownloadQrUrl = reDownloadQrUrl;
  if (reDownloadUpiId !== undefined) db.qrConfig.reDownloadUpiId = reDownloadUpiId;
  if (reDownloadAmount !== undefined) db.qrConfig.reDownloadAmount = Number(reDownloadAmount) || 2;

  saveDb(db);
  res.json({ success: true, qrConfig: db.qrConfig });
});

// 6. Puja Templates
app.get('/api/templates', (req, res) => {
  res.json({ success: true, templates: db.templates });
});

app.post('/api/templates', (req, res) => {
  const { name, description, items } = req.body;
  if (!name || !items || !Array.isArray(items)) {
    return res.json({ success: false, message: 'Name and items array are required' });
  }

  const newTemplate: PujaTemplate = {
    id: 'tmpl-' + Date.now(),
    name,
    description: description || '',
    items,
  };

  db.templates.push(newTemplate);
  saveDb(db);
  res.json({ success: true, template: newTemplate });
});

app.delete('/api/templates/:id', (req, res) => {
  const { id } = req.params;
  db.templates = db.templates.filter((t) => t.id !== id);
  saveDb(db);
  res.json({ success: true, message: 'Template deleted' });
});

// 7. Temple Management Endpoints
app.get('/api/temples', (req, res) => {
  res.json({ success: true, temples: db.temples && db.temples.length > 0 ? db.temples : DEFAULT_TEMPLES });
});

app.post('/api/temples', (req, res) => {
  const { temples } = req.body;
  if (Array.isArray(temples)) {
    db.temples = temples;
    saveDb(db);
    return res.json({ success: true, temples: db.temples });
  }
  res.json({ success: false, message: 'Invalid temples payload' });
});

// 8. Spiritual Stories Endpoints
app.get('/api/stories', (req, res) => {
  res.json({ success: true, stories: db.stories || [] });
});

// Manual / Automated OpenGraph & Posts sync endpoint
app.all(['/api/sync-og-meta', '/api/sync-stories'], async (req, res) => {
  try {
    const stories = await syncAllStoriesFromFirestore();
    if (stories && stories.length > 0) {
      db.stories = stories;
      saveDb(db);
    }
    // Generate static story pages for static hosting (AWS S3 / CloudFront)
    generateStaticStoryPages().catch(() => {});
    res.json({ success: true, message: `Successfully synchronized ${stories.length} stories for social sharing`, count: stories.length });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Sync failed', error: String(err) });
  }
});

app.post('/api/stories', (req, res) => {
  const { story, stories } = req.body;
  if (!db.stories) db.stories = [];
  if (Array.isArray(stories)) {
    db.stories = stories;
    saveDb(db);
    // Sync to memory and posts.json for static and dynamic scrapers
    stories.forEach((s: SpiritualStory) => {
      if (s && s.id) {
        cacheStory(s);
        updatePostsJson(s);
      }
    });
    generateStaticStoryPages().catch(() => {});
    return res.json({ success: true, stories: db.stories });
  }
  if (story && story.id) {
    const idx = db.stories.findIndex((s) => s.id === story.id);
    if (idx >= 0) {
      db.stories[idx] = story;
    } else {
      db.stories.unshift(story);
    }
    saveDb(db);
    cacheStory(story);
    updatePostsJson(story);
    generateStaticStoryPages().catch(() => {});
    return res.json({ success: true, story, stories: db.stories });
  }
  res.json({ success: false, message: 'Invalid story payload' });
});

app.delete('/api/stories/:id', (req, res) => {
  const { id } = req.params;
  if (db.stories) {
    db.stories = db.stories.filter((s) => s.id !== id);
    saveDb(db);
    try {
      const postsJsonPath = path.join(process.cwd(), 'posts.json');
      if (fs.existsSync(postsJsonPath)) {
        const postsData = JSON.parse(fs.readFileSync(postsJsonPath, 'utf-8'));
        delete postsData[`/story/${id}`];
        delete postsData[id];
        fs.writeFileSync(postsJsonPath, JSON.stringify(postsData, null, 2), 'utf-8');
      }
    } catch {}
  }
  res.json({ success: true, message: 'Story deleted' });
});

app.post('/api/sync-story-html', async (req, res) => {
  try {
    const { story } = req.body;
    if (story && story.id) {
      cacheStory(story);
      updatePostsJson(story);
    }
    generateStaticStoryPages().catch(() => {});
    res.json({ success: true, message: 'Story HTML synchronization started' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || String(err) });
  }
});

// District Items Endpoints
app.get('/api/district-items', (req, res) => {
  const { districtId } = req.query;
  const items = Array.isArray(db.districtItems) ? db.districtItems : DEFAULT_DISTRICT_ITEMS;
  if (districtId && districtId !== 'all') {
    return res.json({ success: true, items: items.filter((i: any) => i.districtId === districtId) });
  }
  res.json({ success: true, items });
});

app.post('/api/district-items', (req, res) => {
  const { item, items } = req.body;
  if (Array.isArray(items)) {
    db.districtItems = items;
    saveDb(db);
    return res.json({ success: true, items: db.districtItems });
  }
  if (item && item.id) {
    if (!Array.isArray(db.districtItems)) db.districtItems = [...DEFAULT_DISTRICT_ITEMS];
    const idx = db.districtItems.findIndex((i: any) => i.id === item.id);
    if (idx >= 0) {
      db.districtItems[idx] = item;
    } else {
      db.districtItems.unshift(item);
    }
    saveDb(db);
    return res.json({ success: true, item, items: db.districtItems });
  }
  res.json({ success: false, message: 'Invalid district item payload' });
});

app.post('/api/district-items/clear-all', (req, res) => {
  db.districtItems = [];
  saveDb(db);
  res.json({ success: true, message: 'All district items cleared', items: [] });
});

app.post('/api/district-items/restore-defaults', (req, res) => {
  db.districtItems = [...DEFAULT_DISTRICT_ITEMS];
  saveDb(db);
  res.json({ success: true, message: 'Default district items restored', items: db.districtItems });
});

app.delete('/api/district-items/:id', (req, res) => {
  const { id } = req.params;
  if (Array.isArray(db.districtItems)) {
    db.districtItems = db.districtItems.filter((i: any) => i.id !== id);
    saveDb(db);
  }
  res.json({ success: true, message: 'District item deleted' });
});

// Secret Admin Telegram Bot credentials stored on server
const TELEGRAM_BOT_TOKEN = (process.env.TELEGRAM_BOT_TOKEN || '8895009347:AAHvbERPbXgvoLjbEEFAz4XvbHZFlolMSrA').trim();
const TELEGRAM_ADMIN_CHAT_ID = (process.env.TELEGRAM_ADMIN_CHAT_ID || '1962290781').trim();

// Helper function to send automated Telegram Bot alert payload to Admin
async function sendAdminTelegramAlert(data: {
  pujariName: string;
  pujariId: string;
  documentType: string;
  utrRef: string;
  listId?: string;
  timestamp?: string;
}) {
  const timeStr = data.timestamp
    ? new Date(data.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    : new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  const messageText = `🔔 *New Payment Alert!*\n👤 *Pujari Name:* ${data.pujariName}\n📄 *Document:* ${data.documentType}\n💳 *UTR No:* ${data.utrRef}\n⏰ *Time:* ${timeStr}\n\n👉 Please open the Admin Dashboard to Approve and unlock the PDF.`;

  console.log(`[AUTOMATED TELEGRAM NOTIFICATION -> ADMIN (Chat ID: ${TELEGRAM_ADMIN_CHAT_ID})]`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(messageText);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_ADMIN_CHAT_ID,
        text: messageText,
        parse_mode: 'Markdown',
      }),
    });
    const result = await res.json();
    if (!result.ok) {
      console.warn(`[Telegram Bot API Notice ${result.error_code}]: ${result.description}`);
    } else {
      console.log('[Telegram Bot API Result]:', result);
    }
    return result;
  } catch (err) {
    console.warn('[Telegram Bot API Request Error]:', err);
    return { ok: false, description: String(err) };
  }
}

// Secret Admin WhatsApp Number stored on server
const ADMIN_WHATSAPP_NUMBER = process.env.ADMIN_WHATSAPP_NUMBER || '+919078414405';

// Helper function to send automated WhatsApp alert payload to Admin
async function sendAdminWhatsappAlert(data: {
  pujariName: string;
  pujariId: string;
  documentType: string;
  utrRef: string;
  listId?: string;
  timestamp?: string;
}) {
  const timeStr = data.timestamp
    ? new Date(data.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    : new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  console.log(`[AUTOMATED WHATSAPP NOTIFICATION -> ADMIN (${ADMIN_WHATSAPP_NUMBER})]`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`👤 Pujari Name & ID: ${data.pujariName} (${data.pujariId})`);
  console.log(`📄 Document Type: ${data.documentType}`);
  console.log(`💳 UTR / Transaction No: ${data.utrRef}`);
  console.log(`🔖 Reference ID: ${data.listId || 'N/A'}`);
  console.log(`⏰ Timestamp: ${timeStr}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  const whatsappToken = process.env.WHATSAPP_API_TOKEN;
  const whatsappPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (whatsappToken && whatsappPhoneId) {
    try {
      const bodyText = `🚨 *NEW PAYMENT UTR SUBMISSION* 🚨\n\n• *Pujari:* ${data.pujariName} (${data.pujariId})\n• *Document Type:* ${data.documentType}\n• *UTR/Txn:* ${data.utrRef}\n• *Ref ID:* ${data.listId || 'N/A'}\n• *Time:* ${timeStr}`;

      await fetch(`https://graph.facebook.com/v18.0/${whatsappPhoneId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${whatsappToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: ADMIN_WHATSAPP_NUMBER.replace(/\+/g, ''),
          type: 'text',
          text: { body: bodyText },
        }),
      });
      console.log(`[WhatsApp Cloud API] Alert sent successfully to ${ADMIN_WHATSAPP_NUMBER}`);
    } catch (apiErr) {
      console.warn('[WhatsApp Cloud API Error]:', apiErr);
    }
  }
}

// 7. Admin FCM Push Notification Trigger Endpoint
app.post('/api/notify-admin', (req, res) => {
  const { pujariId, name, phone, fcmToken } = req.body;
  console.log(`[FCM Background Push Trigger] Admin notified for new Pujari: ${name} (${pujariId}), Phone: ${phone}, FCM Token Present: ${!!fcmToken}`);
  res.json({
    success: true,
    message: 'Admin push notification payload processed successfully',
    notification: {
      title: '🚨 ନୂଆ ପୂଜାରୀ ପଞ୍ଜୀକରଣ (New Pujari Registered)',
      body: `ପୂଜାରୀ ${name || 'Unknown'} (${pujariId || ''}) ଆପ୍‌ରେ ପଞ୍ଜୀକୃତ ହୋଇଛନ୍ତି। ମୋବାଇଲ୍: ${phone || 'N/A'}`,
      fcmToken: fcmToken || null,
    },
  });
});

// 8. Automated Admin WhatsApp Alert Trigger Endpoint
app.post('/api/notify-admin-whatsapp', async (req, res) => {
  try {
    const { pujariId, pujariName, documentType, utrRef, timestamp, listId } = req.body;

    await sendAdminWhatsappAlert({
      pujariId: pujariId || 'N/A',
      pujariName: pujariName || 'Unknown Pujari',
      documentType: documentType || 'Puja List / Yajna Card',
      utrRef: utrRef || 'Pending UTR',
      listId: listId || 'N/A',
      timestamp: timestamp || new Date().toISOString(),
    });

    return res.json({
      success: true,
      message: 'Automated WhatsApp alert dispatched to admin',
      recipient: 'Protected Admin Device',
    });
  } catch (err: any) {
    console.error('/api/notify-admin-whatsapp Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to process WhatsApp notification' });
  }
});

// 9. Automated Admin Telegram Alert Trigger Endpoints
app.post(['/api/notify-telegram', '/api/notify-admin-telegram'], async (req, res) => {
  try {
    const { utrNumber, utrRef, pujariName, docType, documentType, pujariId, listId, timestamp } = req.body;

    const finalUtr = utrNumber || utrRef || 'Pending UTR';
    const finalName = pujariName || 'Pujari';
    const finalDoc = docType || documentType || 'Puja List / Yajna Card';

    const telegramRes = await sendAdminTelegramAlert({
      pujariId: pujariId || 'N/A',
      pujariName: finalName,
      documentType: finalDoc,
      utrRef: finalUtr,
      listId: listId || 'N/A',
      timestamp: timestamp || new Date().toISOString(),
    });

    return res.json({
      success: true,
      message: 'Automated Telegram alert dispatched to admin',
      telegramResult: telegramRes || null,
    });
  } catch (err: any) {
    console.error('/api/notify-telegram Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to process Telegram notification' });
  }
});

// Catch-all handler for API routes to guarantee JSON response
app.all('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: 'API route not found' });
});

export { app };

// Helper to generate dynamic OpenGraph & Twitter tags for social media scrapers
async function injectDynamicOgTags(html: string, req: express.Request): Promise<string> {
  try {
    const currentDb = loadDb();
    const url = req.originalUrl || req.url;
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'www.bhaktianandaodiatvofficial.blog';
    const protocol = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'https');
    const origin = `${protocol}://${host}`;
    const urlObj = new URL(url, `http://${host}`);
    const pathname = urlObj.pathname.toLowerCase();
    const searchParams = urlObj.searchParams;

    let title = 'Bhakti Ananda Odia TV | ଶ୍ରୀ ମନ୍ଦିର ଅନଲାଇନ୍ ପୂଜା ବୁକିଂ, ଓଡ଼ିଶା ଦର୍ଶନ, ପଞ୍ଜିକା ଓ ଆଧ୍ୟାତ୍ମିକ କଥା';
    let description = 'ଭକ୍ତି ଆନନ୍ଦ ଓଡ଼ିଆ TV - ସମ୍ପୂର୍ଣ୍ଣ ବୈଦିକ ପୂଜା ସାମଗ୍ରୀ ସୂଚୀ, ପ୍ରାମାଣିକ ଓଡ଼ିଆ କ୍ୟାଲେଣ୍ଡର ପାଞ୍ଜି, ଅନଲାଇନ୍ ମନ୍ଦିର ପୂଜା ବୁକିଂ, ଓଡ଼ିଶାର ୩୦ ଜିଲ୍ଲା ଦର୍ଶନ ଏବଂ ଆଧ୍ୟାତ୍ମିକ ଭିଡିଓ।';
    const DEFAULT_BRAND_IMAGE = `${origin}/brand-banner.svg`;
    let imageUrl = DEFAULT_BRAND_IMAGE;
    let canonicalUrl = `${origin}${pathname}`;
    let ogType = 'website';

    // 0. Direct URL query overrides (takes precedence if explicitly supplied in share link)
    const directImg = searchParams.get('og_image') || searchParams.get('img') || searchParams.get('image');
    const directTitle = searchParams.get('og_title') || searchParams.get('title');
    const directDesc = searchParams.get('og_desc') || searchParams.get('desc');

    if (directTitle && directTitle.trim()) {
      title = directTitle.trim().startsWith('📖') ? directTitle.trim() : `📖 ${directTitle.trim()} | Bhakti Ananda Odia TV`;
    }
    if (directDesc && directDesc.trim()) {
      description = directDesc.trim().slice(0, 160);
    }
    if (directImg && directImg.trim()) {
      imageUrl = directImg.trim();
    }

    // 1. Check Story / Blog Post
    let storyId = '';
    if (pathname.startsWith('/story/') || pathname.startsWith('/blog/') || pathname.startsWith('/stories/')) {
      const parts = urlObj.pathname.split('/').filter(Boolean);
      if (parts[1]) {
        storyId = decodeURIComponent(parts[1])
          .replace(/^(\/)?story\//i, '')
          .replace(/\.html?$/i, '')
          .replace(/\/$/, '')
          .trim();
      }
    } else if (searchParams.get('storyId') || searchParams.get('story') || searchParams.get('id')) {
      storyId = (searchParams.get('storyId') || searchParams.get('story') || searchParams.get('id') || '')
        .replace(/^(\/)?story\//i, '')
        .replace(/\.html?$/i, '')
        .replace(/\/$/, '')
        .trim();
    }

    if (storyId) {
      const cleanStoryId = storyId.replace(/\.html?$/i, '').trim();
      canonicalUrl = `${origin}/story/${encodeURIComponent(cleanStoryId)}.html`;
      ogType = 'article';

      let storyObj: any = null;

      // 1a. Check posts.json by EXACT keys only (never loose substring)
      try {
        const postsJsonPath = path.join(process.cwd(), 'posts.json');
        if (fs.existsSync(postsJsonPath)) {
          const postsData = JSON.parse(fs.readFileSync(postsJsonPath, 'utf-8'));
          const matched =
            postsData[`/story/${cleanStoryId}`] ||
            postsData[`/story/${cleanStoryId}.html`] ||
            postsData[`/story/${cleanStoryId}/index.html`] ||
            postsData[cleanStoryId] ||
            postsData[`${cleanStoryId}.html`];
          if (matched && (matched.id ? matched.id.toLowerCase() === cleanStoryId.toLowerCase() : true)) {
            storyObj = matched;
          }
        }
      } catch (postsErr) {
        console.warn('Could not read posts.json:', postsErr);
      }

      // 1b. Check in-memory DB by exact ID
      if (!storyObj) {
        const allStories = currentDb.stories || [];
        const matched = allStories.find((s) => {
          if (!s || !s.id) return false;
          const sid = s.id.replace(/\.html?$/i, '').trim().toLowerCase();
          return sid === cleanStoryId.toLowerCase();
        });
        if (matched) {
          storyObj = matched;
        }
      }

      // 1c. Check live Firestore document directly
      if (!storyObj) {
        try {
          const liveStory = await getStoryById(cleanStoryId);
          if (liveStory) {
            storyObj = liveStory;
          }
        } catch (liveErr) {
          console.warn('[Live Story Lookup Error]:', liveErr);
        }
      }

      // If story is found, populate exact metadata
      if (storyObj) {
        if (storyObj.title) title = `📖 ${storyObj.title} | Bhakti Ananda Odia TV`;
        const rawDesc = storyObj.summary || storyObj.content || storyObj.description || description;
        description = rawDesc.length > 160 ? `${rawDesc.slice(0, 157)}...` : rawDesc;
        const sImg = storyObj.imageUrl || storyObj.image;
        if (sImg && typeof sImg === 'string' && sImg.trim()) {
          imageUrl = sImg.trim();
        }
      }

      // If direct URL params were provided (from share URL), prioritize them as the ultimate fresh override
      if (directImg && directImg.trim()) imageUrl = directImg.trim();
      if (directTitle && directTitle.trim()) {
        title = directTitle.trim().startsWith('📖') ? directTitle.trim() : `📖 ${directTitle.trim()} | Bhakti Ananda Odia TV`;
      }
      if (directDesc && directDesc.trim()) description = directDesc.trim().slice(0, 160);
    }

    // 2. Check Temple
    let templeId = '';
    if (pathname.startsWith('/temple/') || pathname.startsWith('/temples/')) {
      const parts = urlObj.pathname.split('/').filter(Boolean);
      if (parts[1]) {
        templeId = decodeURIComponent(parts[1])
          .replace(/\.html?$/i, '')
          .replace(/\/$/, '')
          .trim();
      }
    } else if (searchParams.get('templeId') || searchParams.get('temple')) {
      templeId = (searchParams.get('templeId') || searchParams.get('temple') || '')
        .replace(/\.html?$/i, '')
        .replace(/\/$/, '')
        .trim();
    }

    if (templeId) {
      const temple = (currentDb.temples || DEFAULT_TEMPLES).find((t) => {
        if (!t || !t.id) return false;
        const tid = t.id.replace(/\.html?$/i, '').trim();
        return tid === templeId || t.id === templeId || tid.toLowerCase() === templeId.toLowerCase();
      });
      if (temple) {
        title = `🚩 ${temple.name} (${temple.location || 'Odisha'}) - ଅନଲାଇନ୍ ପୂଜା ବୁକିଂ`;
        const rawDesc = temple.description || temple.history || `ପ୍ରସିଦ୍ଧ ${temple.name} ରେ ଅନଲାଇନ୍ ଜଳାଭିଷେକ ଓ ପୂଜା ବୁକ୍ କରନ୍ତୁ।`;
        description = rawDesc.length > 160 ? `${rawDesc.slice(0, 157)}...` : rawDesc;
        if (temple.imageUrl || temple.thumbnailUrl) imageUrl = temple.imageUrl || temple.thumbnailUrl || imageUrl;
        canonicalUrl = `${origin}/temple/${encodeURIComponent(temple.id)}`;
      }
    }

    // 3. Check District Item
    let districtId = '';
    let itemId = '';
    if (pathname.startsWith('/district/') || pathname.startsWith('/districts/')) {
      const parts = urlObj.pathname.split('/').filter(Boolean);
      if (parts[1]) districtId = decodeURIComponent(parts[1]).replace(/\.html?$/i, '').replace(/\/$/, '').trim();
      if (parts[2]) itemId = decodeURIComponent(parts[2]).replace(/\.html?$/i, '').replace(/\/$/, '').trim();
    } else {
      districtId = (searchParams.get('district') || '').replace(/\.html?$/i, '').trim();
      itemId = (searchParams.get('item') || '').replace(/\.html?$/i, '').trim();
    }

    if (districtId || itemId) {
      const items = currentDb.districtItems || DEFAULT_DISTRICT_ITEMS;
      const matched = items.find((it) => (itemId ? it.id === itemId : it.districtId === districtId));
      if (matched) {
        title = `🛕 ${matched.title} - ${matched.districtNameOdia || ''} | ଓଡ଼ିଶା ଦର୍ଶନ`;
        const rawDesc = matched.description || matched.significance || 'ଓଡ଼ିଶାର ପ୍ରସିଦ୍ଧ ପର୍ଯ୍ୟଟନ ଓ ତୀର୍ଥକ୍ଷେତ୍ର ଦର୍ଶନ କରନ୍ତୁ।';
        description = rawDesc.length > 160 ? `${rawDesc.slice(0, 157)}...` : rawDesc;
        const itemImg = matched.imageUrl || matched.adImageUrl || matched.affiliateProductImageUrl;
        if (itemImg) imageUrl = itemImg;
        canonicalUrl = `${origin}/district/${encodeURIComponent(matched.districtId)}/${encodeURIComponent(matched.id)}`;
      }
    }

    // 4. Check Store Product
    let productId = searchParams.get('product_id') || searchParams.get('product') || '';
    if (productId) {
      title = `🛍️ ପୂଜା ସାମଗ୍ରୀ ଷ୍ଟୋର୍ (Puja Samagri Store) | Bhakti Ananda Odia TV`;
      description = `ଶୁଦ୍ଧ ବୈଦିକ ପୂଜା ସାମଗ୍ରୀ, ମୂର୍ତ୍ତି ଏବଂ ଆଧ୍ୟାତ୍ମିକ ସାମଗ୍ରୀ ଅନଲାଇନରେ ଅର୍ଡର କରନ୍ତୁ Cash on Delivery ସହ।`;
      canonicalUrl = `${origin}/?view=store&product_id=${encodeURIComponent(productId)}`;
    }

    // Ensure absolute image URL
    if (imageUrl && imageUrl.startsWith('/')) {
      imageUrl = `${origin}${imageUrl}`;
    } else if (imageUrl && !imageUrl.startsWith('http://') && !imageUrl.startsWith('https://') && !imageUrl.startsWith('data:')) {
      imageUrl = `${origin}/${imageUrl}`;
    }

    // Strip any pre-existing OG, Twitter, canonical, and description tags from html to eliminate duplicates/conflicts
    let cleanedHtml = html
      .replace(/<meta\s+property=["']og:[^"']*["'][^>]*>/gi, '')
      .replace(/<meta\s+name=["']twitter:[^"']*["'][^>]*>/gi, '')
      .replace(/<meta\s+name=["']description["'][^>]*>/gi, '')
      .replace(/<meta\s+name=["']image["'][^>]*>/gi, '')
      .replace(/<meta\s+itemprop=["']image["'][^>]*>/gi, '')
      .replace(/<link\s+rel=["']canonical["'][^>]*>/gi, '')
      .replace(/<title>.*?<\/title>/gi, '');

    // Determine image mime type
    let imageType = 'image/jpeg';
    if (imageUrl.includes('.png')) imageType = 'image/png';
    else if (imageUrl.includes('.webp')) imageType = 'image/webp';
    else if (imageUrl.includes('.svg')) imageType = 'image/svg+xml';

    const ogTagsBlock = `
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <link rel="canonical" href="${canonicalUrl}" />
    <meta property="og:site_name" content="Bhakti Ananda Odia TV & Puja Samagri Portal" />
    <meta property="og:type" content="${ogType}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:image:secure_url" content="${imageUrl}" />
    <meta property="og:image:url" content="${imageUrl}" />
    <meta property="og:image:type" content="${imageType}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${title}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${imageUrl}" />
    <meta name="twitter:image:src" content="${imageUrl}" />
    <meta name="image" content="${imageUrl}" />
    <meta itemprop="image" content="${imageUrl}" />`;

    // Inject immediately inside <head>
    return cleanedHtml.replace('<head>', `<head>${ogTagsBlock}`);
  } catch (err) {
    console.error('Error injecting dynamic OG tags into HTML:', err);
    return html;
  }
}

// ----------------------------------------------------
// VITE MIDDLEWARE & SERVER START
// ----------------------------------------------------
async function startServer() {
  // Initial sync from Firestore on startup
  try {
    const initialSyncedStories = await syncAllStoriesFromFirestore();
    if (initialSyncedStories.length > 0) {
      db.stories = initialSyncedStories;
      saveDb(db);
    }
  } catch (syncErr) {
    console.warn('[Startup Story Sync Error]:', syncErr);
  }

  // Periodic background synchronization every 30 seconds
  setInterval(async () => {
    try {
      const refreshed = await syncAllStoriesFromFirestore();
      if (refreshed.length > 0) {
        db.stories = refreshed;
        saveDb(db);
      }
    } catch {}
  }, 30000);

  // 1. Direct Static Meta Tag Injection for Social Crawlers (Facebook, WhatsApp, Twitter/X, Telegram, etc.)
  // Web crawlers receive the pre-injected raw HTML immediately without client-side JS dependency
  app.use(async (req, res, next) => {
    if (isBotRequest(req)) {
      try {
        const isProd = process.env.NODE_ENV === 'production';
        const htmlFilePath = isProd
          ? path.join(process.cwd(), 'dist', 'index.html')
          : path.join(process.cwd(), 'index.html');

        if (fs.existsSync(htmlFilePath)) {
          const rawTemplate = fs.readFileSync(htmlFilePath, 'utf-8');
          const injectedHtml = await injectDynamicOgTags(rawTemplate, req);
          const userAgent = req.headers['user-agent'] || 'Bot';
          console.log(`[Static OG Injector] 🤖 Served static meta tags to bot (${userAgent.slice(0, 45)}...): ${req.originalUrl || req.url}`);
          return res.status(200).set({
            'Content-Type': 'text/html; charset=UTF-8',
            'X-Social-Preview-Injected': 'true',
            'Cache-Control': 'public, max-age=300'
          }).send(injectedHtml);
        }
      } catch (botErr) {
        console.warn('[Bot Static Meta Injection Error]:', botErr);
      }
    }
    next();
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });

    // Intercept HTML requests in development to inject dynamic OG meta tags
    app.use(async (req, res, next) => {
      const url = req.originalUrl || req.url;
      const cleanPath = url.split('?')[0];
      const isAsset =
        cleanPath.startsWith('/api') ||
        cleanPath.startsWith('/@') ||
        cleanPath.startsWith('/src') ||
        cleanPath.startsWith('/node_modules') ||
        cleanPath.startsWith('/dist') ||
        /\.(js|ts|tsx|jsx|css|json|png|jpe?g|gif|svg|ico|webp|woff2?|ttf|map)$/i.test(cleanPath);

      const isHtmlRequest =
        !isAsset &&
        (req.headers.accept?.includes('text/html') ||
          req.headers.accept?.includes('*/*') ||
          cleanPath.startsWith('/story/') ||
          cleanPath.startsWith('/temple/') ||
          cleanPath.startsWith('/district/') ||
          cleanPath.endsWith('.html'));

      if (isHtmlRequest) {
        try {
          const indexHtmlPath = path.join(process.cwd(), 'index.html');
          let template = fs.readFileSync(indexHtmlPath, 'utf-8');
          template = await vite.transformIndexHtml(url, template);
          const finalHtml = await injectDynamicOgTags(template, req);
          return res.status(200).set({ 'Content-Type': 'text/html' }).end(finalHtml);
        } catch (e) {
          vite.ssrFixStacktrace(e as Error);
          next(e);
          return;
        }
      }
      next();
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');

    // Intercept ALL HTML requests (including /story/*, /temple/*, /district/*, /*.html, etc.)
    // BEFORE express.static so injectDynamicOgTags is ALWAYS executed fresh for every story/post!
    app.use(async (req, res, next) => {
      const url = req.originalUrl || req.url;
      const cleanPath = url.split('?')[0];
      const isAsset =
        cleanPath.startsWith('/api') ||
        cleanPath.startsWith('/assets') ||
        /\.(js|ts|tsx|jsx|css|json|png|jpe?g|gif|svg|ico|webp|woff2?|ttf|map)$/i.test(cleanPath);

      const isHtmlRequest =
        !isAsset &&
        (req.headers.accept?.includes('text/html') ||
          req.headers.accept?.includes('*/*') ||
          cleanPath.startsWith('/story/') ||
          cleanPath.startsWith('/temple/') ||
          cleanPath.startsWith('/district/') ||
          cleanPath.endsWith('.html') ||
          cleanPath === '/' ||
          !cleanPath.includes('.'));

      if (isHtmlRequest) {
        try {
          const indexHtmlPath = path.join(distPath, 'index.html');
          if (fs.existsSync(indexHtmlPath)) {
            const rawHtml = fs.readFileSync(indexHtmlPath, 'utf-8');
            const finalHtml = await injectDynamicOgTags(rawHtml, req);
            return res.status(200).set({ 'Content-Type': 'text/html; charset=utf-8' }).end(finalHtml);
          }
        } catch (err) {
          console.warn('[Production HTML Injection Warning]:', err);
        }
      }
      next();
    });

    app.use(express.static(distPath, { index: false }));
    app.get('*', async (req, res) => {
      try {
        const indexHtmlPath = path.join(distPath, 'index.html');
        if (fs.existsSync(indexHtmlPath)) {
          const rawHtml = fs.readFileSync(indexHtmlPath, 'utf-8');
          const finalHtml = await injectDynamicOgTags(rawHtml, req);
          return res.status(200).set({ 'Content-Type': 'text/html; charset=utf-8' }).end(finalHtml);
        }
        res.sendFile(indexHtmlPath);
      } catch (err) {
        res.sendFile(path.join(distPath, 'index.html'));
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌸 Puja Samagri System Server running on http://localhost:${PORT}`);
    console.log(`🚀 Static Open Graph Meta Tag Injector active for Facebook, WhatsApp, Twitter, Telegram crawlers`);
  });
}


startServer();

