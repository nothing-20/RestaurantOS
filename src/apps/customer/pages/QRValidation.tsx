import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../../components/ui/Card/Card';
import Button from '../../../components/ui/Button/Button';
import Badge from '../../../components/ui/Badge/Badge';
import { QrCode, ArrowLeft } from 'lucide-react';

export const QRValidation: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-left relative overflow-hidden select-none">
      <div className="absolute top-[-10%] w-[500px] h-[500px] rounded-full bg-primary/10 blur-[130px] pointer-events-none" />
      
      <Card className="max-w-md w-full p-8 border-slate-850 bg-slate-900/40 relative z-10 text-center space-y-6">
        <div className="w-12 h-12 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-primary/5">
          <QrCode className="w-6 h-6 text-primary" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-xl font-display font-extrabold text-textPearl">QR Validation Portal</h1>
          <p className="text-xs text-mutedAsh font-semibold">Table-side pairing validation using secure multi-tenant checks.</p>
        </div>

        <div className="py-6 border-y border-slate-850/60">
          <Badge variant="warning" className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
            Coming in Sprint 7.x
          </Badge>
        </div>

        <Button
          onClick={() => navigate(-1)}
          className="w-full flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return Back</span>
        </Button>
      </Card>
    </div>
  );
};

export default QRValidation;
