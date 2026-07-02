import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export const DashboardLayout: React.FC = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar navigation */}
      <Sidebar />

      {/* Dashboard container viewport */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <Navbar />

        {/* Dynamic page viewport */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-6 relative">
          {/* Visual gradient background light */}
          <div className="absolute top-[10%] right-[5%] w-[400px] h-[400px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[10%] left-[5%] w-[300px] h-[300px] rounded-full bg-accent/5 blur-[100px] pointer-events-none" />

          <div className="relative z-10 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
export default DashboardLayout;
