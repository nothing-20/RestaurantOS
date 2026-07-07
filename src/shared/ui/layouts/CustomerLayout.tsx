import React from 'react';
import { Outlet } from 'react-router-dom';

export const CustomerLayout: React.FC = () => {
  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col antialiased">
      <div className="absolute top-0 left-0 w-full h-[40%] bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
      <main className="flex-1 w-full relative z-10">
        <Outlet />
      </main>
    </div>
  );
};
export default CustomerLayout;
