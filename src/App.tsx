import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { WorkspaceProvider } from './context/WorkspaceContext';
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
              <CartProvider>
                <ThemeProvider>
                  {/* Master Application Routing */}
                  <AppRoutes />
                  
                  {/* Global toast notification system overlay */}
                  <ToastContainer />
                </ThemeProvider>
              </CartProvider>
            </RestaurantProvider>
          </UserProvider>
        </WorkspaceProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};
export default App;
