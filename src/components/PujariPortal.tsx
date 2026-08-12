import { showCustomAlert } from '../lib/customAlert';
import React, { useState, useEffect } from 'react';
import { Pujari, PujaList, QrConfig, PujaTemplate, SamagriItem, NamaYajnaDetails } from '../types';
import { VisitingCardTab } from './VisitingCardTab';
import {
  getPujaLists,
  createPujaList,
  updatePujaList,
  searchPujaLists,
  requestRedownloadUnlock,
  getTemplates,
  submitPaymentUtr,
  subscribePujaLists,
  dismissNotification,
  setListOfficePendingStatus,
  submitVisitingCardPayment,
  updatePujariCardProfile,
} from '../lib/api';
import { isOfficeOpen } from '../lib/officeHours';
import { OfficeClosedModal } from './OfficeClosedModal';
import { PujaListPDFView } from './PujaListPDFView';
import { NamaYajnaPDFView } from './NamaYajnaPDFView';
import { StoreView } from './StoreView';
import { PaymentModal } from './PaymentModal';
import { WelcomeTermsModal } from './WelcomeTermsModal';
import emailjs from '@emailjs/browser';
import {
  Plus,
  Trash2,
  Search,
  FileText,
  Lock,
  CheckCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  User,
  Phone,
  MapPin,
  Calendar,
  AlertCircle,
  Eye,
  BookOpen,
  QrCode,
  Edit2,
  Check,
  ShieldAlert,
  LogOut,
  MessageSquare,
  Paperclip,
  Send,
  HelpCircle,
  Menu,
  X,
  Flame,
} from 'lucide-react';

interface PujariPortalProps {
  pujari: Pujari;
  qrConfig: QrConfig;
  onRefreshPujari: () => void;
  onLogout?: () => void;
}

const PUJA_OPTIONS = [
  'ସତ୍ୟନାରାୟଣ ପୂଜା',
  'ଗୃହ ପ୍ରତିଷ୍ଠା / ଗୃହ ପ୍ରବେଶ',
  'ନାମକରଣ ଓ ଅନ୍ନପ୍ରାଶନ',
  'ରୁଦ୍ରାଭିଷେକ',
  'ବିବାହ ବ୍ରତ',
  'ବାସ୍ତୁ ପୂଜା',
  'ନବଗ୍ରହ ଶାନ୍ତି ପୂଜା',
  'ମୃତ୍ୟୁଞ୍ଜୟ ଯଜ୍ଞ',
  'ଚଣ୍ଡୀ ପାଠ / ପୂଜା',
  'ଶ୍ରାଦ୍ଧ କର୍ମ',
  'ଅନ୍ୟାନ୍ୟ / କଷ୍ଟମ୍ ଟାଇପ୍ କରନ୍ତୁ',
];

