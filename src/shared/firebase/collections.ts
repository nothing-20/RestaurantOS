// Firestore collection names and subcollection path helper generators

export const COLLECTIONS = {
  TENANTS: 'tenants',
  RESTAURANTS: 'restaurants',
  USERS: 'users',
  EMPLOYEES: 'employees',
  AUDIT_LOGS: 'auditLogs',
  SUPPORT_TICKETS: 'supportTickets',
  FEATURE_FLAGS: 'featureFlags',
  SYSTEM_SETTINGS: 'systemSettings',
};

export const getSubcollectionPath = (tenantId: string, subName: string) => {
  return `${COLLECTIONS.RESTAURANTS}/${tenantId}/${subName}`;
};

export const getBranchPath = (tenantId: string) => getSubcollectionPath(tenantId, 'branches');
export const getEmployeePath = (tenantId: string) => getSubcollectionPath(tenantId, 'employees');
export const getRolePath = (tenantId: string) => getSubcollectionPath(tenantId, 'roles');
export const getPermissionPath = (tenantId: string) => getSubcollectionPath(tenantId, 'permissions');
export const getTablePath = (tenantId: string) => getSubcollectionPath(tenantId, 'tables');
export const getMenuCategoryPath = (tenantId: string) => `${COLLECTIONS.RESTAURANTS}/${tenantId}/menu/default/categories`;
export const getMenuItemPath = (tenantId: string) => `${COLLECTIONS.RESTAURANTS}/${tenantId}/menu/default/items`;
export const getMenuVariantPath = (tenantId: string) => `${COLLECTIONS.RESTAURANTS}/${tenantId}/menu/default/variants`;
export const getMenuAddonPath = (tenantId: string) => `${COLLECTIONS.RESTAURANTS}/${tenantId}/menu/default/addons`;
export const getMenuComboPath = (tenantId: string) => `${COLLECTIONS.RESTAURANTS}/${tenantId}/menu/default/combos`;


export const getOrderPath = (tenantId: string) => getSubcollectionPath(tenantId, 'orders');
export const getKitchenTicketPath = (tenantId: string) => getSubcollectionPath(tenantId, 'kitchenTickets');
export const getInventoryPath = (tenantId: string) => getSubcollectionPath(tenantId, 'inventory');
export const getSupplierPath = (tenantId: string) => getSubcollectionPath(tenantId, 'suppliers');
export const getNotificationPath = (tenantId: string) => getSubcollectionPath(tenantId, 'notifications');
export const getAnalyticsPath = (tenantId: string) => getSubcollectionPath(tenantId, 'analytics');
export const getSubscriptionPath = (tenantId: string) => getSubcollectionPath(tenantId, 'subscriptions');
