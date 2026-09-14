import React from 'react';
import Card from '../../../components/ui/Card/Card';
import { Settings, Monitor, Bell, Clock, Utensils, Users, Gauge, Construction } from 'lucide-react';

const KitchenSettingsPage: React.FC = () => {
  const settingSections = [
    {
      icon: <Monitor className="w-5 h-5 text-blue-400" />,
      title: 'Display Settings',
      description: 'Configure KDS display layout, font sizes, card density, and auto-refresh intervals.',
    },
    {
      icon: <Clock className="w-5 h-5 text-orange-400" />,
      title: 'SLA Targets',
      description: 'Set target preparation times per category, priority thresholds, and delay alerts.',
    },
    {
      icon: <Bell className="w-5 h-5 text-amber-400" />,
      title: 'Notification Preferences',
      description: 'Configure sound alerts, voice notifications, push notifications, and escalation rules.',
    },
    {
      icon: <Utensils className="w-5 h-5 text-emerald-400" />,
      title: 'Station Configuration',
      description: 'Define cooking stations, assign menu categories, set station capacities and chef assignments.',
    },
    {
      icon: <Users className="w-5 h-5 text-violet-400" />,
      title: 'Shift Rules',
      description: 'Configure shift duration limits, break reminders, overtime alerts, and auto-assignment rules.',
    },
    {
      icon: <Gauge className="w-5 h-5 text-red-400" />,
      title: 'Capacity Settings',
      description: 'Set maximum kitchen capacity, order throttling rules, and overload warnings.',
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-4xl font-sans">
      {/* Header */}
      <div className="bg-white border border-[#E3DED5] rounded-xl p-6 shadow-[0_1px_4px_rgba(30,30,20,0.05)]">
        <span className="text-[11px] font-bold uppercase tracking-widest text-[#5F6762]">
          KITCHEN CONFIGURATION & RULES
        </span>
        <h1 className="text-3xl font-serif font-semibold text-[#18201D] tracking-tight mt-0.5">
          Kitchen Settings
        </h1>
        <p className="text-sm text-[#5F6762] mt-1 font-normal">
          Configure kitchen display system layouts, SLAs, stations, and operations
        </p>
      </div>

      {/* Under Construction Banner */}
      <div className="flex items-center space-x-3 px-5 py-4 rounded-xl bg-[#FEF5E7] border border-[#D79A24]/30 text-[#A66B00]">
        <Construction className="w-5 h-5 shrink-0 text-[#D79A24]" />
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#A66B00]">Settings Module — Coming Soon</p>
          <p className="text-xs text-[#5F6762] mt-0.5">
            This page will allow you to customize every aspect of your Kitchen Display System. 
            Settings are currently managed through the system defaults.
          </p>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {settingSections.map((section, idx) => (
          <div
            key={idx}
            className="p-5 bg-white border border-[#E3DED5] rounded-xl shadow-[0_1px_4px_rgba(30,30,20,0.05)] cursor-not-allowed"
          >
            <div className="flex items-start space-x-3">
              <div className="p-2.5 bg-[#F7F4EE] rounded-lg border border-[#E3DED5] shrink-0">
                {section.icon}
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#18201D]">{section.title}</h3>
                <p className="text-xs text-[#5F6762] mt-1 leading-relaxed">{section.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KitchenSettingsPage;
