import React from 'react';
import DashboardLayout from './DashboardLayout';

export const AdminLayout: React.FC = () => {
  // Inherits global dashboard sidebar and header layout mapping admin permissions
  return <DashboardLayout />;
};
export default AdminLayout;
