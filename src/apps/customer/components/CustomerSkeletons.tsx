import React from 'react';

export const MenuItemSkeleton: React.FC = () => {
  return (
    <div className="p-4 bg-white border border-[#EEE7E1] rounded-2xl flex flex-col space-y-3.5 animate-pulse shadow-xs">
      <div className="w-full h-40 rounded-xl bg-[#FFF8F2] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#EEE7E1]/40 to-transparent animate-shimmer" />
      </div>
      <div className="flex justify-between items-start">
        <div className="h-4 w-36 bg-[#EEE7E1] rounded" />
        <div className="h-4 w-16 bg-[#EEE7E1] rounded" />
      </div>
      <div className="h-3 w-4/5 bg-[#EEE7E1]/60 rounded" />
      <div className="flex gap-2 pt-1">
        <div className="h-6 w-16 bg-[#FFF8F2] rounded-full" />
        <div className="h-6 w-20 bg-[#FFF8F2] rounded-full" />
      </div>
      <div className="flex justify-between items-center pt-2 border-t border-[#EEE7E1]">
        <div className="h-4 w-12 bg-[#EEE7E1] rounded" />
        <div className="h-7 w-20 bg-[#E85D3F]/20 rounded-xl" />
      </div>
    </div>
  );
};

export const CategorySkeleton: React.FC = () => {
  return (
    <div className="flex items-center space-x-2.5 overflow-x-auto pb-1 scrollbar-none animate-pulse">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} className="h-9 w-28 bg-[#FFF8F2] border border-[#EEE7E1] rounded-full shrink-0" />
      ))}
    </div>
  );
};

export const BannerSkeleton: React.FC = () => {
  return (
    <div className="w-full h-44 md:h-56 rounded-3xl bg-[#FFF8F2] border border-[#EEE7E1] animate-pulse relative overflow-hidden p-6 flex flex-col justify-end">
      <div className="h-6 w-48 bg-[#EEE7E1] rounded mb-2" />
      <div className="h-4 w-64 bg-[#EEE7E1]/60 rounded" />
    </div>
  );
};

export const OrderTrackerSkeleton: React.FC = () => {
  return (
    <div className="p-6 bg-white border border-[#EEE7E1] rounded-3xl space-y-4 animate-pulse shadow-xs">
      <div className="flex justify-between items-center pb-3 border-b border-[#EEE7E1]">
        <div className="h-4 w-28 bg-[#EEE7E1] rounded" />
        <div className="h-4 w-20 bg-[#EEE7E1] rounded" />
      </div>
      <div className="space-y-4 py-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-[#EEE7E1] shrink-0" />
            <div className="space-y-1.5 flex-1">
              <div className="h-3.5 w-32 bg-[#EEE7E1] rounded" />
              <div className="h-3 w-48 bg-[#EEE7E1]/50 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MenuItemSkeleton;
