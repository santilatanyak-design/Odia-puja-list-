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
  currentVoterIdPin?: string;
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

export interface SliderImage {
  id: string;
  url: string;
  title?: string;
  subtitle?: string;
  linkUrl?: string;
}

export interface HomeSliderConfig {
  autoSlideIntervalSeconds?: number;
  images: SliderImage[];
}

export interface PuriStoreProduct {
  id: string;
  name: string;
  nameEng?: string;
  photoUrl: string;
  buyLink: string;
  tag?: string;
}

export interface PuriStoreConfig {
  enabled?: boolean;
  title?: string;
  subtitle?: string;
  products: PuriStoreProduct[];
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
  isBookingLocked?: boolean;
  pujariContact?: string;
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

export interface DailyPanchang {
  id: string;
  date: string;
  odiaDateText: string;
  odiaMonth: string;
  paksha: string;
  tithi: string;
  nakshatra: string;
  yoga: string;
  karana: string;
  sunrise: string;
  sunset: string;
  moonrise?: string;
  rahukala: string;
  amritabela: string;
  brahmaMuhurta: string;
  gulikaKala?: string;
  yamaganda?: string;
  specialFestival?: string;
  dailyAdvice?: string;
  fastingInfo?: string;
  updatedAt?: string;
}

export interface AffiliateProductAd {
  enabled?: boolean;
  productTitle?: string;
  productImageUrl?: string;
  productDescription?: string;
  productPrice?: string;
  affiliateUrl?: string;
  triggerDelaySeconds?: number;
  countdownSeconds?: number;
}

export interface SpiritualStory {
  id: string;
  title: string;
  category: string;
  summary: string;
  content: string;
  imageUrl: string;
  author: string;
  readTimeMinutes: number;
  likesCount?: number;
  publishedAt: string;
  isFeatured?: boolean;
  affiliateAd?: AffiliateProductAd;
}

export type DistrictCategory = 'temple' | 'festival' | 'story';

export interface DistrictItem {
  id: string;
  districtId: string;
  districtNameOdia: string;
  districtNameEng: string;
  category: DistrictCategory;
  title: string;
  description: string;
  imageUrl?: string;
  location?: string;
  significance?: string;
  famousFestivals?: string;
  bestTimeToVisit?: string;
  externalLink?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface OdishaDistrictInfo {
  id: string;
  nameOdia: string;
  nameEng: string;
  tagline: string;
  icon: string;
}

export const ODISHA_DISTRICTS: OdishaDistrictInfo[] = [
  { id: 'puri', nameOdia: 'ପୁରୀ', nameEng: 'Puri', tagline: 'ଶ୍ରୀକ୍ଷେତ୍ର ଧାମ ଓ ଜଗନ୍ନାଥ ସଂସ୍କୃତି', icon: '🚩' },
  { id: 'khordha', nameOdia: 'ଖୋର୍ଦ୍ଧା / ଭୁବନେଶ୍ୱର', nameEng: 'Khordha', tagline: 'ଏକାମ୍ର କ୍ଷେତ୍ର ଓ ମନ୍ଦିରମାଳିନୀ ନଗରୀ', icon: '🛕' },
  { id: 'cuttack', nameOdia: 'କଟକ', nameEng: 'Cuttack', tagline: 'ଭାଇଚାରା ନଗରୀ ଓ ପ୍ରସିଦ୍ଧ ବାଲିଯାତ୍ରା', icon: '⛵' },
  { id: 'ganjam', nameOdia: 'ଗଞ୍ଜାମ', nameEng: 'Ganjam', tagline: 'ମା’ ତାରାତାରିଣୀ ପୀଠ ଓ ଦଣ୍ଡନାଚ', icon: '🌺' },
  { id: 'sambalpur', nameOdia: 'ସମ୍ବଲପୁର', nameEng: 'Sambalpur', tagline: 'ମା’ ସମଲେଶ୍ୱରୀ ଓ ଶୀତଳଷଷ୍ଠୀ ଯାତ୍ରା', icon: '🪘' },
  { id: 'balasore', nameOdia: 'ବାଲେଶ୍ୱର', nameEng: 'Balasore', tagline: 'ଚାନ୍ଦୀପୁର ବେଳାଭୂମି ଓ ଖୀରଚୋରା ଗୋପୀନାଥ', icon: '🌊' },
  { id: 'mayurbhanj', nameOdia: 'ମୟୂରଭଞ୍ଜ', nameEng: 'Mayurbhanj', tagline: 'ଶିମିଳିପାଳ ଅଭୟାରଣ୍ୟ ଓ ଛଉ ନୃତ୍ୟ', icon: '🦚' },
  { id: 'bhadrak', nameOdia: 'ଭଦ୍ରକ', nameEng: 'Bhadrak', tagline: 'ମା’ ଭଦ୍ରକାଳୀ ଓ ଆଖଣ୍ଡଳମଣି ପୀଠ', icon: '🔱' },
  { id: 'jajpur', nameOdia: 'ଯାଜପୁର', nameEng: 'Jajpur', tagline: 'ବିରଜା କ୍ଷେତ୍ର ଓ ନାଭିଗୟା ପୀଠ', icon: '🪔' },
  { id: 'kendrapara', nameOdia: 'କେନ୍ଦ୍ରାପଡ଼ା', nameEng: 'Kendrapara', tagline: 'ତୁଳସୀ କ୍ଷେତ୍ର ଶ୍ରୀ ବଳଦେବଜୀଉ', icon: '🔔' },
  { id: 'jagatsinghpur', nameOdia: 'ଜଗତସିଂହପୁର', nameEng: 'Jagatsinghpur', tagline: 'ମା’ ଶାରଳା ପୀଠ ଓ ପାରାଦ୍ୱୀପ ବନ୍ଦର', icon: '📜' },
  { id: 'dhenkanal', nameOdia: 'ଢେଙ୍କାନାଳ', nameEng: 'Dhenkanal', tagline: 'ମହିମା ଗାଦି ଯୋରନ୍ଦା ଓ କପିଳାସ ପୀଠ', icon: '🏔️' },
  { id: 'angul', nameOdia: 'ଅନୁଗୋଳ', nameEng: 'Angul', tagline: 'ତାଳଚେର ରାଜପ୍ରାସାଦ ଓ ଟିିକରପଡ଼ା', icon: '🌲' },
  { id: 'nayagarh', nameOdia: 'ନୟାଗଡ଼', nameEng: 'Nayagarh', tagline: 'କଣ୍ଟିଲୋ ନୀଳମାଧବ ଓ ଛେନାପୋଡ଼', icon: '🍮' },
  { id: 'koraput', nameOdia: 'କୋରାପୁଟ', nameEng: 'Koraput', tagline: 'ଜଗନ୍ନାଥ ଶାବର ଶ୍ରୀକ୍ଷେତ୍ର ଓ ଦେଓମାଳୀ', icon: '⛰️' },
  { id: 'rayagada', nameOdia: 'ରାୟଗଡ଼ା', nameEng: 'Rayagada', tagline: 'ମା’ ମଝିଘରିଆଣୀ ମନ୍ଦିର', icon: '✨' },
  { id: 'nabarangpur', nameOdia: 'ନବରଙ୍ଗପୁର', nameEng: 'Nabarangpur', tagline: 'ମା’ ଭଣ୍ଡାରଘରଣୀ ଓ ଆଦିବାସୀ ସଂସ୍କୃତି', icon: '🌿' },
  { id: 'malkangiri', nameOdia: 'ମାଲକାନଗିରି', nameEng: 'Malkangiri', tagline: 'ସତୀଗୁଡ଼ା ଡ୍ୟାମ୍ ଓ ବାଲିମେଳା', icon: '🌄' },
  { id: 'kalahandi', nameOdia: 'କଳାହାଣ୍ଡି', nameEng: 'Kalahandi', tagline: 'ମା’ ମାଣିକେଶ୍ୱରୀ ଓ ଛତର ଯାତ୍ରା', icon: '🛡️' },
  { id: 'nuapada', nameOdia: 'ନୂଆପଡ଼ା', nameEng: 'Nuapada', tagline: 'ପାତୋରା ଡ୍ୟାମ୍ ଓ ଯୋଗୀମଠ', icon: '🦅' },
  { id: 'balangir', nameOdia: 'ବଲାଙ୍ଗୀର', nameEng: 'Balangir', tagline: 'ହରିଶଙ୍କର ପୀଠ ଓ ଗନ୍ଧମାର୍ଦ୍ଦନ ପର୍ବତ', icon: '🍃' },
  { id: 'bargarh', nameOdia: 'ବରଗଡ଼', nameEng: 'Bargarh', tagline: 'ବିଶ୍ୱ ପ୍ରସିଦ୍ଧ ଧନୁଯାତ୍ରା ଓ ନୃସିଂହନାଥ ପୀଠ', icon: '🎭' },
  { id: 'subarnapur', nameOdia: 'ସୁବର୍ଣ୍ଣପୁର / ସୋନପୁର', nameEng: 'Subarnapur', tagline: 'ଦ୍ୱିତୀୟ ବାରଣାସୀ ଓ ସୁରେଶ୍ୱରୀ ମନ୍ଦିର', icon: '🏮' },
  { id: 'boudh', nameOdia: 'ବୌଦ୍ଧ', nameEng: 'Boudh', tagline: 'ରାମନାଥ ମନ୍ଦିର ଓ ପ୍ରାଚୀନ ବୌଦ୍ଧ କୀର୍ତ୍ତି', icon: '☸️' },
  { id: 'kandhamal', nameOdia: 'କନ୍ଧମାଳ', nameEng: 'Kandhamal', tagline: 'ଦାରିଙ୍ଗବାଡ଼ି ଓ ପ୍ରାକୃତିକ ସୌନ୍ଦର୍ଯ୍ୟ', icon: '❄️' },
  { id: 'gajapati', nameOdia: 'ଗଜପତି', nameEng: 'Gajapati', tagline: 'ମହେନ୍ଦ୍ରଗିରି ଓ ପାରଳାଖେମୁଣ୍ଡି ପ୍ୟାଲେସ୍', icon: '🏰' },
  { id: 'sundargarh', nameOdia: 'ସୁନ୍ଦରଗଡ଼', nameEng: 'Sundargarh', tagline: 'ବେଦବ୍ୟାସ ତ୍ରିବେଣୀ ସଙ୍ଗମ ଓ ରାଉରକେଲା', icon: '🕉️' },
  { id: 'keonjhar', nameOdia: 'କେନ୍ଦୁଝର', nameEng: 'Keonjhar', tagline: 'ଘଟଗାଁ ମା’ ତାରିଣୀ ଓ ସଂଘାଘରା ଜଳପ୍ରପାତ', icon: '🥥' },
  { id: 'jharsuguda', nameOdia: 'ଝାରସୁଗୁଡ଼ା', nameEng: 'Jharsuguda', tagline: 'ଝାରେଶ୍ୱର ମନ୍ଦିର ଓ କୋଇଲା ଉପତ୍ୟକା', icon: '🚂' },
  { id: 'deogarh', nameOdia: 'ଦେବଗଡ଼', nameEng: 'Deogarh', tagline: 'ପ୍ରଧାନପାଟ ଜଳପ୍ରପାତ ଓ ରାଜବାଟୀ', icon: '🏞️' },
];

export interface AnalyticsInstall {
  id: string;
  timestamp: string;
  platform?: string;
  userAgent?: string;
  referrer?: string;
}

