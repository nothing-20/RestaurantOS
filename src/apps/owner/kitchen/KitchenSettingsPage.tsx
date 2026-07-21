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
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="p-2.5 bg-slate-800/60 rounded-2xl border border-slate-700">
          <Settings className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-extrabold text-textPearl">Kitchen Settings</h1>
          <p className="text-xs text-mutedAsh">Configure kitchen display system and operations</p>
        </div>
      </div>

      {/* Under Construction Banner */}
      <div className="flex items-center space-x-3 px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
        <Construction className="w-5 h-5 shrink-0" />
        <div>
          <p className="text-xs font-extrabold">Settings Module — Coming Soon</p>
          <p className="text-[10px] opacity-70 mt-0.5">
            This page will allow you to customize every aspect of your Kitchen Display System. 
            Settings are currently managed through the system defaults.
          </p>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {settingSections.map((section, idx) => (
          <Card
            key={idx}
            className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl hover:border-slate-700 transition-all cursor-not-allowed opacity-60"
          >
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-slate-800/60 rounded-xl border border-slate-700/50 shrink-0">
                {section.icon}
              </div>
              <div>
                <h3 className="text-xs font-extrabold text-textPearl">{section.title}</h3>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{section.description}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default KitchenSettingsPage;
