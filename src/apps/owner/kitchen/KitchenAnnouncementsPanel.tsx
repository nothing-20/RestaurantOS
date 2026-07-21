import React, { useState, useEffect } from 'react';
import Card from '../../../components/ui/Card/Card';
import { Megaphone, X, Pin, AlertTriangle, Info, CheckCircle, Plus } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { IKitchenAnnouncement, TAnnouncementType } from '../../../shared/domain/orders/types';
import { kitchenService } from '../../../shared/services/kitchenService';
import { toast } from 'react-hot-toast';

const TYPE_CONFIG: Record<TAnnouncementType, { icon: React.ReactNode; color: string }> = {
  info:    { icon: <Info className="w-3.5 h-3.5" />,          color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  warning: { icon: <AlertTriangle className="w-3.5 h-3.5" />, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  urgent:  { icon: <AlertTriangle className="w-3.5 h-3.5" />, color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  success: { icon: <CheckCircle className="w-3.5 h-3.5" />,   color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
};

const KitchenAnnouncementsPanel: React.FC = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<IKitchenAnnouncement[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [newType, setNewType] = useState<TAnnouncementType>('info');

  useEffect(() => {
    if (!user?.tenantId) return;
    const unsub = kitchenService.subscribeToAnnouncements(user.tenantId, setAnnouncements);
    return () => unsub();
  }, [user?.tenantId]);

  const handleCreate = async () => {
    if (!user?.tenantId || !newMessage.trim()) return;
    try {
      await kitchenService.createAnnouncement(user.tenantId, {
        message: newMessage.trim(),
        type: newType,
        createdBy: user.uid || '',
        createdByName: user.displayName || user.email || 'Kitchen Staff',
        createdAt: new Date().toISOString(),
      });
      setNewMessage('');
      setShowForm(false);
      toast.success('Announcement posted');
    } catch (err) {
      toast.error('Failed to post announcement');
    }
  };

  const handleDismiss = async (id: string) => {
    if (!user?.tenantId) return;
    try {
      await kitchenService.dismissAnnouncement(user.tenantId, id);
    } catch (err) {
      toast.error('Failed to dismiss');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-extrabold text-textPearl flex items-center space-x-1.5">
          <Megaphone className="w-3.5 h-3.5 text-amber-400" />
          <span>Kitchen Announcements</span>
          {announcements.length > 0 && (
            <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full">
              {announcements.length}
            </span>
          )}
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-[9px] font-extrabold text-primary hover:text-primary/80 flex items-center space-x-0.5"
        >
          <Plus className="w-3 h-3" />
          <span>New</span>
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-2">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type announcement..."
            className="w-full bg-transparent border border-slate-800 rounded-lg px-3 py-2 text-xs text-textPearl placeholder:text-slate-600 outline-none focus:border-primary/50 resize-none"
            rows={2}
          />
          <div className="flex items-center justify-between">
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as TAnnouncementType)}
              className="text-[10px] bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300 outline-none"
            >
              <option value="info">ℹ️ Info</option>
              <option value="warning">⚠️ Warning</option>
              <option value="urgent">🚨 Urgent</option>
              <option value="success">✅ Success</option>
            </select>
            <div className="flex gap-2">
              <button
                onClick={() => setShowForm(false)}
                className="text-[10px] font-bold text-slate-500 hover:text-slate-300 px-2 py-1"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!newMessage.trim()}
                className="text-[10px] font-extrabold text-primary bg-primary/10 border border-primary/20 hover:bg-primary/20 px-3 py-1 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Post
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Announcements List */}
      {announcements.length === 0 ? (
        <p className="text-[10px] text-slate-500 text-center py-2">No active announcements</p>
      ) : (
        <div className="space-y-1.5">
          {announcements.map(a => {
            const conf = TYPE_CONFIG[a.type] || TYPE_CONFIG.info;
            return (
              <div
                key={a.id}
                className={`flex items-start justify-between px-3 py-2 rounded-xl border text-[10px] ${conf.color}`}
              >
                <div className="flex items-start space-x-2 flex-1 min-w-0">
                  {conf.icon}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold leading-tight">{a.message}</p>
                    <p className="text-[9px] opacity-60 mt-0.5">
                      {a.createdByName} · {new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => a.id && handleDismiss(a.id)}
                  className="text-current opacity-40 hover:opacity-100 ml-1 shrink-0"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default KitchenAnnouncementsPanel;
