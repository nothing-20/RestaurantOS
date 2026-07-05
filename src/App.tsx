import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { WorkspaceProvider } from './context/WorkspaceContext';
import { TenantProvider } from './context/TenantContext';
import { RestaurantProvider } from './context/RestaurantContext';
import { UserProvider } from './context/UserContext';
import { CartProvider } from './context/CartContext';
import { ThemeProvider } from './context/ThemeContext';
import AppRoutes from './routes/AppRoutes';
import { ToastContainer } from './components/ui/Toast/Toast';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WorkspaceProvider>
          <UserProvider>
            <RestaurantProvider>
              <TenantProvider>
                <CartProvider>
                  <ThemeProvider>
                    {/* Master Application Routing */}
                    <AppRoutes />
                    
                    {/* Global toast notification system overlay */}
                    <ToastContainer />
                  </ThemeProvider>
                </CartProvider>
              </TenantProvider>
            </RestaurantProvider>
          </UserProvider>
        </WorkspaceProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};
export default App;
