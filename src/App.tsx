import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
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
      </AuthProvider>
    </BrowserRouter>
  );
};
export default App;
