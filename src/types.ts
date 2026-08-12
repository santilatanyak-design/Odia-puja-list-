export interface Pujari {
  id: string;
  name: string;
  phone: string;
  address: string;
  pin?: string;
  voterIdPin?: string;
  recoveryFailedCount?: number;
  recoveryLockedUntil?: string;
  pendingResetRequestId?: string;
  passwordResetStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  status: 'active' | 'suspended';
  isBlocked?: boolean;
  hasAcceptedTerms?: boolean;
  freeTierUsed: boolean;
  cardStatus?: 'Locked' | 'Pending' | 'Unlocked';
  cardUtrRef?: string;
  cardRequestDate?: string;
  title?: string;
  specializations?: string[];
  profilePhotoUrl?: string;
  rejectionReason?: string;
  systemMessage?: string;
  hasUnreadNotification?: boolean;
  createdAt: string;
}

export interface PasswordResetRequest {
  id: string;
  pujariId: string;
  pujariName: string;
  pujariPhone: string;
  registeredPin: string;
  submittedPin: string;
  newPin?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
}

export interface SamagriItem {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  category?: string;
}

export interface NamaYajnaDetails {
  yajnaType: string;
  datesTithi: string;
  venue: string;
  committeeName: string;
  adhibasaInfo: string;
  namaArambhaInfo: string;
  purnahutiInfo: string;
  prasadSebaInfo?: string;
  invitationText?: string;
  organizers?: string;
  contactPhone?: string;
}

export interface PujaList {
  id: string;
  pujariId: string;
  pujariName: string;
  pujaName: string;
  yajamanaName: string;
  date: string;
  time: string;
  contact: string;
  location: string;
  notes: string;
  items: SamagriItem[];
  yajnaDetails?: NamaYajnaDetails;
  createdAt: string;
  updatedAt: string;
  isUnlocked: boolean;
  paymentStatus: 'free' | 'pending' | 'approved' | 'rejected';
  paymentType: 'free_first_time' | 'new_creation' | 'search_redownload' | 'edit_list';
  paymentAmount: number;
  utrRef: string;
  utrNumber?: string;
  utr?: string;
  rejectionReason?: string;
  systemMessage?: string;
  hasUnreadNotification?: boolean;
  downloadCount?: number;
  lastDownloadedAt?: string;
}

export interface PaymentRequest {
  id: string;
  pujariId: string;
  pujariName: string;
  listId: string;
  pujaName: string;
  yajamanaName: string;
  type: 'new_creation' | 'search_redownload' | 'edit_list' | 'visiting_card';
  amount: number;
  utrRef: string;
  utrNumber?: string;
  utr?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  systemMessage?: string;
  hasUnreadNotification?: boolean;
  createdAt: string;
  approvedAt?: string;
}

export interface QrConfig {
  newCreationQrUrl: string;
  newCreationUpiId: string;
  newCreationAmount: number;
  reDownloadQrUrl: string;
  reDownloadUpiId: string;
  reDownloadAmount: number;
}

export interface PujaTemplate {
  id: string;
  name: string;
  description: string;
  items: { name: string; quantity: string; unit: string }[];
}
