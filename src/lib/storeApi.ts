export const storeApi = {};
export async function getStoreOrders(...args: any[]) { return []; }
export function subscribeStoreOrders(cb: any) { return () => {}; }
export async function updateStoreOrderStatus(...args: any[]) {}
export function subscribeStoreConfig(cb: any) { return () => {}; }
export async function updateStoreConfig(...args: any[]) {}
export async function deleteStoreOrder(...args: any[]) {}
export async function approveStoreOrder(...args: any[]) {}
export async function rejectStoreOrder(...args: any[]) {}

export async function getStoreProducts(...args: any[]) { return []; }
export function subscribeStoreProducts(cb: any) { return () => {}; }
export async function saveStoreProduct(...args: any[]) {}
export async function toggleProductStock(...args: any[]) {}
export async function deleteStoreProduct(...args: any[]) {}
export async function getStoreConfig(...args: any[]) { return null; }
export async function suspendMobileNumber(...args: any[]) {}
export async function unsuspendMobileNumber(...args: any[]) {}
export async function toggleDistrictCod(...args: any[]) {}
export async function setAllDistrictsCodStatus(...args: any[]) {}
export async function generateJpgBill(...args: any[]) {}
export const DEFAULT_BANNER_IMAGE = "";
export const ODISHA_DISTRICTS = [];

export const updateOrderStatus = (...args: any[]) => {};