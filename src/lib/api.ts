export * from './firebase';

import { 
  fsGetQrConfig, 
  fsLoginPujari, 
  fsSubscribeQrConfig, 
  fsSubscribePujaris, 
  fsSubscribeSiteLock, 
   
  fsLogPwaInstall,
  fsGetPayments,
  fsApprovePayment,
  fsRejectPayment,
  fsUnlockPayment,
  fsUpdateQrConfig,
  fsGetTemplates,
  fsCreateTemplate,
  fsDeleteTemplate,
  fsSubscribePayments,
  fsSubscribeLists,
  fsGetLists,
  requestAdminNotificationPermission as fsRequestAdminNotificationPermission,
  getAdminNotificationStatus as fsGetAdminNotificationStatus,
  fsSetSiteLock,
  fsApproveVisitingCard,
  fsRejectVisitingCard,
  fsSubscribePasswordResetRequests,
  fsGetPasswordResetRequests,
  fsApprovePasswordResetRequest,
  fsRejectPasswordResetRequest,
  fsGetHomeSliderConfig,
  fsUpdateHomeSliderConfig,
  fsSubscribeHomeSliderConfig,
  DEFAULT_HOME_SLIDER_CONFIG,
  fsGetPuriStoreConfig,
  fsUpdatePuriStoreConfig,
  fsSubscribePuriStoreConfig,
  DEFAULT_PURI_STORE_CONFIG,
  fsGetPwaInstalls,
  fsSubscribePwaInstalls,
  fsGetPujaris,
  fsCreatePujariByAdmin,
  fsUpdatePujariStatus,
  fsBlockPujari
} from './firebase';

export const getQrConfig = fsGetQrConfig;
export const loginPujari = fsLoginPujari;
export const subscribeQrConfig = fsSubscribeQrConfig;
export const subscribePujaris = fsSubscribePujaris;
export const subscribeSiteLock = fsSubscribeSiteLock;
export const verifyAdminMasterId = async (...args: any[]) => true;
export const logPwaInstall = fsLogPwaInstall;
export const getPayments = fsGetPayments;
export const approvePayment = fsApprovePayment;
export const rejectPayment = fsRejectPayment;
export const unlockPayment = fsUnlockPayment;
export const updateQrConfig = fsUpdateQrConfig;
export const getTemplates = fsGetTemplates;
export const createTemplate = fsCreateTemplate;
export const deleteTemplate = fsDeleteTemplate;
export const subscribePayments = fsSubscribePayments;
export const subscribePujaLists = fsSubscribeLists;
export const getPujaLists = fsGetLists;
export const requestAdminNotificationPermission = fsRequestAdminNotificationPermission;
export const getAdminNotificationStatus = fsGetAdminNotificationStatus;
export const setSiteLock = fsSetSiteLock;
export const approveVisitingCard = fsApproveVisitingCard;
export const rejectVisitingCard = fsRejectVisitingCard;
export const subscribePasswordResetRequests = fsSubscribePasswordResetRequests;
export const getPasswordResetRequests = fsGetPasswordResetRequests;
export const approvePasswordResetRequest = fsApprovePasswordResetRequest;
export const rejectPasswordResetRequest = fsRejectPasswordResetRequest;
export const getHomeSliderConfig = fsGetHomeSliderConfig;
export const updateHomeSliderConfig = fsUpdateHomeSliderConfig;
export const subscribeHomeSliderConfig = fsSubscribeHomeSliderConfig;
export const getPuriStoreConfig = fsGetPuriStoreConfig;
export const updatePuriStoreConfig = fsUpdatePuriStoreConfig;
export const subscribePuriStoreConfig = fsSubscribePuriStoreConfig;
export const getPwaInstalls = fsGetPwaInstalls;
export const subscribePwaInstalls = fsSubscribePwaInstalls;
export const getPujaris = fsGetPujaris;
export const createPujariByAdmin = fsCreatePujariByAdmin;
export const updatePujariStatus = fsUpdatePujariStatus;
export const blockPujari = fsBlockPujari;