export const PujariPortal: React.FC<PujariPortalProps> = ({
  pujari,
  qrConfig,
  onRefreshPujari,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'nama_yajna' | 'visiting_card' | 'search' | 'profile' | 'store'>('search');
  const [showGuide, setShowGuide] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('puja_app_pujari_id');
    if (onLogout) {
      onLogout();
    }
  };

  // Nama Yajna Invitation Card Form State
  const [yajnaTypeOption, setYajnaTypeOption] = useState('ଅଷ୍ଟପ୍ରହରୀ ନାମଯଜ୍ଞ');
  const [customYajnaType, setCustomYajnaType] = useState('');
  const [yajnaDatesTithi, setYajnaDatesTithi] = useState('ବୈଶାଖ ଶୁକ୍ଳପକ୍ଷ ପ୍ରତିପଦ ଠାରୁ ତୃତୀୟା (୧୦ ମେ ରୁ ୧୨ ମେ)');
  const [yajnaVenue, setYajnaVenue] = useState('ଶ୍ରୀ ଶ୍ରୀ ରାଧାକୃଷ୍ଣ ମନ୍ଦିର ପ୍ରାଙ୍ଗଣ, ଗ୍ରାମ: ପଦ୍ମପୁର');
  const [yajnaCommitteeName, setYajnaCommitteeName] = useState('ଶ୍ରୀ ଶ୍ରୀ ରାଧାକୃଷ୍ଣ ନାମଯଜ୍ଞ ପରିଚାଳନା କମିଟି');
  const [yajnaAdhibasa, setYajnaAdhibasa] = useState('ତା୧୨/୦୫/୨୦୨୬ ରିଖ ମଙ୍ଗଳବାର ସନ୍ଧ୍ୟା ୦୬:୦୦ ଘଟିକାରେ');
  const [yajnaNamaArambha, setYajnaNamaArambha] = useState('ତା୧୩/୦୫/୨୦୨୬ ରିଖ ବୁଧବାର ସକାଳ ୦୬:୦୦ ଘଟିକାରେ');
  const [yajnaPurnahuti, setYajnaPurnahuti] = useState('ତା୧୪/୦୫/୨୦୨୬ ରିଖ ଗୁରୁବାର ଦିବା ୧୨:୦୦ ଘଟିକାରେ');
  const [yajnaPrasadSeba, setYajnaPrasadSeba] = useState('ଅପରାହ୍ନ ୧୨:୩୦ ରୁ ପ୍ରସାଦ ସେବନ');
  const [yajnaInvitationText, setYajnaInvitationText] = useState(
    'ସବିନୟ ନିବେଦନ ଏହିକି ଯେ, ଆମ୍ଭ ଗ୍ରାମର ସମସ୍ତ ଗ୍ରାମବାସୀଙ୍କ ମିଳିତ ସହଯୋଗରେ ଏହି ପବିତ୍ର ନାମଯଜ୍ଞ ମହୋତ୍ସବ ଅନୁଷ୍ଠିତ ହେବାକୁ ଯାଉଅଛି। ଏଣୁ ଆପଣମାନେ ସପରିବାର ଏହି ଯଜ୍ଞ ସ୍ଥଳରେ ଉପସ୍ଥିତ ରହି ଭଗବାନଙ୍କ ନାମସଂକୀର୍ତ୍ତନ ଶ୍ରବଣ କରି ପ୍ରସାଦ ସେବନ ପୂର୍ବକ ପୁଣ୍ୟ ହାସଲ କରିବାକୁ ସାଦର ନିମନ୍ତ୍ରଣ କରୁଅଛୁ।'
  );
  const [yajnaOrganizers, setYajnaOrganizers] = useState('ସମସ୍ତ ଗ୍ରାମବାସୀବୃନ୍ଦ');
  const [yajnaContactPhone, setYajnaContactPhone] = useState(pujari.phone || '');

  // Form State for List Creation & Editing
  const [currentEditId, setCurrentEditId] = useState<string | null>(null);
  const [selectedPujaOption, setSelectedPujaOption] = useState('');
  const [customPujaName, setCustomPujaName] = useState('');
  const [pujaName, setPujaName] = useState('');
  const [yajamanaName, setYajamanaName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('ସକାଳ ୦୮:୦୦ AM');
  const [contact, setContact] = useState(pujari.phone || '');
  const [location, setLocation] = useState(pujari.address || '');
  const [notes, setNotes] = useState('');

  // Handle Puja Dropdown Change
  const handlePujaOptionChange = (val: string) => {
    setSelectedPujaOption(val);
    if (val === 'ଅନ୍ୟାନ୍ୟ / କଷ୍ଟମ୍ ଟାଇପ୍ କରନ୍ତୁ') {
      setPujaName(customPujaName);
    } else {
      setPujaName(val);
    }
  };

  // Handle Custom Puja Name Typing
  const handleCustomPujaNameChange = (val: string) => {
    setCustomPujaName(val);
    setPujaName(val);
  };

  // Items State
  const [items, setItems] = useState<SamagriItem[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState('1');
  const [newItemUnit, setNewItemUnit] = useState('');

  // Templates State
  const [templates, setTemplates] = useState<PujaTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  // Lists & Search State
  const [userLists, setUserLists] = useState<PujaList[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);

  // Selected List for View / PDF
  const [selectedList, setSelectedList] = useState<PujaList | null>(null);

  // Real-time Office Hours State & Auto-Hide Ticker
  const [officeOpenState, setOfficeOpenState] = useState<boolean>(isOfficeOpen());
  const [officeClosedModalOpen, setOfficeClosedModalOpen] = useState(false);

  useEffect(() => {
    const checkTime = () => {
      const open = isOfficeOpen();
      setOfficeOpenState(open);
      if (open) {
        // Auto-hide modal state when office is open
        setOfficeClosedModalOpen(false);
      }
    };

    checkTime();
    const timer = setInterval(checkTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Payment Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentType, setPaymentType] = useState<'new_creation' | 'search_redownload' | 'edit_list'>('new_creation');
  const [targetListForPayment, setTargetListForPayment] = useState<PujaList | null>(null);

  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // Complaint Box Form State (EmailJS Direct Dispatch)
  const complaintFormRef = React.useRef<HTMLFormElement>(null);
  const [complaintMsg, setComplaintMsg] = useState('');
  const [complaintFile, setComplaintFile] = useState<File | null>(null);
  const [complaintLoading, setComplaintLoading] = useState(false);
  const [complaintSuccess, setComplaintSuccess] = useState('');
  const [complaintError, setComplaintError] = useState('');

  // EmailJS Credentials (Can be passed via env vars or configured directly)
  const EMAILJS_SERVICE_ID = (import.meta as any).env?.VITE_EMAILJS_SERVICE_ID || 'service_pujasamagri';
  const EMAILJS_TEMPLATE_ID = (import.meta as any).env?.VITE_EMAILJS_TEMPLATE_ID || 'template_complaint';
  const EMAILJS_PUBLIC_KEY = (import.meta as any).env?.VITE_EMAILJS_PUBLIC_KEY || 'YOUR_PUBLIC_KEY';

  const handleSendComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintMsg.trim()) {
      setComplaintError('ଦୟାକରି ଆପଣଙ୍କର ଅଭିଯୋଗ / ସମସ୍ୟା ଲେଖନ୍ତୁ।');
      return;
    }

    setComplaintLoading(true);
    setComplaintError('');
    setComplaintSuccess('');

    // Check if EmailJS keys are still default/unconfigured
    if (EMAILJS_PUBLIC_KEY === 'YOUR_PUBLIC_KEY' || !EMAILJS_PUBLIC_KEY) {
      setComplaintLoading(false);
      const mailtoUrl = `mailto:nayakjitu986@gmail.com?subject=${encodeURIComponent(`Complaint from Pujari ID: ${pujari.id} (${pujari.name})`)}&body=${encodeURIComponent(`Pujari ID: ${pujari.id}\nName: ${pujari.name}\nPhone: ${pujari.phone || 'N/A'}\n\nMessage:\n${complaintMsg}`)}`;
      
      // Open default email client
      window.location.href = mailtoUrl;

      setComplaintSuccess('EmailJS Key ନଥିବାରୁ ଆପଣଙ୍କ ଇମେଲ୍ ଆପ୍ (Gmail/Mail) ଖୋଲାଗଲା। nayakjitu986@gmail.com କୁ ସିଧାସଳଖ ମେଲ୍ ପଠାନ୍ତୁ।');
      return;
    }

    try {
      if (complaintFormRef.current) {
        await emailjs.sendForm(
          EMAILJS_SERVICE_ID,
          EMAILJS_TEMPLATE_ID,
          complaintFormRef.current,
          EMAILJS_PUBLIC_KEY
        );
      }

      setComplaintSuccess('ଆପଣଙ୍କ ଅଭିଯୋଗ ସଫଳତାର ସହ ଆଡମିନ୍ଙ୍କ ପାଖକୁ ପଠାଗଲା (nayakjitu986@gmail.com)। ଆମେ ଶୀଘ୍ର ସମାଧାନ କରିବୁ।');
      setComplaintMsg('');
      setComplaintFile(null);
      if (complaintFormRef.current) {
        complaintFormRef.current.reset();
      }
    } catch (err: any) {
      console.warn('EmailJS Dispatch Warning:', err);
      const mailtoUrl = `mailto:nayakjitu986@gmail.com?subject=${encodeURIComponent(`Complaint from Pujari ID: ${pujari.id} (${pujari.name})`)}&body=${encodeURIComponent(`Pujari ID: ${pujari.id}\nName: ${pujari.name}\nPhone: ${pujari.phone || 'N/A'}\n\nMessage:\n${complaintMsg}`)}`;
      
      setComplaintError('EmailJS ଦ୍ୱାରା ମେଲ୍ ଯାଇପାରିଲା ନାହିଁ। ଆପଣଙ୍କ EmailJS Public Key / Template ID ଯାଞ୍ଚ କରନ୍ତୁ।');
      
      // Provide direct mailto fallback link in UI
      window.open(mailtoUrl, '_blank');
    } finally {
      setComplaintLoading(false);
    }
  };

  // Load Templates and Lists with Real-time Firestore Listener
  useEffect(() => {
    loadData();

    // Subscribe to real-time lists updates in Firestore
    const unsubLists = subscribePujaLists((lists) => {
      setUserLists(lists);
      // Update currently viewed or target list if status changed to unlocked/approved
      setSelectedList((prev) => {
        if (!prev) return null;
        const updated = lists.find((l) => l.id === prev.id);
        return updated || prev;
      });
      setTargetListForPayment((prev) => {
        if (!prev) return null;
        const updated = lists.find((l) => l.id === prev.id);
        return updated || prev;
      });
    }, pujari.id);

    return () => {
      unsubLists();
    };
  }, [pujari.id]);

  const loadData = async () => {
    const tmplList = await getTemplates();
    setTemplates(tmplList);

    const lists = await getPujaLists(pujari.id);
    setUserLists(lists);
  };

  // Pre-fill items when a template is selected
  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (!templateId) return;

    const tmpl = templates.find((t) => t.id === templateId);
    if (tmpl) {
      const tmplName = tmpl.name.split(' (')[0];
      if (PUJA_OPTIONS.slice(0, -1).includes(tmplName)) {
        setSelectedPujaOption(tmplName);
        setPujaName(tmplName);
        setCustomPujaName('');
      } else {
        setSelectedPujaOption('ଅନ୍ୟାନ୍ୟ / କଷ୍ଟମ୍ ଟାଇପ୍ କରନ୍ତୁ');
        setCustomPujaName(tmplName);
        setPujaName(tmplName);
      }
      const mappedItems: SamagriItem[] = tmpl.items.map((it, idx) => ({
        id: 'item-' + (idx + 1) + '-' + Date.now(),
        name: it.name,
        quantity: it.quantity,
        unit: it.unit,
      }));
      setItems(mappedItems);
    }
  };

  // Add Item
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const newItem: SamagriItem = {
      id: 'item-' + Date.now(),
      name: newItemName.trim(),
      quantity: newItemQty.trim() || '1',
      unit: newItemUnit.trim(),
    };

    setItems([...items, newItem]);
    setNewItemName('');
    setNewItemQty('1');
    setNewItemUnit('');
  };

  // Remove Item
  const handleRemoveItem = (id: string) => {
    setItems(items.filter((it) => it.id !== id));
  };

  // Update Item in Table
  const handleUpdateItem = (id: string, field: keyof SamagriItem, value: string) => {
    setItems(
      items.map((it) => (it.id === id ? { ...it, [field]: value } : it))
    );
  };

  // Clear Edit Mode and Reset Form State
  const handleCancelEdit = () => {
    setCurrentEditId(null);
    setSelectedPujaOption('');
    setCustomPujaName('');
    setPujaName('');
    setYajamanaName('');
    setDate(new Date().toISOString().split('T')[0]);
    setTime('ସକାଳ ୦୮:୦୦ AM');
    setContact(pujari.phone || '');
    setLocation(pujari.address || '');
    setNotes('');
    setItems([]);
    setSelectedTemplateId('');
  };

  // Populate Form with Saved List Data for Editing
  const handleEditList = (list: PujaList) => {
    setCurrentEditId(list.id);
    const pName = list.pujaName || '';
    setPujaName(pName);
    if (PUJA_OPTIONS.slice(0, -1).includes(pName)) {
      setSelectedPujaOption(pName);
      setCustomPujaName('');
    } else if (pName) {
      setSelectedPujaOption('ଅନ୍ୟାନ୍ୟ / କଷ୍ଟମ୍ ଟାଇପ୍ କରନ୍ତୁ');
      setCustomPujaName(pName);
    } else {
      setSelectedPujaOption('');
      setCustomPujaName('');
    }
    setYajamanaName(list.yajamanaName || '');
    setDate(list.date || new Date().toISOString().split('T')[0]);
    setTime(list.time || 'ସକାଳ ୦୮:୦୦ AM');
    setContact(list.contact || pujari.phone || '');
    setLocation(list.location || pujari.address || '');
    setNotes(list.notes || '');
    setItems(list.items || []);
    setSelectedTemplateId('');
    setActiveTab('create');
  };

  // Create or Update List Form Submit
  const handleCreateListSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pujaName.trim() || !yajamanaName.trim()) {
      showCustomAlert('ଦୟାକରି ପୂଜାର ନାମ ଓ ଯଜମାନଙ୍କ ନାମ ଭରନ୍ତୁ।');
      return;
    }
    if (items.length === 0) {
      showCustomAlert('ଦୟାକରି ସୂଚୀରେ ଅତିକମରେ ଗୋଟିଏ ପୂଜା ସାମଗ୍ରୀ ଯୋଡ଼ନ୍ତୁ।');
      return;
    }

    try {
      setLoading(true);
      setStatusMsg('');

      // UPDATE MODE LOGIC: Update existing Firestore document
      if (currentEditId) {
        const res = await updatePujaList({
          listId: currentEditId,
          pujariId: pujari.id,
          pujaName: pujaName.trim(),
          yajamanaName: yajamanaName.trim(),
          date,
          time,
          contact,
          location,
          notes,
          items,
        });

        if (res.success && res.list) {
          await loadData();
          if (!isOfficeOpen()) {
            await setListOfficePendingStatus(res.list.id);
            await loadData();
            setOfficeClosedModalOpen(true);
            handleCancelEdit();
            return;
          }
          setTargetListForPayment(res.list);
          setPaymentType('edit_list');
          setPaymentModalOpen(true);
          setSelectedList(res.list); // Show PDF view with lock banner and unlock button
          setStatusMsg('🎉 ପୂଜା ସୂଚୀ ଅପଡେଟ୍ ହୋଇଛି! ଦୟାକରି ₹୨ ପେମେଣ୍ଟ UTR ଦାଖଲ କରନ୍ତୁ, ଆଡମିନ୍ ଅନୁମୋଦନ କଲେ PDF ଅନଲୋକ୍ ହେବ।');
          handleCancelEdit(); // Clear edit form state
        } else {
          showCustomAlert(res.message || 'ସୂଚୀ ଅପଡେଟ୍ କରିବାରେ ବିଫଳ ହେଲା।');
        }
        return;
      }

      // NEW CREATION LOGIC: Create new Firestore document
      const res = await createPujaList({
        pujariId: pujari.id,
        pujaName: pujaName.trim(),
        yajamanaName: yajamanaName.trim(),
        date,
        time,
        contact,
        location,
        notes,
        items,
      });

      if (res.success && res.list) {
        onRefreshPujari(); // Refresh free tier status
        await loadData();

        if (!isOfficeOpen()) {
          await setListOfficePendingStatus(res.list.id);
          await loadData();
          setOfficeClosedModalOpen(true);
          return;
        }

        if (res.list.isUnlocked) {
          // 1st Time FREE Creation Success!
          setSelectedList(res.list);
          setStatusMsg('🎉 ଆପଣଙ୍କ ୧ମ ପୂଜା ସୂଚୀ ମାଗଣାରେ ତିଆରି ହେଲା! ୧-ପୃଷ୍ଠା PDF ଖୋଲୁଛି।');
        } else {
          // 2nd Time Onwards: Needs ₹5 Payment Unlock!
          setTargetListForPayment(res.list);
          setPaymentType('new_creation');
          setPaymentModalOpen(true);
          setSelectedList(res.list);
        }
      } else {
        showCustomAlert(res.message || 'ସୂଚୀ ତିଆରି କରିବାରେ ବିଫଳ ହେଲା।');
      }
    } catch (err) {
      console.error(err);
      showCustomAlert('ଏକ ଅପ୍ରତ୍ୟାଶିତ ତ୍ରୁଟି ଘଟିଲା।');
    } finally {
      setLoading(false);
    }
  };

  // Handle View / Download PDF click with Office Hours check
  const handleViewPdfClick = async (list: PujaList) => {
    if (!isOfficeOpen()) {
      if (!list.isUnlocked) {
        try {
          await setListOfficePendingStatus(list.id);
          await loadData();
        } catch (e) {
          console.warn('Set pending status error:', e);
        }
      }
      setOfficeClosedModalOpen(true);
      return;
    }
    setSelectedList(list);
  };

  // Handle Search in Odia or English
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setSearching(true);
    const results = await searchPujaLists(query, pujari.id);
    setUserLists(results);
    setSearching(false);
  };

  // Request Re-download unlock (₹2)
  const handleRequestRedownloadUnlock = (list: PujaList) => {
    if (!isOfficeOpen()) {
      setListOfficePendingStatus(list.id).catch(() => {});
      setOfficeClosedModalOpen(true);
      return;
    }
    setTargetListForPayment(list);
    setPaymentType('search_redownload');
    setPaymentModalOpen(true);
  };

  // Submit UTR Number from Payment Modal
  const handleSubmitUtr = async (utrRef: string): Promise<boolean> => {
    const docType = targetListForPayment?.yajnaDetails ? 'Nama Yajna Card' : 'Puja List';

    try {
      await fetch('/api/notify-telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          utrNumber: utrRef,
          pujariName: pujari.name || pujari.phone || 'Pujari',
          docType,
          pujariId: pujari.id,
          listId: targetListForPayment?.id,
        }),
      });
    } catch (error) {
      console.warn('Backend Telegram notification warning:', error);
    }

    if (!targetListForPayment) return true;

    try {
      if (paymentType === 'new_creation') {
        await submitPaymentUtr(targetListForPayment.id, utrRef, pujari.id);
      } else {
        // Re-download request
        await requestRedownloadUnlock(targetListForPayment.id, pujari.id, utrRef);
      }

      if (!isOfficeOpen()) {
        await setListOfficePendingStatus(targetListForPayment.id);
        await loadData();
        setPaymentModalOpen(false);
        setOfficeClosedModalOpen(true);
        return true;
      }

      await loadData();
    } catch (e) {
      console.warn('Backend UTR update warning:', e);
    }
    return true;
  };

  // Create Nama Yajna Invitation Card Submit Handler
  const handleCreateNamaYajnaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalYajnaType =
      yajnaTypeOption === 'ଅନ୍ୟାନ୍ୟ / କଷ୍ଟମ୍ ଟାଇପ୍ କରନ୍ତୁ' ? customYajnaType.trim() : yajnaTypeOption;

    if (!finalYajnaType || !yajnaVenue.trim() || !yajnaCommitteeName.trim()) {
      showCustomAlert('ଦୟାକରି ଯଜ୍ଞର ନାମ, ସ୍ଥାନ ଓ କମିଟିର ନାମ ଭରନ୍ତୁ।');
      return;
    }

    try {
      setLoading(true);
      setStatusMsg('');

      const yajnaDetailsPayload: NamaYajnaDetails = {
        yajnaType: finalYajnaType,
        datesTithi: yajnaDatesTithi,
        venue: yajnaVenue,
        committeeName: yajnaCommitteeName,
        adhibasaInfo: yajnaAdhibasa,
        namaArambhaInfo: yajnaNamaArambha,
        purnahutiInfo: yajnaPurnahuti,
        prasadSebaInfo: yajnaPrasadSeba,
        invitationText: yajnaInvitationText,
        organizers: yajnaOrganizers,
        contactPhone: yajnaContactPhone,
      };

      const res = await createPujaList({
        pujariId: pujari.id,
        pujaName: finalYajnaType,
        yajamanaName: yajnaCommitteeName,
        date: yajnaDatesTithi,
        time: yajnaAdhibasa,
        contact: yajnaContactPhone,
        location: yajnaVenue,
        notes: yajnaInvitationText,
        items: [],
        yajnaDetails: yajnaDetailsPayload,
      });

      if (res.success && res.list) {
        onRefreshPujari();
        await loadData();

        if (!isOfficeOpen()) {
          await setListOfficePendingStatus(res.list.id);
          await loadData();
          setOfficeClosedModalOpen(true);
          return;
        }

        if (res.list.isUnlocked) {
          setSelectedList(res.list);
          setStatusMsg('🎉 ଆପଣଙ୍କ ନାମଯଜ୍ଞ ନିମନ୍ତ୍ରଣ ପତ୍ର (PageMaker Style) ମାଗଣାରେ ତିଆରି ହେଲା!');
        } else {
          setTargetListForPayment(res.list);
          setPaymentType('new_creation');
          setPaymentModalOpen(true);
          setSelectedList(res.list);
        }
      } else {
        showCustomAlert(res.message || 'ନାମଯଜ୍ଞ କାର୍ଡ ତିଆରି କରିବାରେ ବିଫଳ ହେଲା।');
      }
    } catch (err) {
      console.error(err);
      showCustomAlert('ନାମଯଜ୍ଞ କାର୍ଡ ସୃଷ୍ଟି କରିବାରେ ତ୍ରୁଟି।');
    } finally {
      setLoading(false);
    }
  };

  // Render Full 1-Page PDF View or Nama Yajna Card if a list is selected
  if (selectedList) {
    return (
      <>
        {selectedList.yajnaDetails ? (
          <NamaYajnaPDFView
            list={selectedList}
            pujari={pujari}
            onBack={() => {
              setSelectedList(null);
              loadData();
            }}
          />
        ) : (
          <PujaListPDFView
            list={selectedList}
            pujari={pujari}
            onBack={() => {
              setSelectedList(null);
              loadData();
            }}
            onRequestUnlock={() => {
              setTargetListForPayment(selectedList);
              setPaymentType(
                selectedList.paymentType === 'search_redownload'
                  ? 'search_redownload'
                  : 'new_creation'
              );
              setPaymentModalOpen(true);
            }}
          />
        )}

        {/* Sticky Lock & Payment Bar if List is Locked */}
        {!selectedList.isUnlocked && (
          <div className="fixed bottom-0 inset-x-0 bg-slate-950 text-white p-4 border-t-2 border-amber-500 shadow-2xl flex flex-wrap items-center justify-between gap-4 z-50 print:hidden">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-xl shrink-0">
                <Lock className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-amber-300">
                  {selectedList.paymentStatus === 'pending'
                    ? '⌛ ଆଡମିନ୍ ଅନୁମୋଦନ ଅପେକ୍ଷାରେ (Waiting for Admin Approval)'
                    : '🔒 ଏହି PageMaker କାର୍ଡ ଲକ୍ ଅଛି - ଡାଉନ୍‌ଲୋଡ୍ ପାଇଁ ₹୧୦ ପେମେଣ୍ଟ କରନ୍ତୁ'}
                </h4>
                <p className="text-xs text-slate-300 font-medium mt-0.5">
                  {selectedList.paymentStatus === 'pending'
                    ? `ଆପଣ UTR ଦାଖଲ କରିଛନ୍ତି। ଆଡମିନ୍ ଯାଞ୍ଚ କରିବା ପରେ ଡାଉନ୍‌ଲୋଡ୍ ଅନଲୋକ୍ ହେବ।`
                    : `UPI ଦ୍ୱାରା ₹୧୦ ଦେଇ ତୁରନ୍ତ PageMaker Odia PDF ଅନଲୋକ୍ କରନ୍ତୁ।`}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setTargetListForPayment(selectedList);
                setPaymentType('new_creation');
                setPaymentModalOpen(true);
              }}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs sm:text-sm shadow-lg transition cursor-pointer flex items-center gap-2"
            >
              <QrCode className="w-4 h-4" />
              <span>
                {selectedList.paymentStatus === 'pending'
                  ? 'UTR ବଦଳାନ୍ତୁ (Update UTR)'
                  : '₹୧୦ ଦେଇ ଅନଲୋକ୍ କରନ୍ତୁ (Pay ₹10)'}
              </span>
            </button>
          </div>
        )}

        <PaymentModal
          isOpen={paymentModalOpen}
          onClose={() => {
            setPaymentModalOpen(false);
            loadData();
          }}
          type={paymentType}
          qrConfig={qrConfig}
          list={targetListForPayment}
          onSubmitUtr={handleSubmitUtr}
        />
      </>
    );
  }

  const isRejected =
    pujari.status === 'suspended' ||
    pujari.isBlocked ||
    Boolean(pujari.rejectionReason) ||
    userLists.some((l) => l.paymentStatus === 'rejected' && Boolean(l.rejectionReason));

  const activeRejectionReason =
    pujari.rejectionReason ||
    userLists.find((l) => l.paymentStatus === 'rejected' && l.rejectionReason)?.rejectionReason ||
    'ପେମେଣ୍ଟ ତଥ୍ୟ/UTR ମେଳ ଖାଉନାହିଁ।';

  const showGreenNotification =
    Boolean(pujari.hasUnreadNotification) && Boolean(pujari.systemMessage) && !isRejected;

  const systemMessage =
    pujari.systemMessage || 'ଖୁସି ଖବର! ଆପଣଙ୍କ ଆକାଉଣ୍ଟ/ପେମେଣ୍ଟ ସଫଳତାର ସହ ଅନଲକ୍ କରାଯାଇଛି।';

  return (
    <div className="min-h-screen bg-[#FFFBF0] pb-28 w-full max-w-full overflow-x-hidden box-border">
      {/* 1. TOP HEADER NAVIGATION BAR */}
      <header className="w-full max-w-full bg-gradient-to-r from-[#701a1e] via-[#8B0000] to-[#701a1e] text-white shadow-lg sticky top-0 z-40 border-b-2 border-amber-400 px-3 sm:px-6 py-2.5 sm:py-3 box-border">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Far Left: Hamburger Menu Icon Button (☰) */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2.5 rounded-2xl bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 border border-amber-400/50 transition cursor-pointer flex items-center justify-center min-w-[44px] min-h-[44px] shadow-2xs active:scale-95"
            aria-label="Open Mobile Menu"
            title="ମେନ୍ୟୁ ଖୋଲନ୍ତୁ"
          >
            <Menu className="w-6 h-6 text-amber-300 stroke-[2.5]" />
          </button>

          {/* Center: Branded Title with Sacred Om Icon and "Puja List" text */}
          <div
            className="flex items-center gap-2.5 cursor-pointer select-none"
            onClick={() => setActiveTab('search')}
          >
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-500 text-amber-950 flex items-center justify-center text-lg font-black shadow-md shrink-0 border border-amber-300">
              🕉️
            </div>
            <div className="flex flex-col">
              <span className="font-black text-base sm:text-lg text-amber-100 tracking-tight leading-none flex items-center gap-1.5">
                <span>Puja List</span>
                <span className="text-amber-950 text-[10px] sm:text-xs font-black bg-amber-400 px-2 py-0.5 rounded-full border border-amber-300">
                  ପୂଜା ପୋର୍ଟାଲ
                </span>
              </span>
              <span className="text-[10px] text-amber-200/90 font-bold leading-tight">
                ପୂଜାରୀ ଆପ୍ ପୋର୍ଟାଲ
              </span>
            </div>
          </div>

          {/* Far Right: Profile / User Icon */}
          <button
            onClick={() => setActiveTab('profile')}
            className={`p-1.5 sm:px-3 sm:py-1.5 bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 border border-amber-400/50 rounded-2xl transition cursor-pointer flex items-center gap-2 min-h-[44px] shadow-2xs ${
              activeTab === 'profile' ? 'ring-2 ring-amber-400 bg-amber-400/30' : ''
            }`}
            aria-label="Profile Settings"
            title="ପ୍ରୋଫାଇଲ୍"
          >
            <div className="w-7 h-7 bg-amber-400 text-amber-950 rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
              <User className="w-4 h-4" />
            </div>
            <span className="hidden sm:inline text-xs font-black text-amber-100 pr-1">
              {pujari.name.split(' ')[0]}
            </span>
          </button>
        </div>
      </header>

      {/* HAMBURGER SLIDE DRAWER OVERLAY */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Slide Content Drawer */}
          <div className="relative flex-1 max-w-xs w-full bg-white shadow-2xl flex flex-col justify-between p-5 z-10 animate-in slide-in-from-left duration-200">
            <div className="space-y-6">
              {/* Drawer Top Header */}
              <div className="flex items-center justify-between border-b border-amber-200 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-amber-700 text-white flex items-center justify-center font-black text-xl shadow-md">
                    🕉️
                  </div>
                  <div>
                    <h3 className="text-base font-black text-amber-950">ପୂଜା ପୋର୍ଟାଲ</h3>
                    <p className="text-xs text-slate-500 font-bold">ID: {pujari.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Pujari Profile Summary */}
              <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl space-y-1">
                <p className="text-xs text-slate-500 font-bold">ପୂଜାରୀଙ୍କ ନାମ:</p>
                <p className="text-sm font-black text-amber-950">{pujari.name}</p>
                <p className="text-xs text-slate-600 font-medium">📱 {pujari.phone || 'N/A'}</p>
              </div>

              {/* Menu Navigation Links */}
              <nav className="space-y-2">
                <button
                  onClick={() => {
                    setActiveTab('search');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full p-3 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-3 transition cursor-pointer ${
                    activeTab === 'search'
                      ? 'bg-amber-700 text-white shadow-md'
                      : 'bg-amber-50/60 text-amber-950 hover:bg-amber-100 border border-amber-200'
                  }`}
                >
                  <Calendar className="w-5 h-5 text-amber-400" />
                  <span>📅 ମୋ ପୂଜା ସୂଚୀ (Puja List)</span>
                </button>

                <button
                  onClick={() => {
                    handleCancelEdit();
                    setActiveTab('create');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full p-3 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-3 transition cursor-pointer ${
                    activeTab === 'create'
                      ? 'bg-amber-700 text-white shadow-md'
                      : 'bg-amber-50/60 text-amber-950 hover:bg-amber-100 border border-amber-200'
                  }`}
                >
                  <Edit2 className="w-5 h-5 text-amber-400" />
                  <span>✏️ ନୂତନ ସୂଚୀ ତିଆରି (Create / Edit)</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('nama_yajna');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full p-3 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-3 transition cursor-pointer ${
                    activeTab === 'nama_yajna'
                      ? 'bg-gradient-to-r from-amber-700 to-amber-800 text-amber-100 shadow-md'
                      : 'bg-amber-50/60 text-amber-950 hover:bg-amber-100 border border-amber-200'
                  }`}
                >
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <span>💌 ନାମଯଜ୍ଞ କାର୍ଡ (Invite Card)</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('visiting_card');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full p-3 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-3 transition cursor-pointer ${
                    activeTab === 'visiting_card'
                      ? 'bg-gradient-to-r from-amber-700 to-amber-800 text-amber-100 shadow-md'
                      : 'bg-amber-50/60 text-amber-950 hover:bg-amber-100 border border-amber-200'
                  }`}
                >
                  <span className="text-lg leading-none">🎴</span>
                  <span>🎴 ଭିଜିଟିଂ କାର୍ଡ (Visiting Card)</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('store');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full p-3 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-3 transition cursor-pointer ${
                    activeTab === 'store'
                      ? 'bg-gradient-to-r from-red-800 to-amber-800 text-amber-100 shadow-md'
                      : 'bg-amber-50/60 text-amber-950 hover:bg-amber-100 border border-amber-200'
                  }`}
                >
                  <span className="text-lg leading-none">🛍️</span>
                  <span>🛍️ ପୂଜା ସାମଗ୍ରୀ ଷ୍ଟୋର୍ (Store)</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('profile');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full p-3 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-3 transition cursor-pointer ${
                    activeTab === 'profile'
                      ? 'bg-amber-700 text-white shadow-md'
                      : 'bg-amber-50/60 text-amber-950 hover:bg-amber-100 border border-amber-200'
                  }`}
                >
                  <User className="w-5 h-5 text-amber-400" />
                  <span>👤 ପ୍ରୋଫାଇଲ୍ ସେଟିଂସ (Profile)</span>
                </button>
              </nav>

              {/* Guide Quick Toggle */}
              <div className="pt-2">
                <button
                  onClick={() => {
                    setShowGuide(!showGuide);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full p-3 bg-amber-100 hover:bg-amber-200 text-amber-950 rounded-2xl text-xs font-black border border-amber-300 flex items-center justify-between cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-amber-800" />
                    <span>ବ୍ୟବହାର ଗାଇଡ୍ (Guide)</span>
                  </span>
                  <span>{showGuide ? '✓ ଖୋଲା' : '👁️ ଦେଖନ୍ତୁ'}</span>
                </button>
              </div>
            </div>

            {/* Logout Button */}
            <div className="pt-6 border-t border-slate-200">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full py-3 bg-rose-100 hover:bg-rose-200 text-rose-950 font-black rounded-2xl text-xs sm:text-sm transition flex items-center justify-center gap-2 border border-rose-300 cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-rose-700" />
                <span>ଲଗ୍‌ଆଉଟ୍ (Log Out)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN BODY CONTAINER */}
      <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-5 w-full max-w-full box-border">
        {/* OFFICIAL WORKING HOURS STATUS BANNER */}
        <div
          className={`p-3.5 sm:p-4 rounded-3xl border-2 flex flex-wrap items-center justify-between gap-3 shadow-md ${
            officeOpenState
              ? 'bg-emerald-50 border-emerald-400 text-emerald-950'
              : 'bg-amber-50 border-amber-400 text-amber-950'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-2xl border ${
                officeOpenState
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-amber-200 text-amber-900 border-amber-400'
              }`}
            >
              <Clock className={`w-5 h-5 ${officeOpenState ? '' : 'animate-pulse'}`} />
            </div>
            <div>
              <div className="flex items-center gap-2 font-black text-xs sm:text-sm">
                <span>
                  {officeOpenState
                    ? '🟢 ଅଫିସ୍ ଖୋଲା ଅଛି (Office OPEN)'
                    : '⚠️ ବର୍ତ୍ତମାନ ଅଫିସ୍ ବନ୍ଦ ଅଛି (Office CLOSED)'}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs font-bold text-slate-700 mt-0.5">
                କାର୍ଯ୍ୟ ସମୟ: ସୋମବାର - ଶନିବାର, ସକାଳ ୧୦:୦୦ ରୁ ଦିନ ୦୨:୦୦ (ରବିବାର ଛୁଟି)
              </p>
            </div>
          </div>
          {!officeOpenState && (
            <button
              onClick={() => setOfficeClosedModalOpen(true)}
              className="px-3.5 py-2 bg-amber-800 hover:bg-amber-900 text-white rounded-2xl text-xs font-black transition cursor-pointer shadow-xs"
            >
              ସୂଚନା ଦେଖନ୍ତୁ (Notice)
            </button>
          )}
        </div>

        {/* 2. HERO BANNER & ACTION BUTTON */}
        <div className="space-y-3">
          {/* Gorgeous Wide Rounded Deities Hero Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-950 via-amber-950 to-red-950 border-2 border-amber-400 p-5 sm:p-7 shadow-xl text-amber-100">
            {/* Background glowing orb accents */}
            <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-10 -top-10 w-48 h-48 bg-red-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-amber-400/20 backdrop-blur-md rounded-full border border-amber-400/40 text-amber-200 text-xs font-black shadow-xs">
                  <span>🚩 ଜୟ ଜଗନ୍ନାଥ</span>
                  <span>•</span>
                  <span>ଶ୍ରୀକ୍ଷେତ୍ର ଧାମ, ପୁରୀ</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-amber-100 tracking-tight leading-snug">
                  ଶ୍ରୀ ଜଗନ୍ନାଥ ମହାପ୍ରଭୁଙ୍କ ଦିବ୍ୟ ଆଶୀର୍ବାଦ ସହ ପୂଜା ସୂଚୀ ତିଆରି କରନ୍ତୁ
                </h2>
                <p className="text-xs sm:text-sm text-amber-200/90 font-bold max-w-xl leading-relaxed">
                  ମାତ୍ର ୧ ମିନିଟ୍‌ରେ Odia ପୂଜା ସାମଗ୍ରୀ ସୂଚୀ ତିଆରି କରନ୍ତୁ ଏବଂ ଯଜମାନଙ୍କ ପାଇଁ ସୁନ୍ଦର ୧-ପୃଷ୍ଠା PDF ଡାଉନଲୋଡ୍ କରନ୍ତୁ।
                </p>
              </div>

              {/* Jagannath Trinity Deities Visual Representation */}
              <div className="shrink-0 flex items-center justify-center gap-3 bg-black/40 p-3.5 rounded-2xl border border-amber-400/40 backdrop-blur-md shadow-md">
                <div className="flex items-center gap-2 text-2xl sm:text-3xl">
                  <span title="Lord Jagannath (ଶ୍ରୀ ଜଗନ୍ନାଥ)">🛕</span>
                  <span title="Devi Subhadra (ଦେବୀ ସୁଭଦ୍ରା)" className="text-amber-400">
                    🌺
                  </span>
                  <span title="Lord Balabhadra (ଶ୍ରୀ ବଳଭଦ୍ର)">🕉️</span>
                </div>
              </div>
            </div>
          </div>

          {/* Full-width Deep Red / Maroon Action Button */}
          <button
            onClick={() => {
              handleCancelEdit();
              setActiveTab('create');
            }}
            className="w-full py-4 px-6 bg-gradient-to-r from-red-900 via-rose-950 to-red-900 hover:from-red-950 hover:to-red-900 text-amber-100 border-2 border-amber-400/80 rounded-2xl sm:rounded-3xl text-base sm:text-lg font-black transition shadow-xl cursor-pointer flex items-center justify-center gap-3 active:scale-[0.99] tracking-wide"
          >
            <Plus className="w-6 h-6 text-amber-300 stroke-[3]" />
            <span>+ Create New Puja List (ନୂତନ ପୂଜା ସୂଚୀ ତିଆରି)</span>
          </button>
        </div>
      {/* 1. UN-DISMISSIBLE RED NOTIFICATION BANNER (Rejection / Lock Notice) */}
      {isRejected && (
        <div className="bg-rose-50 border-2 border-rose-500 rounded-3xl p-4 sm:p-6 shadow-xl space-y-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-rose-600 text-white rounded-2xl shrink-0 mt-0.5 shadow-md">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div className="flex-1 space-y-1.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-base sm:text-lg font-black text-rose-950 uppercase tracking-wide">
                  🚨 ସତର୍କ ସୂଚନା: ଆପଣଙ୍କ ରିକ୍ୱେଷ୍ଟ/ଆକାଉଣ୍ଟ ଖାରଜ କରାଯାଇଛି (Locked / Rejected)
                </h3>
                <span className="px-3 py-1 bg-rose-200 text-rose-950 rounded-full text-xs font-black uppercase border border-rose-300">
                  LOCKED
                </span>
              </div>
              <p className="text-xs sm:text-sm font-extrabold text-rose-900 leading-relaxed bg-white/80 p-3 rounded-xl border border-rose-200">
                ଖାରଜର କାରଣ (Reason):{' '}
                <span className="text-rose-950 font-black underline decoration-rose-400">
                  {activeRejectionReason}
                </span>
              </p>
              <p className="text-xs font-bold text-rose-800">
                ଦୟାକରି ଆଡମିନ୍ଙ୍କ ସହ ଯୋଗାଯୋଗ କରନ୍ତୁ କିମ୍ବା ସଠିକ୍ UTR ସହ ପୁନର୍ବାର ସସମିଟ୍ କରନ୍ତୁ।
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2. DISMISSIBLE GREEN NOTIFICATION BANNER (Unlock / System Message Alert) */}
      {showGreenNotification && (
        <div className="bg-emerald-50 border-2 border-emerald-400 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-wrap items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-emerald-600 text-white rounded-2xl shrink-0 mt-0.5 shadow-md">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-extrabold text-emerald-950">
                  🎉 ଖୁସି ଖବର / Unlocked System Alert
                </h3>
                <span className="px-2.5 py-0.5 bg-emerald-200 text-emerald-900 rounded-md text-[10px] font-black uppercase">
                  NEW
                </span>
              </div>
              <p className="text-xs sm:text-sm font-bold text-emerald-900 leading-relaxed">
                {systemMessage}
              </p>
            </div>
          </div>

          <button
            onClick={async () => {
              await dismissNotification(pujari.id);
              if (onRefreshPujari) onRefreshPujari();
            }}
            className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs sm:text-sm rounded-xl transition shadow-md cursor-pointer shrink-0 flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>OK / ବୁଝିଗଲି</span>
          </button>
        </div>
      )}
      {/* Top Banner & Tabs */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-amber-300 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-3 py-1 bg-amber-100 text-amber-950 font-extrabold rounded-lg text-xs border border-amber-300">
              ପୂଜାରୀ ପୋର୍ଟାଲ
            </span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                pujari.status === 'active'
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  : 'bg-rose-100 text-rose-900 border border-rose-300'
              }`}
            >
              ସ୍ଥିତି: {pujari.status === 'active' ? 'ସକ୍ରିୟ (Active)' : 'ନିଷିଦ୍ଧ (Suspended)'}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            ସ୍ୱାଗତମ୍, {pujari.name}
          </h2>
          <p className="text-xs text-slate-600 font-medium">
            ପୂଜାରୀ ID: <strong className="font-mono text-slate-900 text-xs">{pujari.id}</strong> | ମୋବାଇଲ୍: {pujari.phone || 'N/A'}
          </p>
        </div>

        {/* Navigation Tabs in Odia */}
        <div className="flex flex-wrap items-center bg-amber-50/80 p-2 rounded-2xl border-2 border-amber-300 text-xs sm:text-sm font-black gap-1.5">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-3 rounded-xl transition cursor-pointer flex items-center gap-2 min-h-[44px] ${
              activeTab === 'create'
                ? 'bg-amber-700 text-white shadow-sm font-black'
                : 'text-amber-950 hover:bg-amber-100'
            }`}
          >
            <Plus className="w-4 h-4" /> ପୂଜା ସୂଚୀ ତିଆରି
          </button>
          <button
            onClick={() => setActiveTab('nama_yajna')}
            className={`px-4 py-3 rounded-xl transition cursor-pointer flex items-center gap-2 min-h-[44px] ${
              activeTab === 'nama_yajna'
                ? 'bg-gradient-to-r from-amber-800 to-amber-900 text-amber-100 shadow-sm font-black border border-amber-500'
                : 'text-amber-900 bg-amber-200/80 hover:bg-amber-200 border border-amber-300'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>🌸 ନାମଯଜ୍ଞ କାର୍ଡ (PageMaker PDF)</span>
          </button>
          <button
            onClick={() => setActiveTab('store')}
            className={`px-4 py-3 rounded-xl transition cursor-pointer flex items-center gap-2 min-h-[44px] ${
              activeTab === 'store'
                ? 'bg-gradient-to-r from-red-800 to-amber-900 text-amber-100 shadow-sm font-black border border-amber-500'
                : 'text-amber-900 bg-amber-200/80 hover:bg-amber-200 border border-amber-300 font-black'
            }`}
          >
            <span className="text-base leading-none">🛍️</span>
            <span>ପୂଜା ସାମଗ୍ରୀ ଷ୍ଟୋର୍ (Store)</span>
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`px-4 py-3 rounded-xl transition cursor-pointer flex items-center gap-2 min-h-[44px] ${
              activeTab === 'search'
                ? 'bg-amber-700 text-white shadow-sm font-black'
                : 'text-amber-950 hover:bg-amber-100'
            }`}
          >
            <Search className="w-4 h-4" /> ମୋର ସୂଚୀ ({userLists.length})
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-3 rounded-xl transition cursor-pointer flex items-center gap-2 min-h-[44px] ${
              activeTab === 'profile'
                ? 'bg-amber-700 text-white shadow-sm font-black'
                : 'text-amber-950 hover:bg-amber-100'
            }`}
          >
            <User className="w-4 h-4" /> ପ୍ରୋଫାଇଲ୍
          </button>
        </div>
      </div>

      {/* PROMINENT HOME PAGE DUAL BANNER POSTER CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 my-1">
        {/* Card 1: Create Puja List */}
        <div
          onClick={() => setActiveTab('create')}
          className="bg-gradient-to-br from-[#5c0f12] via-[#8B0000] to-[#3a0608] text-white border-2 border-amber-400 rounded-3xl p-6 sm:p-7 shadow-xl relative overflow-hidden group hover:shadow-2xl hover:border-amber-300 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer flex flex-col justify-between min-h-[210px]"
        >
          {/* Decorative background glow */}
          <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-400/20 transition-all pointer-events-none" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle,_var(--tw-gradient-stops))] from-amber-400/20 via-transparent to-transparent pointer-events-none" />

          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-3.5 py-1 bg-amber-400/20 border border-amber-400/60 text-amber-300 font-extrabold rounded-full text-xs flex items-center gap-1.5 backdrop-blur-xs">
                <span>✨</span>
                <span>ପ୍ରାଥମିକ ସେବା</span>
              </span>
              <div className="w-12 h-12 bg-amber-400/20 border border-amber-400/50 rounded-2xl flex items-center justify-center text-2xl shadow-inner text-amber-300 group-hover:scale-110 transition-transform">
                📜
              </div>
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-black text-amber-100 tracking-tight leading-tight flex items-center gap-2">
                <span>ପୂଜା ଲିଷ୍ଟ ତିଆରି କରନ୍ତୁ</span>
              </h3>
              <p className="text-xs text-amber-200/90 font-bold mt-1">
                (Create Puja List)
              </p>
              <p className="text-xs text-amber-100/80 font-medium mt-2 leading-relaxed">
                ସହଜରେ ପୂଜା ତଥ୍ୟ ପୂରଣ କରନ୍ତୁ, ନୂତନ ସାମଗ୍ରୀ ସୂଚୀ ତିଆରି କରନ୍ତୁ ଏବଂ Odia PDF ଡାଉନଲୋଡ୍ କରନ୍ତୁ।
              </p>
            </div>
          </div>

          <div className="relative z-10 pt-4 mt-2 border-t border-amber-500/30 flex items-center justify-between">
            <span className="text-xs font-black text-amber-300 flex items-center gap-1">
              <span>⚡ ୧ମ ସୂଚୀ ମାଗଣା (Free)</span>
            </span>
            <button
              type="button"
              className="px-5 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-amber-950 font-black rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 group-hover:px-6 cursor-pointer"
            >
              <span>ତିଆରି କରନ୍ତୁ</span>
              <span className="text-base group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </div>
        </div>

        {/* Card 2: Order from Puja Store */}
        <div
          onClick={() => setActiveTab('store')}
          className="bg-gradient-to-br from-[#3b080b] via-[#701a1e] to-amber-950 text-white border-2 border-amber-400 rounded-3xl p-6 sm:p-7 shadow-xl relative overflow-hidden group hover:shadow-2xl hover:border-amber-300 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer flex flex-col justify-between min-h-[210px]"
        >
          {/* Decorative background glow */}
          <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-400/20 transition-all pointer-events-none" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle,_var(--tw-gradient-stops))] from-amber-400/20 via-transparent to-transparent pointer-events-none" />

          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-3.5 py-1 bg-emerald-500/20 border border-emerald-400/60 text-emerald-300 font-extrabold rounded-full text-xs flex items-center gap-1.5 backdrop-blur-xs">
                <span>🚚</span>
                <span>Cash on Delivery</span>
              </span>
              <div className="w-12 h-12 bg-amber-400/20 border border-amber-400/50 rounded-2xl flex items-center justify-center text-2xl shadow-inner text-amber-300 group-hover:scale-110 transition-transform">
                🛍️
              </div>
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-black text-amber-100 tracking-tight leading-tight flex items-center gap-2">
                <span>ପୂଜା ଦୋକାନ ଅର୍ଡର୍ କରନ୍ତୁ</span>
              </h3>
              <p className="text-xs text-amber-200/90 font-bold mt-1">
                (Order from Puja Store)
              </p>
              <p className="text-xs text-amber-100/80 font-medium mt-2 leading-relaxed">
                ଶୁଦ୍ଧ ପୂଜା ସାମଗ୍ରୀ, ଯଜ୍ଞ କାଠ, ଘିଅ ଏବଂ ସମ୍ପୂର୍ଣ୍ଣ କିଟ୍ ଘରେ ବସି ସହଜରେ ଅର୍ଡର୍ କରନ୍ତୁ।
              </p>
            </div>
          </div>

          <div className="relative z-10 pt-4 mt-2 border-t border-amber-500/30 flex items-center justify-between">
            <span className="text-xs font-black text-emerald-300 flex items-center gap-1">
              <span>📦 ସିଧାସଳଖ ଘରକୁ ହୋମ୍ ଡେଲିଭରୀ</span>
            </span>
            <button
              type="button"
              className="px-5 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-amber-950 font-black rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 group-hover:px-6 cursor-pointer"
            >
              <span>ଅର୍ଡର୍ କରନ୍ତୁ</span>
              <span className="text-base group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </div>
        </div>
      </div>

      {/* STEP-BY-STEP INSTRUCTIONS GUIDE FOR PUJARIS */}
      <div className="bg-gradient-to-r from-amber-500/15 via-amber-100/90 to-amber-500/15 border-2 border-amber-400 rounded-3xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-700 text-white rounded-2xl shadow-xs shrink-0">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-amber-950 flex items-center gap-2">
                <span>📖 କିପରି ବ୍ୟବହାର କରିବେ? (How to Use Portal Guide)</span>
              </h3>
              <p className="text-xs font-black text-amber-900">
                ପୂଜା ସୂଚୀ ତିଆରି, UTR ଦାଖଲ ଓ PDF ଡାଉନଲୋଡ୍ କରିବାର ସହଜ ୪ଟି ନିୟମ:
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="px-4 py-2 bg-amber-200 hover:bg-amber-300 text-amber-950 rounded-xl text-xs font-black transition cursor-pointer border border-amber-400 shrink-0 flex items-center gap-1.5"
          >
            <span>{showGuide ? '✕ ଲୁଚାନ୍ତୁ (Hide Guide)' : '👁️ ଦେଖନ୍ତୁ (Show Guide)'}</span>
          </button>
        </div>

        {showGuide && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-amber-300">
            <div className="bg-white p-3.5 rounded-2xl border-2 border-amber-200 shadow-2xs space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 bg-amber-700 text-white font-black text-xs rounded-full flex items-center justify-center shrink-0">
                  ୧
                </span>
                <h4 className="text-xs sm:text-sm font-black text-slate-900">୧. ସୂଚୀ ତିଆରି କରନ୍ତୁ</h4>
              </div>
              <p className="text-xs text-slate-700 font-bold leading-relaxed">
                ପୂଜାର ନାମ, ଯଜମାନଙ୍କ ନାମ, ତାରିଖ ଓ ସାମଗ୍ରୀ ସୂଚୀ ଲେଖି ଫର୍ମ ସବମିଟ୍ କରନ୍ତୁ।
              </p>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border-2 border-amber-200 shadow-2xs space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 bg-amber-700 text-white font-black text-xs rounded-full flex items-center justify-center shrink-0">
                  ୨
                </span>
                <h4 className="text-xs sm:text-sm font-black text-slate-900">୨. QR କୋଡ୍ ସ୍କାନ୍ କରନ୍ତୁ</h4>
              </div>
              <p className="text-xs text-slate-700 font-bold leading-relaxed">
                PhonePe, Google Pay କିମ୍ବା Paytm ରେ QR ସ୍କାନ୍ କରି ₹୫ (କିମ୍ବା ₹୨) ପେମେଣ୍ଟ କରନ୍ତୁ।
              </p>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border-2 border-amber-200 shadow-2xs space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 bg-amber-700 text-white font-black text-xs rounded-full flex items-center justify-center shrink-0">
                  ୩
                </span>
                <h4 className="text-xs sm:text-sm font-black text-slate-900">୩. UTR ନମ୍ବର ଦିଅନ୍ତୁ</h4>
              </div>
              <p className="text-xs text-slate-700 font-bold leading-relaxed">
                ପେମେଣ୍ଟ୍ ସରିବା ପରେ ୧୨-ଅଙ୍କ ବିଶିଷ୍ଟ UTR / Ref No. ଲେଖି Submit UTR କରନ୍ତୁ।
              </p>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border-2 border-emerald-300 bg-emerald-50/50 shadow-2xs space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 bg-emerald-700 text-white font-black text-xs rounded-full flex items-center justify-center shrink-0">
                  ୪
                </span>
                <h4 className="text-xs sm:text-sm font-black text-emerald-950">୪. PDF ଡାଉନଲୋଡ୍</h4>
              </div>
              <p className="text-xs text-emerald-900 font-bold leading-relaxed">
                ଆଡମିନ୍ ଅନୁମୋଦନ ପରେ "PDF ଦେଖନ୍ତୁ" ବଟନ୍‌ରୁ ୧-ପୃଷ୍ଠା Odia PDF ଡାଉନଲୋଡ୍ କରନ୍ତୁ!
              </p>
            </div>
          </div>
        )}
      </div>

      {statusMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 font-bold rounded-2xl text-xs sm:text-sm flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-700 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* TAB: PUJA SAMAGRI STORE */}
      {activeTab === 'store' && <StoreView userPhone={pujari.phone} />}

      {/* TAB 1: CREATE NEW PUJA SAMAGRI LIST */}
      {activeTab === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Input Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-amber-300 shadow-xs space-y-5">
              <div className="flex flex-wrap items-center justify-between border-b border-amber-200 pb-3 gap-2">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-700" />
                  <span>{currentEditId ? `ପୂଜା ସୂଚୀ ସମ୍ପାଦନ (${currentEditId})` : 'ପୂଜା ତଥ୍ୟ ଓ ସାମଗ୍ରୀ ଫର୍ମ'}</span>
                </h3>
                <div className="flex items-center gap-2">
                  {currentEditId && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="text-xs font-extrabold text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1 rounded-full border border-rose-300 transition cursor-pointer"
                    >
                      ✕ ବାତିଲ କରନ୍ତୁ (Cancel Edit)
                    </button>
                  )}
                  <span className="text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                    {currentEditId
                      ? 'ସମ୍ପାଦନ ମୋଡ୍'
                      : !pujari.freeTierUsed
                      ? '୧ମ ସୂଚୀ: ମାଗଣା (FREE)'
                      : 'ନୂଆ ସୂଚୀ: ₹୫'}
                  </span>
                </div>
              </div>

              {/* Template Quick Selection Dropdown */}
              <div>
                <label className="block text-xs font-extrabold text-amber-950 mb-1 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-amber-700" />
                  -- ପୂର୍ବ ପ୍ରସ୍ତୁତ ପୂଜା ଟେମ୍ପଲେଟ୍ ବାଛନ୍ତୁ (Optional Template) --
                </label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => handleSelectTemplate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-amber-50/60 border border-amber-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">-- ନିଜେ ସାମଗ୍ରୀ ଲେଖନ୍ତୁ କିମ୍ବା ଟେମ୍ପଲେଟ୍ ସିଲେକ୍ଟ କରନ୍ତୁ --</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.items.length} ଟି ସାମଗ୍ରୀ)
                    </option>
                  ))}
                </select>
              </div>

              {/* Puja & Yajamana Details Grid */}
              <form onSubmit={handleCreateListSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      ପୂଜାର ନାମ (Puja Name) <span className="text-rose-600">*</span>
                    </label>
                    <select
                      required
                      value={selectedPujaOption}
                      onChange={(e) => handlePujaOptionChange(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none bg-white text-slate-900"
                    >
                      <option value="">-- ବାଛନ୍ତୁ (Select Puja) --</option>
                      {PUJA_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>

                    {selectedPujaOption === 'ଅନ୍ୟାନ୍ୟ / କଷ୍ଟମ୍ ଟାଇପ୍ କରନ୍ତୁ' && (
                      <div className="mt-2">
                        <input
                          type="text"
                          required
                          placeholder="କଷ୍ଟମ୍ ପୂଜା ନାମ ଲେଖନ୍ତୁ (Type Custom Puja Name)"
                          value={customPujaName}
                          onChange={(e) => handleCustomPujaNameChange(e.target.value)}
                          className="w-full px-3.5 py-2.5 border border-amber-400 bg-amber-50/50 rounded-xl text-xs sm:text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none text-slate-900"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      ଯଜମାନଙ୍କ ନାମ (Yajamana Name) <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="ଯଥା: ରମେଶ କୁମାର ମହାପାତ୍ର"
                      value={yajamanaName}
                      onChange={(e) => setYajamanaName(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">ତାରିଖ (Date)</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">ସମୟ (Time)</label>
                    <input
                      type="text"
                      placeholder="ଯଥା: ସକାଳ ୦୮:୦୦ AM"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">ଯୋଗାଯୋଗ ନମ୍ବର (Contact)</label>
                    <input
                      type="tel"
                      placeholder="ଯଥା: 9876543210"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">ପୂଜା ସ୍ଥାନ / ଠିକଣା</label>
                    <input
                      type="text"
                      placeholder="ଯଥା: ଭୁବନେଶ୍ୱର, ଗୃହ ନଂ-୧୨"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">ଯଜମାନଙ୍କ ପାଇଁ ସ୍ୱତନ୍ତ୍ର ସୂଚନା / ନୋଟ୍</label>
                  <input
                    type="text"
                    placeholder="ଯଥା: ପୂଜା ପୂର୍ବରୁ ଗଙ୍ଗାଜଳ ଓ ପଞ୍ଚାମୃତ ସଜାଡ଼ି ରଖିବେ"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                {/* SAMAGRI ITEMS SECTION */}
                <div className="pt-4 border-t border-amber-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-extrabold text-slate-900">
                      ପୂଜା ସାମଗ୍ରୀ ସୂଚୀ ({items.length} ଟି ଆଇଟମ୍)
                    </h4>
                    <span className="text-xs text-amber-900 font-bold">
                      ତଳେ ନୂଆ ସାମଗ୍ରୀ ଯୋଡ଼ନ୍ତୁ
                    </span>
                  </div>

                  {/* Add Item Form Bar */}
                  <div className="p-3 bg-amber-50/80 border border-amber-300 rounded-2xl flex flex-wrap sm:flex-nowrap gap-2 items-center mb-4">
                    <input
                      type="text"
                      placeholder="ସାମଗ୍ରୀ ନାମ (ଯଥା: କୁଙ୍କୁମ, ଦୀପ)"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      className="flex-1 min-w-[140px] px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs sm:text-sm font-bold outline-none"
                    />
                    <input
                      type="text"
                      placeholder="ପରିମାଣ"
                      value={newItemQty}
                      onChange={(e) => setNewItemQty(e.target.value)}
                      className="w-20 px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs sm:text-sm font-bold outline-none text-center"
                    />
                    <input
                      type="text"
                      placeholder="ଏକକ (ଉଦା: ଗୋଟି, କିଲୋ)"
                      value={newItemUnit}
                      onChange={(e) => setNewItemUnit(e.target.value)}
                      className="w-32 sm:w-36 px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs sm:text-sm font-bold outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white font-extrabold rounded-xl text-xs transition cursor-pointer shrink-0 shadow-xs"
                    >
                      + ଯୋଡ଼ନ୍ତୁ
                    </button>
                  </div>

                  {/* Items List Table */}
                  {items.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-300 rounded-2xl text-xs text-slate-500 font-bold">
                      କୌଣସି ସାମଗ୍ରୀ ଯୋଡ଼ାଯାଇନାହିଁ। ଉପରୋକ୍ତ ଟେମ୍ପଲେଟ୍ ବାଛନ୍ତୁ କିମ୍ବା ନିଜେ ସାମଗ୍ରୀ ଯୋଡ଼ନ୍ତୁ।
                    </div>
                  ) : (
                    <div className="w-full overflow-x-auto border border-amber-300 rounded-2xl shadow-2xs">
                      <table className="w-full text-left text-xs min-w-[480px]">
                        <thead className="bg-amber-100/80 text-amber-950 font-extrabold border-b border-amber-300">
                          <tr>
                            <th className="p-2.5 text-center w-10 min-w-[40px] whitespace-nowrap">#</th>
                            <th className="p-2.5 w-1/2 min-w-[180px] whitespace-normal break-words">ସାମଗ୍ରୀ ନାମ</th>
                            <th className="p-2.5 text-center w-24 min-w-[80px] whitespace-nowrap">ପରିମାଣ</th>
                            <th className="p-2.5 text-center w-24 min-w-[80px] whitespace-nowrap">ଏକକ</th>
                            <th className="p-2.5 text-center w-12 min-w-[50px] whitespace-nowrap">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-amber-200">
                          {items.map((it, idx) => (
                            <tr key={it.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-amber-50/40'}>
                              <td className="p-2 text-center font-bold text-slate-500 whitespace-nowrap">{idx + 1}</td>
                              <td className="p-2 font-bold text-slate-900 whitespace-normal break-words">
                                <textarea
                                  rows={Math.max(1, Math.ceil((it.name || '').length / 18))}
                                  value={it.name}
                                  onChange={(e) => handleUpdateItem(it.id, 'name', e.target.value)}
                                  className="w-full px-2 py-1 bg-transparent font-bold outline-none focus:bg-amber-100 rounded break-words whitespace-normal block resize-none leading-snug border border-transparent focus:border-amber-300 text-xs sm:text-sm"
                                />
                              </td>
                              <td className="p-2 text-center whitespace-nowrap">
                                <input
                                  type="text"
                                  value={it.quantity}
                                  onChange={(e) => handleUpdateItem(it.id, 'quantity', e.target.value)}
                                  className="w-full min-w-[60px] px-1 py-1 text-center font-extrabold text-amber-950 bg-transparent outline-none focus:bg-amber-100 rounded text-xs sm:text-sm"
                                />
                              </td>
                              <td className="p-2 text-center whitespace-nowrap">
                                <input
                                  type="text"
                                  value={it.unit}
                                  onChange={(e) => handleUpdateItem(it.id, 'unit', e.target.value)}
                                  className="w-full min-w-[60px] px-1 py-1 text-center font-bold text-slate-800 bg-transparent outline-none focus:bg-amber-100 rounded text-xs sm:text-sm"
                                />
                              </td>
                              <td className="p-2 text-center whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(it.id)}
                                  className="p-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded transition cursor-pointer"
                                  title="Remove Item"
                                >
                                  <Trash2 className="w-4 h-4 mx-auto" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* SUBMIT BUTTON */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-amber-700 hover:bg-amber-800 text-white font-extrabold rounded-2xl text-sm sm:text-base transition shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
                >
                  <FileText className="w-5 h-5" />
                  {loading
                    ? 'ପ୍ରକ୍ରିୟାକରଣ ହେଉଛି...'
                    : currentEditId
                    ? 'Update & Download PDF (ଅପଡେଟ୍ ଏବଂ PDF ଡାଉନଲୋଡ୍ କରନ୍ତୁ)'
                    : !pujari.freeTierUsed
                    ? '୧-ପୃଷ୍ଠା PDF ସୂଚୀ ପ୍ରସ୍ତୁତ ଓ ଡାଉନଲୋଡ୍ କରନ୍ତୁ (ମାଗଣା ୧ମ ଥର)'
                    : 'ପୂଜା ସୂଚୀ ତିଆରି କରନ୍ତୁ (₹୫ ଦେୟ ପ୍ରଯୁଜ୍ୟ)'}
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar: Free Tier Status & Guidelines */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-amber-50 to-amber-100/60 rounded-3xl p-5 border border-amber-300 shadow-xs">
              <div className="flex items-center gap-2 mb-3 text-amber-950 font-extrabold text-sm">
                <Sparkles className="w-5 h-5 text-amber-700" />
                <span>ପୂଜାରୀ ଆକାଉଣ୍ଟ ସ୍ଥିତି</span>
              </div>
              <div className="space-y-3 text-xs text-slate-800 font-bold">
                <div className="p-3 bg-white rounded-2xl border border-amber-300">
                  <div className="text-slate-500 text-[11px]">ପ୍ରଥମ ସୂଚୀ ମାଗଣା (FREE Tier):</div>
                  <div className="text-sm font-extrabold mt-0.5">
                    {!pujari.freeTierUsed ? (
                      <span className="text-emerald-700 flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" /> ୧୦୦% ମାଗଣା ଉପଲବ୍ଧ!
                      </span>
                    ) : (
                      <span className="text-amber-900">ବ୍ୟବହୃତ ହୋଇସାରିଛି (Used)</span>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-white rounded-2xl border border-amber-300">
                  <div className="text-slate-500 text-[11px]">ନୂତନ ସୂଚୀ ତିଆରି ଦେୟ:</div>
                  <div className="text-sm font-extrabold text-amber-950 mt-0.5">
                    {!pujari.freeTierUsed ? '୧ମ ସୂଚୀ: ₹୦ (ମାଗଣା)' : '୨ୟ ସୂଚୀଠାରୁ: ₹୫ / ସୂଚୀ'}
                  </div>
                </div>

                <div className="p-3 bg-white rounded-2xl border border-amber-300">
                  <div className="text-slate-500 text-[11px]">ପୁରୁଣା ସୂଚୀ ପୁନଃ-ଡାଉନଲୋଡ୍ ଦେୟ:</div>
                  <div className="text-sm font-extrabold text-amber-950 mt-0.5">
                    ₹୨ / ପୁନଃ-ଡାଉନଲୋଡ୍
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Templates List */}
            <div className="bg-white rounded-3xl p-5 border border-amber-300 shadow-xs">
              <h4 className="text-xs font-extrabold text-slate-900 mb-3 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-amber-700" />
                ପ୍ରମୁଖ ପୂଜା ଟେମ୍ପଲେଟ୍ ସମୂହ
              </h4>
              <div className="space-y-2">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleSelectTemplate(t.id)}
                    className="w-full text-left p-2.5 bg-amber-50/50 hover:bg-amber-100/70 border border-amber-200 rounded-xl transition cursor-pointer"
                  >
                    <div className="text-xs font-extrabold text-slate-900">{t.name}</div>
                    <div className="text-[11px] text-amber-900 font-bold">{t.items.length} ଟି ସାମଗ୍ରୀ</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: NAMA YAJNA INVITATION CARD (PageMaker Traditional PDF) */}
      {activeTab === 'nama_yajna' && (
        <div className="bg-white rounded-3xl p-5 sm:p-7 border border-amber-300 shadow-xs space-y-6">
          <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-amber-900 text-amber-50 p-4 sm:p-5 rounded-2xl border-2 border-amber-600 flex flex-wrap items-center justify-between gap-4 shadow-md">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 bg-amber-400 text-slate-950 font-black rounded text-[10px] uppercase tracking-wider">
                  Traditional PageMaker Style
                </span>
                <span className="text-amber-200 text-xs font-extrabold">
                  {!pujari.freeTierUsed ? '୧ମ ସୂଚୀ: ମାଗଣା (FREE)' : 'ନୂଆ କାର୍ଡ: ₹୧୦'}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black tracking-wide text-amber-100 flex items-center gap-2">
                <span>🌸</span>
                <span>ନାମଯଜ୍ଞ ନିମନ୍ତ୍ରଣ ପତ୍ର ତିଆରି କରନ୍ତୁ (Nama Yajna Card)</span>
              </h3>
              <p className="text-xs text-amber-200 font-medium mt-1">
                ଟ୍ରାଡିସନାଲ୍ ଓଡ଼ିଆ ପେଜ୍‌ମେକର୍ ଷ୍ଟାଇଲ୍‌ରେ ଶଙ୍ଖ, ଦୀପ, ଯଜ୍ଞକୁଣ୍ଡ ଓ କାର୍ଯ୍ୟସୂଚୀ ସହ ମନୋରମ ନିମନ୍ତ୍ରଣ କାର୍ଡ PDF ସୃଷ୍ଟି କରନ୍ତୁ।
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('create')}
              className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 rounded-xl text-xs font-bold transition border border-amber-500/40 cursor-pointer"
            >
              ← ସାଧାରଣ ପୂଜା ସୂଚୀ ଫର୍ମ
            </button>
          </div>

          <form onSubmit={handleCreateNamaYajnaSubmit} className="space-y-5">
            {/* Yajna Type Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-900 mb-1">
                  ଯଜ୍ଞର ପ୍ରକାର (Yajna Type) <span className="text-rose-600">*</span>
                </label>
                <select
                  value={yajnaTypeOption}
                  onChange={(e) => setYajnaTypeOption(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-amber-300 rounded-xl text-xs sm:text-sm font-bold bg-amber-50/50 text-slate-900 outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="ଅଷ୍ଟପ୍ରହରୀ ନାମଯଜ୍ଞ">ଅଷ୍ଟପ୍ରହରୀ ନାମଯଜ୍ଞ (24 Hours)</option>
                  <option value="ଚବିଶ ପ୍ରହରୀ ନାମଯଜ୍ଞ">ଚବିଶ ପ୍ରହରୀ ନାମଯଜ୍ଞ (3 Days)</option>
                  <option value="ଶୋହଳ ପ୍ରହରୀ ନାମଯଜ୍ଞ">ଶୋହଳ ପ୍ରହରୀ ନାମଯଜ୍ଞ (2 Days)</option>
                  <option value="ସପ୍ତାହବ୍ୟାପୀ ନାମଯଜ୍ଞ">ସପ୍ତାହବ୍ୟାପୀ ନାମଯଜ୍ଞ (7 Days)</option>
                  <option value="ଅନ୍ୟାନ୍ୟ / କଷ୍ଟମ୍ ଟାଇପ୍ କରନ୍ତୁ">ଅନ୍ୟାନ୍ୟ / କଷ୍ଟମ୍ ଟାଇପ୍ କରନ୍ତୁ</option>
                </select>

                {yajnaTypeOption === 'ଅନ୍ୟାନ୍ୟ / କଷ୍ଟମ୍ ଟାଇପ୍ କରନ୍ତୁ' && (
                  <input
                    type="text"
                    required
                    placeholder="ଯଥା: ଶ୍ରୀ ଶ୍ରୀ ନାମଯଜ୍ଞ ମହୋତ୍ସବ"
                    value={customYajnaType}
                    onChange={(e) => setCustomYajnaType(e.target.value)}
                    className="w-full mt-2 px-3.5 py-2.5 border border-amber-400 bg-white rounded-xl text-xs sm:text-sm font-bold outline-none text-slate-900"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-900 mb-1">
                  କମିଟି / ନିମନ୍ତ୍ରକଙ୍କ ନାମ (Committee Name) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="ଯଥା: ଶ୍ରୀ ଶ୍ରୀ ରାଧାକୃଷ୍ଣ ନାମଯଜ୍ଞ ପରିଚାଳନା କମିଟି"
                  value={yajnaCommitteeName}
                  onChange={(e) => setYajnaCommitteeName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold outline-none focus:ring-2 focus:ring-amber-500 text-slate-900"
                />
              </div>
            </div>

            {/* Venue & Dates Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-900 mb-1">
                  ଯଜ୍ଞ ସ୍ଥଳ / ଗ୍ରାମ ନାମ (Venue / Village) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="ଯଥା: ଶ୍ରୀ ଶ୍ରୀ ରାଧାକୃଷ୍ଣ ମନ୍ଦିର ପ୍ରାଙ୍ଗଣ, ଗ୍ରାମ: ପଦ୍ମପୁର"
                  value={yajnaVenue}
                  onChange={(e) => setYajnaVenue(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold outline-none focus:ring-2 focus:ring-amber-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-900 mb-1">
                  ତାରିଖ ଓ ତିଥି (Dates &amp; Tithi) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="ଯଥା: ବୈଶାଖ ଶୁକ୍ଳପକ୍ଷ ପ୍ରତିପଦ ଠାରୁ ତୃତୀୟା (୧୦ ମେ ରୁ ୧୨ ମେ)"
                  value={yajnaDatesTithi}
                  onChange={(e) => setYajnaDatesTithi(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold outline-none focus:ring-2 focus:ring-amber-500 text-slate-900"
                />
              </div>
            </div>

            {/* Schedule / Timings Grid */}
            <div className="p-4 bg-amber-50/60 border border-amber-300 rounded-2xl space-y-3">
              <h4 className="text-xs font-extrabold text-amber-950 flex items-center gap-1.5 underline decoration-amber-400">
                <span>❖</span>
                <span>କାର୍ଯ୍ୟସୂଚୀ ଓ ସମୟ ନିଘଣ୍ଟ (Yajna Timings Schedule):</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-800 mb-1">
                    ୧. ଅଧିବାସ (Adhibasa):
                  </label>
                  <input
                    type="text"
                    value={yajnaAdhibasa}
                    onChange={(e) => setYajnaAdhibasa(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg font-bold text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-800 mb-1">
                    ୨. ଶ୍ରୀନାମ ଆରମ୍ଭ (Nama Arambha):
                  </label>
                  <input
                    type="text"
                    value={yajnaNamaArambha}
                    onChange={(e) => setYajnaNamaArambha(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg font-bold text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-800 mb-1">
                    ୩. ପୂର୍ଣ୍ଣାହୁତି ଓ ପରିକ୍ରମା (Purnahuti):
                  </label>
                  <input
                    type="text"
                    value={yajnaPurnahuti}
                    onChange={(e) => setYajnaPurnahuti(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg font-bold text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-800 mb-1">
                    ୪. ଅନ୍ନପ୍ରସାଦ ସେବନ (Prasad Seba):
                  </label>
                  <input
                    type="text"
                    value={yajnaPrasadSeba}
                    onChange={(e) => setYajnaPrasadSeba(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg font-bold text-slate-900 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Custom Invitation Greeting Message */}
            <div>
              <label className="block text-xs font-extrabold text-slate-900 mb-1">
                ନିମନ୍ତ୍ରଣ ବାର୍ତ୍ତା (Custom Invitation Message in Odia)
              </label>
              <textarea
                rows={3}
                value={yajnaInvitationText}
                onChange={(e) => setYajnaInvitationText(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold leading-relaxed text-slate-900 outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Organizers & Contact Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-900 mb-1">
                  ଗ୍ରାମବାସୀ / ସହଯୋଗୀ (Organizers)
                </label>
                <input
                  type="text"
                  placeholder="ଯଥା: ସମସ୍ତ ଗ୍ରାମବାସୀବୃନ୍ଦ"
                  value={yajnaOrganizers}
                  onChange={(e) => setYajnaOrganizers(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-900 mb-1">
                  ଯୋଗାଯୋଗ ମୋବାଇଲ୍ (Contact Phone)
                </label>
                <input
                  type="text"
                  value={yajnaContactPhone}
                  onChange={(e) => setYajnaContactPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 outline-none"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900 text-white font-extrabold rounded-2xl text-sm sm:text-base transition shadow-lg cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5 text-amber-300" />
              <span>
                {loading
                  ? 'କାର୍ଡ ପ୍ରସ୍ତୁତ ହେଉଛି...'
                  : !pujari.freeTierUsed
                  ? '🌸 PageMaker ନିମନ୍ତ୍ରଣ କାର୍ଡ ତିଆରି କରନ୍ତୁ (ମାଗଣା ୧ମ ଥର)'
                  : '🌸 PageMaker ନିମନ୍ତ୍ରଣ କାର୍ଡ ତିଆରି କରନ୍ତୁ (₹୧୦ ଦେୟ ପ୍ରଯୁଜ୍ୟ)'}
              </span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 2.5: DIGITAL VISITING CARD */}
      {activeTab === 'visiting_card' && (
        <VisitingCardTab
          pujari={pujari}
          qrConfig={qrConfig}
          onRefreshPujari={onRefreshPujari}
          onSubmitUtr={async (utrRef) => {
            const res = await submitVisitingCardPayment(pujari.id, utrRef);
            if (!res.success) {
              throw new Error(res.message || 'Payment submission failed');
            }
          }}
          onUpdateProfile={async (updatedData) => {
            await updatePujariCardProfile(pujari.id, updatedData);
            onRefreshPujari();
          }}
        />
      )}

      {/* TAB 3: MY LISTS & SEARCH */}
      {activeTab === 'search' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-amber-300 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Search className="w-5 h-5 text-amber-700" />
                <span>ମୋର ପୂଜା ସୂଚୀ ସମୂହ ଓ ଖୋଜନ୍ତୁ (Search Lists)</span>
              </h3>
              <span className="text-xs font-bold text-slate-600">
                ମୋଟ ପ୍ରସ୍ତୁତ ସୂଚୀ: <strong>{userLists.length}</strong>
              </span>
            </div>

            {/* Search Input Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="ପୂଜା ନାମ, ଯଜମାନଙ୍କ ନାମ କିମ୍ବା List ID ଦ୍ୱାରା ଖୋଜନ୍ତୁ..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-amber-300 rounded-2xl text-xs sm:text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none"
              />
              <Search className="w-4 h-4 text-amber-700 absolute left-3.5 top-3.5" />
            </div>

            {/* Lists Table / Grid */}
            {searching ? (
              <div className="p-8 text-center text-xs text-slate-500 font-bold">ଖୋଜା ଚାଲିଛି...</div>
            ) : userLists.length === 0 ? (
              <div className="p-12 text-center bg-amber-50/40 rounded-2xl border border-dashed border-amber-300 text-xs text-slate-600 font-bold">
                କୌଣସି ପୂଜା ସୂଚୀ ମିଳିଲା ନାହିଁ। ନୂତନ ସୂଚୀ ତିଆରି କରନ୍ତୁ।
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userLists.map((list) => (
                  <div
                    key={list.id}
                    className="p-4 bg-white rounded-2xl border border-amber-300 shadow-2xs hover:shadow-md transition space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        {/* Sacred Kalash/Puja Icon Container on Left */}
                        <div className="w-11 h-11 bg-amber-100 text-amber-900 border-2 border-amber-300 rounded-2xl flex items-center justify-center text-xl shrink-0 font-bold shadow-2xs mt-0.5">
                          {list.yajnaDetails ? '🌸' : '🪔'}
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-mono font-black text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                              {list.id}
                            </span>
                            {list.yajnaDetails && (
                              <span className="text-[10px] font-extrabold text-amber-950 bg-amber-200 border border-amber-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <span>🌸</span> ନାମଯଜ୍ଞ କାର୍ଡ
                              </span>
                            )}
                          </div>
                          <h4 className="text-base sm:text-lg font-black text-slate-900 mt-1 leading-snug">
                            {list.pujaName}
                          </h4>
                          <p className="text-xs text-slate-700 font-bold">
                            {list.yajnaDetails ? 'କମିଟି:' : 'ଯଜମାନ:'}{' '}
                            <strong className="text-slate-900 font-black">{list.yajamanaName}</strong>
                          </p>
                        </div>
                      </div>

                      <span
                        className={`px-3 py-1.5 rounded-2xl text-xs font-black shadow-2xs flex items-center gap-1.5 border-2 shrink-0 ${
                          list.isUnlocked
                            ? 'bg-emerald-100 text-emerald-950 border-emerald-400'
                            : list.paymentStatus === 'pending'
                            ? 'bg-amber-100 text-amber-950 border-amber-400'
                            : 'bg-rose-100 text-rose-950 border-rose-400'
                        }`}
                      >
                        {list.isUnlocked ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                            <span>✓ Unlocked</span>
                          </>
                        ) : list.paymentStatus === 'pending' ? (
                          <>
                            <Clock className="w-4 h-4 text-amber-800 animate-spin shrink-0" />
                            <span>⌛ Pending</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
                            <span>✕ Rejected</span>
                          </>
                        )}
                      </span>
                    </div>

                    <div className="text-xs text-slate-800 font-bold grid grid-cols-2 gap-1.5 bg-amber-50/80 p-3 rounded-2xl border border-amber-200">
                      <div>
                        <span className="font-extrabold text-amber-950">📅 ତାରିଖ:</span> {list.date}
                      </div>
                      <div>
                        <span className="font-extrabold text-amber-950">
                          {list.yajnaDetails ? '📍 ସ୍ଥାନ:' : '📦 ସାମଗ୍ରୀ:'}
                        </span>{' '}
                        {list.yajnaDetails ? list.location || 'N/A' : `${list.items?.length || 0} ଟି ସାମଗ୍ରୀ`}
                      </div>
                    </div>

                    {/* MASSIVE ACTION BANNER FOR UNPAID / LOCKED LISTS */}
                    {!list.isUnlocked && (
                      <div className="p-3.5 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-300 text-slate-950 rounded-2xl border-2 border-amber-500 shadow-md space-y-1">
                        <div className="flex items-start gap-2 font-black text-xs sm:text-sm text-slate-950 leading-snug">
                          <span className="text-lg leading-none shrink-0">👉</span>
                          <span>
                            ଏହି ପୂଜା ସୂଚୀ ଡାଉନଲୋଡ୍ କରିବା ପାଇଁ ପ୍ରଥମେ QR କୋଡ୍ ସ୍କାନ୍ କରି ₹୫ (କିମ୍ବା ₹୨) ପେମେଣ୍ଟ୍ କରନ୍ତୁ ଏବଂ UTR ନମ୍ବର ଦାଖଲ କରନ୍ତୁ।
                          </span>
                        </div>
                        {list.paymentStatus === 'pending' && (
                          <div className="mt-1.5 text-[11px] font-black text-amber-950 bg-white/90 px-3 py-1 rounded-xl border border-amber-400 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-amber-800 shrink-0" />
                            <span>ଆପଣ UTR ଦାଖଲ କରିଛନ୍ତି। ଆଡମିନ୍ ଯାଞ୍ଚ କରିବା ପରେ PDF ଅନଲୋକ୍ ହୋଇଯିବ।</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* BIGGER ACTION BUTTONS */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        onClick={() => handleViewPdfClick(list)}
                        className="flex-1 min-w-[140px] py-3 px-4 bg-amber-800 hover:bg-amber-900 text-white rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center justify-center gap-2 shadow-md min-h-[44px]"
                      >
                        <Eye className="w-4 h-4 text-amber-300" />
                        <span>{list.yajnaDetails ? 'PageMaker PDF ଦେଖନ୍ତୁ' : '୧-ପୃଷ୍ଠା PDF ଦେଖନ୍ତୁ'}</span>
                      </button>

                      <button
                        onClick={() => handleEditList(list)}
                        className="py-3 px-4 bg-slate-100 hover:bg-amber-100 text-amber-950 border-2 border-amber-300 rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center justify-center gap-1.5 min-h-[44px] shadow-2xs"
                        title="Edit List (ସମ୍ପାଦନ କରନ୍ତୁ)"
                      >
                        <Edit2 className="w-4 h-4 text-amber-700" />
                        <span>Edit List (ସମ୍ପାଦନ)</span>
                      </button>

                      {!list.isUnlocked && (
                        <button
                          onClick={() => handleRequestRedownloadUnlock(list)}
                          className="py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 border-2 border-amber-600 rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md min-h-[44px]"
                        >
                          <QrCode className="w-4 h-4" />
                          <span>QR / UTR (ପେମେଣ୍ଟ)</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: PUJARI PROFILE */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-3xl p-6 border border-amber-300 shadow-xs max-w-2xl mx-auto space-y-4">
          <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2 border-b border-amber-200 pb-3">
            <User className="w-5 h-5 text-amber-700" />
            <span>ପୂଜାରୀ ପ୍ରୋଫାଇଲ୍ ତଥ୍ୟ</span>
          </h3>

          <div className="space-y-3 text-xs sm:text-sm font-bold text-slate-800">
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex justify-between">
              <span className="text-slate-600">ପୂଜାରୀ ID:</span>
              <span className="font-mono text-amber-950 font-extrabold">{pujari.id}</span>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex justify-between">
              <span className="text-slate-600">ପୂଜାରୀଙ୍କ ନାମ:</span>
              <span className="text-slate-900 font-extrabold">{pujari.name}</span>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex justify-between">
              <span className="text-slate-600">ମୋବାଇଲ୍ ନମ୍ବର:</span>
              <span>{pujari.phone || 'N/A'}</span>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex justify-between">
              <span className="text-slate-600">ଠିକଣା:</span>
              <span>{pujari.address || 'N/A'}</span>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex justify-between">
              <span className="text-slate-600">ପ୍ରଥମ ମାଗଣା ସୂଚୀ ବ୍ୟବହୃତ:</span>
              <span className={pujari.freeTierUsed ? 'text-amber-900' : 'text-emerald-700 font-extrabold'}>
                {pujari.freeTierUsed ? 'ହଁ (Yes)' : 'ନାହିଁ - ୧ମ ସୂଚୀ ମାଗଣା! (Available)'}
              </span>
            </div>
          </div>

          {/* Logout Button Section */}
          <div className="pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-extrabold rounded-2xl text-xs sm:text-sm transition shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-2"
            >
              <LogOut className="w-5 h-5" />
              <span>ଲଗଆଉଟ୍ (Logout)</span>
            </button>
          </div>

          {/* COMPLAINT BOX CARD (VERY BOTTOM OF PROFILE PAGE) */}
          <div className="mt-8 pt-6 border-t-2 border-amber-200">
            <div className="bg-gradient-to-br from-amber-50/80 via-orange-50/50 to-amber-50/80 rounded-3xl p-5 sm:p-6 border-2 border-amber-300 shadow-md space-y-4">
              <div className="flex items-center gap-2.5 text-amber-950 pb-2 border-b border-amber-200">
                <div className="p-2.5 bg-amber-700 text-white rounded-2xl shadow-xs">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base sm:text-lg font-black text-slate-900">
                    ସମସ୍ୟା ଅଛି କି? ସିଧାସଳଖ ଜଣାନ୍ତୁ
                  </h4>
                  <p className="text-[11px] text-slate-600 font-bold">
                    ଆପଣଙ୍କର କୌଣସି ସମସ୍ୟା କିମ୍ବା ଖାରଜ ଅଭିଯୋଗ ଆଡମିନ୍ଙ୍କୁ ସିଧାସଳଖ ପଠାନ୍ତୁ (nayakjitu986@gmail.com)
                  </p>
                </div>
              </div>

              {/* Direct Google Form Complaint Button */}
              <div className="text-center my-3">
                <a
                  href="https://docs.google.com/forms/d/e/1FAIpQLSfS9sawS-5dqtiWKF3818KAUvqvp9YHNo2KjAc8H5dNMipNcg/viewform"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#ff4d4d] hover:bg-red-600 active:bg-red-700 text-white px-6 py-3 rounded-xl text-base font-bold shadow-md hover:shadow-lg inline-flex items-center justify-center gap-2 transition duration-200 cursor-pointer"
                >
                  <MessageSquare className="w-5 h-5" />
                  <span>ସମସ୍ୟା ଅଛି କି? ଏଠାରେ ଅଭିଯୋଗ କରନ୍ତୁ</span>
                </a>
              </div>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-amber-200"></div>
                <span className="flex-shrink mx-4 text-xs font-black text-amber-800 bg-amber-100/80 px-3 py-1 rounded-full border border-amber-300">
                  କିମ୍ବା ଇନ୍-ଆପ୍ ଅଭିଯୋଗ ଫର୍ମ ବ୍ୟବହାର କରନ୍ତୁ
                </span>
                <div className="flex-grow border-t border-amber-200"></div>
              </div>

              <form ref={complaintFormRef} onSubmit={handleSendComplaint} className="space-y-4">
                {/* Hidden Fields for Pujari Identification & Admin Target Email */}
                <input type="hidden" name="admin_email" value="nayakjitu986@gmail.com" />
                <input type="hidden" name="pujari_id" value={pujari.id} />
                <input type="hidden" name="pujari_name" value={pujari.name} />
                <input type="hidden" name="pujari_phone" value={pujari.phone || 'N/A'} />

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1">
                    <span>ସମସ୍ୟା / ଅଭିଯୋଗର ବିବରଣୀ (Message / Complaint)</span>
                    <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    name="message"
                    required
                    rows={4}
                    value={complaintMsg}
                    onChange={(e) => setComplaintMsg(e.target.value)}
                    placeholder="ଆପଣଙ୍କର ସମସ୍ୟା କିମ୍ବା ଅଭିଯୋଗ ବିସ୍ତୃତ ଭାବରେ ଲେଖନ୍ତୁ (ଉଦାହରଣ: UTR ଯାଞ୍ଚ ସମସ୍ୟା, ସୂଚୀ ଅନଲକ୍ ସମସ୍ୟା)..."
                    className="w-full px-3.5 py-3 border border-amber-300 rounded-2xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-amber-500 outline-none bg-white shadow-2xs resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Paperclip className="w-4 h-4 text-amber-700" />
                      <span>ସ୍କ୍ରିନସଟ୍ ଅପଲୋଡ୍ କରନ୍ତୁ (Attach Screenshot - Optional)</span>
                    </span>
                    <span className="text-[10px] text-amber-900 bg-amber-100 px-2 py-0.5 rounded font-bold">Image file</span>
                  </label>
                  <input
                    type="file"
                    name="my_file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setComplaintFile(e.target.files[0]);
                      }
                    }}
                    className="w-full px-3 py-2 border border-amber-300 rounded-xl text-xs font-bold bg-white cursor-pointer file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-black file:bg-amber-100 file:text-amber-950 hover:file:bg-amber-200"
                  />
                  {complaintFile && (
                    <p className="text-[11px] font-bold text-emerald-800 mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      ଫାଇଲ୍ ବଛାଗଲା: {complaintFile.name}
                    </p>
                  )}
                </div>

                {complaintError && (
                  <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-800 flex items-start gap-2 font-bold animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{complaintError}</span>
                  </div>
                )}

                {complaintSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 flex items-start gap-2 font-bold animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{complaintSuccess}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={complaintLoading}
                  className="w-full py-3.5 bg-amber-700 hover:bg-amber-800 text-white font-extrabold rounded-2xl text-xs sm:text-sm transition shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{complaintLoading ? 'ପଠାଯାଉଛି...' : 'ଅଭିଯୋଗ ପଠାନ୍ତୁ (Send Complaint)'}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal for UTR / QR */}
      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => {
          setPaymentModalOpen(false);
          loadData();
        }}
        type={paymentType}
        qrConfig={qrConfig}
        list={targetListForPayment}
        onSubmitUtr={handleSubmitUtr}
      />

      {/* Mandatory Welcome & Terms of Service Modal (Pop-up) */}
      <WelcomeTermsModal
        isOpen={!pujari.hasAcceptedTerms}
        pujariId={pujari.id}
        pujariName={pujari.name}
        onAccepted={() => {
          onRefreshPujari();
        }}
      />
      </div>

      {/* 4. FIXED BOTTOM NAVIGATION BAR (TAB BAR) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-r from-[#701a1e] via-[#8B0000] to-[#701a1e] backdrop-blur-md border-t-2 border-amber-400 shadow-[0_-4px_25px_rgba(0,0,0,0.3)] py-2 px-2 sm:px-6 w-full max-w-full box-border">
        <div className="max-w-md mx-auto flex items-center justify-between gap-1">
          <button
            onClick={() => setActiveTab('search')}
            className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition cursor-pointer min-h-[52px] ${
              activeTab === 'search'
                ? 'bg-amber-400 text-amber-950 shadow-md font-black'
                : 'text-amber-200 hover:bg-amber-900/50 font-bold'
            }`}
          >
            <Calendar className="w-5 h-5 mb-0.5" />
            <span className="text-[11px] leading-tight font-black">📅 Puja List</span>
          </button>

          <button
            onClick={() => {
              handleCancelEdit();
              setActiveTab('create');
            }}
            className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition cursor-pointer min-h-[52px] ${
              activeTab === 'create'
                ? 'bg-amber-400 text-amber-950 shadow-md font-black'
                : 'text-amber-200 hover:bg-amber-900/50 font-bold'
            }`}
          >
            <Edit2 className="w-5 h-5 mb-0.5" />
            <span className="text-[11px] leading-tight font-black">✏️ Edit List</span>
          </button>

          <button
            onClick={() => setActiveTab('nama_yajna')}
            className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition cursor-pointer min-h-[52px] ${
              activeTab === 'nama_yajna'
                ? 'bg-amber-400 text-amber-950 shadow-md font-black border border-amber-300'
                : 'text-amber-200 hover:bg-amber-900/50 font-bold'
            }`}
          >
            <Sparkles className="w-5 h-5 mb-0.5 text-amber-300" />
            <span className="text-[11px] leading-tight font-black">💌 Invite</span>
          </button>

          <button
            onClick={() => setActiveTab('visiting_card')}
            className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition cursor-pointer min-h-[52px] ${
              activeTab === 'visiting_card'
                ? 'bg-amber-400 text-amber-950 shadow-md font-black border border-amber-300'
                : 'text-amber-200 hover:bg-amber-900/50 font-bold'
            }`}
          >
            <span className="text-base mb-0.5 leading-none">🎴</span>
            <span className="text-[11px] leading-tight font-black">🎴 Card</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition cursor-pointer min-h-[52px] ${
              activeTab === 'profile'
                ? 'bg-amber-400 text-amber-950 shadow-md font-black'
                : 'text-amber-200 hover:bg-amber-900/50 font-bold'
            }`}
          >
            <User className="w-5 h-5 mb-0.5" />
            <span className="text-[11px] leading-tight font-black">👤 Profile</span>
          </button>
        </div>
      </nav>

      <OfficeClosedModal
        isOpen={officeClosedModalOpen}
        onClose={() => setOfficeClosedModalOpen(false)}
      />
    </div>
  );
};
