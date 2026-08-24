import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { DEFAULT_PUJA_TEMPLATES } from './src/data/defaultTemplates';
import { DEFAULT_TEMPLES } from './src/data/defaultTemples';
import { DEFAULT_DISTRICT_ITEMS } from './src/data/defaultDistrictItems';
import { Pujari, PujaList, PaymentRequest, QrConfig, PujaTemplate, Temple, SpiritualStory, DistrictItem, ODISHA_DISTRICTS } from './src/types';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

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

app.post('/api/stories', (req, res) => {
  const { story, stories } = req.body;
  if (!db.stories) db.stories = [];
  if (Array.isArray(stories)) {
    db.stories = stories;
    saveDb(db);
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
    return res.json({ success: true, story, stories: db.stories });
  }
  res.json({ success: false, message: 'Invalid story payload' });
});

app.delete('/api/stories/:id', (req, res) => {
  const { id } = req.params;
  if (db.stories) {
    db.stories = db.stories.filter((s) => s.id !== id);
    saveDb(db);
  }
  res.json({ success: true, message: 'Story deleted' });
});

// District Items Endpoints
app.get('/api/district-items', (req, res) => {
  const { districtId } = req.query;
  const items = db.districtItems && db.districtItems.length > 0 ? db.districtItems : DEFAULT_DISTRICT_ITEMS;
  if (districtId && districtId !== 'all') {
    return res.json({ success: true, items: items.filter((i) => i.districtId === districtId) });
  }
  res.json({ success: true, items });
});

app.post('/api/district-items', (req, res) => {
  const { item, items } = req.body;
  if (Array.isArray(items) && items.length > 0) {
    db.districtItems = items;
    saveDb(db);
    return res.json({ success: true, items: db.districtItems });
  }
  if (item && item.id) {
    if (!db.districtItems) db.districtItems = [...DEFAULT_DISTRICT_ITEMS];
    const idx = db.districtItems.findIndex((i) => i.id === item.id);
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

app.delete('/api/district-items/:id', (req, res) => {
  const { id } = req.params;
  if (db.districtItems) {
    db.districtItems = db.districtItems.filter((i) => i.id !== id);
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

// ----------------------------------------------------
// VITE MIDDLEWARE & SERVER START
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌸 Puja Samagri System Server running on http://localhost:${PORT}`);
  });
}

startServer();

