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

export interface StoreProduct {
  id: string;
  name: string;
  price: number;
  category: string;
  imageUrl?: string;
  description?: string;
  inStock: boolean;
  createdAt: string;
}

export interface StoreOrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
}

export interface StoreOrder {
  id: string;
  customerName: string;
  customerMobile: string;
  deliveryAddress: string;
  items: StoreOrderItem[];
  totalAmount: number;
  paymentMethod: 'COD';
  status: 'pending' | 'approved' | 'delivered' | 'cancelled';
  deliveryDate?: string;
  fcmToken?: string;
  cancellationReason?: string;
  cancelledAt?: string;
  createdAt: string;
}

export interface StoreConfig {
  bannerImageUrl: string;
  suspendedMobiles: string[];
  districtCodStatus?: Record<string, boolean>;

  // Global Settings & Feature Toggles
  enableFestivalBanner?: boolean;
  enableDeliveryCharge?: boolean;
  enableCod?: boolean;
  showNoticeBar?: boolean;

  primaryColor?: string;
  backgroundColor?: string;
  templateStyle?: 'grid' | 'list';

  noticeBarText?: string;
  festivalBannerUrl?: string;
  deliveryChargeAmount?: number;
  freeDeliveryThreshold?: number;

  customToggles?: Record<string, boolean>;
}

export interface ReceiptHeaderConfig {
  topBanner: string;
  mainTitle: string;
  subTitle: string;
  section1Heading?: string;
  section2Heading?: string;
  footerText?: string;
}

export interface Temple {
  id: string;
  name: string;
  location: string;
  pujariPhone: string;
  imageUrl: string;
  thumbnailUrl?: string;
  qrCodeUrl?: string;
  description?: string;
  history?: string;
  isJalAbhishekAvailable?: boolean;
  customPujaLabel?: string;
  customSection1Heading?: string;
  customSection2Heading?: string;
  customFooterText?: string;
}

export interface TempleShort {
  id: string;
  title: string;
  youtubeUrl: string;
  templeName?: string;
  templeId?: string;
  description?: string;
  createdAt?: string;
}

export interface TempleBooking {
  id: string; // Alphanumeric Unique ID e.g. BKG-98472
  templeId: string;
  templeName: string;
  templeLocation?: string;
  pujariPhone?: string;
  userName: string;
  userPhone: string;
  userAddress: string;
  gotraRasi?: string;
  bookingType: string;
  platformFeeAmount: number;
  utrRef: string;
  status: 'pending' | 'approved' | 'rejected' | 'waiting_list' | 'rescheduled' | 'cancelled';
  pujaDateTime?: string;
  rejectionReason?: string;
  adminReason?: string;
  requestedRescheduleDate?: string;
  isRescheduleRequested?: boolean;
  userCancelReason?: string;
  createdAt: string;
  approvedAt?: string;
  updatedAt?: string;
}
