export type TUserRole = 'super-admin' | 'owner' | 'admin' | 'manager' | 'waiter' | 'kitchen' | 'cashier' | 'reception' | 'customer';

export interface IUser {
  uid: string;
  email: string;
  displayName: string;
  tenantId: string;
  role: TUserRole;
  status: 'active' | 'inactive';
  phoneNumber?: string;
  createdAt: string;
}
