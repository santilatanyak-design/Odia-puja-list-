export interface Pujari {
  hasUnreadNotification?: boolean;
  cardStatus?: string;
  cardUtrRef?: string;
  createdAt?: string;
  passwordResetStatus?: string;
  rejectionReason?: string;
  id: string;
  name?: string;
}
export interface QrConfig {
  id?: string;
}
export interface SpiritualStory {
  id: string;
  title: string;
  content: string;
  category: string;
  summary: string;
  imageUrl: string;
  author: string;
  readTimeMinutes: number;
  likesCount: number;
  publishedAt: string;
  isFeatured: boolean;
  affiliateAd?: any;
}

export interface Pujari {
  id: string;
  name?: string;
  phone?: string;
  status?: string;
  isBlocked?: boolean;
  pin?: string;
  address?: string;
  freeTierUsed?: boolean;
  title?: string;
  specializations?: string;
  profilePhotoUrl?: string;
  recoveryLockedUntil?: any;
  voterIdPin?: string;
  recoveryFailedCount?: number;
  systemMessage?: string;
}

export interface QrConfig {
  id?: string;
  newCreationQrUrl?: string;
  newCreationAmount?: number;
  reDownloadAmount?: number;
  [key: string]: any;
}

export type DailyPanchang = any;
export type UnifiedFeedItem = any;
export type DistrictItem = any;
export type DistrictCategory = any;
export type PujaList = any;
export type PaymentRequest = any;
export type PujaTemplate = any;
export type PasswordResetRequest = any;
export type HomeSliderConfig = any;
export type SliderImage = any;
export type PuriStoreConfig = any;
export type PuriStoreProduct = any;
export type AnalyticsInstall = any;
export type Temple = any;
export type StoreProduct = any;
export type TempleShort = any;
export type TempleBooking = any;
export type ReceiptHeaderConfig = any;


export interface StoreOrder { id?: string; [key: string]: any; }
export interface StoreConfig { [key: string]: any; }
export interface AffiliateProductAd { [key: string]: any; }

export const ODISHA_DISTRICTS = [];
export type OdishaDistrictInfo = any;
