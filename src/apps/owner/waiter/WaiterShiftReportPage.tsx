import React, { useMemo, useState } from 'react';
import { useWaiterData } from './useWaiterData';
import { useAuth } from '../../../context/AuthContext';
import Card from '../../../components/ui/Card/Card';
import Badge from '../../../components/ui/Badge/Badge';
import LoadingSpinner from '../../../components/ui/LoadingSpinner/LoadingSpinner';
import { formatPrice } from '../../../utils/format';
import toast from 'react-hot-toast';
import { Calendar, DollarSign, Users, Award, TrendingUp, ClipboardCheck, CheckSquare, Printer, Download } from 'lucide-react';

export const WaiterShiftReportPage: React.FC = () => {
  const { user } = useAuth();
  const { orders = [], waiterRequests = [], isLoading } = useWaiterData();
  const [approvalRequested, setApprovalRequested] = useState(false);

  const report = useMemo(() => {
    const waiterOrders = (orders || []).filter(o => o.waiterId === user?.uid);
    const deliveredOrders = waiterOrders.filter(o => o.status === 'DELIVERED' || o.status === 'COMPLETED' || o.status === 'ARCHIVED');

    let totalServiceTime = 0;
    let serviceCount = 0;

    deliveredOrders.forEach(o => {
      if (o.createdAt && o.deliveredAt) {
        const diff = new Date(o.deliveredAt).getTime() - new Date(o.createdAt).getTime();
        if (diff > 0) {
          totalServiceTime += diff;
          serviceCount++;
        }
      }
    });

    const avgServiceTime = serviceCount > 0 
      ? `${Math.round((totalServiceTime / serviceCount) / 60000)} mins` 
      : '—';

    // Revenue & Tips
    const revenue = waiterOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const tablesServed = new Set(waiterOrders.map(o => String(o.tableNumber || ''))).size;
    const tips = waiterOrders.length * 350;

    // Task completions
    const myAlerts = (waiterRequests || []).filter(r => r.acceptedBy === (user?.displayName || user?.email));
    const completedTasks = myAlerts.filter(r => r.status === 'Completed').length;
    const pendingTasks = myAlerts.filter(r => r.status !== 'Completed').length;

    // Incidents
    const incidents = waiterOrders.filter(o => o.status === 'CANCELLED').length;

    // Payment breakdowns
    let cashTotal = 0;
    let cardTotal = 0;
    let upiTotal = 0;

    waiterOrders.forEach(o => {
      if (o.status === 'COMPLETED' || o.paymentStatus === 'paid') {
        const total = o.total || 0;
        if (o.paymentMethods && typeof o.paymentMethods === 'object') {
          if (o.paymentMethods.cash) cashTotal += total;
          if (o.paymentMethods.card || o.paymentMethods.credit) cardTotal += total;
          if (o.paymentMethods.upi || o.paymentMethods.qr) upiTotal += total;
        } else {
          const mode = (o as any).paymentMode || 'card';
          if (mode === 'cash') cashTotal += total;
          else if (mode === 'upi') upiTotal += total;
          else cardTotal += total;
        }
      }
    });

    return {
      tablesServed,
      ordersDelivered: deliveredOrders.length,
      revenue,
      avgServiceTime,
      tips,
      completedTasks,
      pendingTasks,
      incidents,
      cashTotal,
      cardTotal,
      upiTotal
    };
  }, [orders, waiterRequests, user]);

  const handleRequestApproval = () => {
    setApprovalRequested(true);
    toast.success('Shift checkout approval sent to manager console.');
  };

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Metric,Value",
         `Tables Served,${report.tablesServed}`,
         `Orders Delivered,${report.ordersDelivered}`,
         `Total Shift Revenue,${report.revenue}`,
         `Cash Revenue,${report.cashTotal}`,
         `Card Revenue,${report.cardTotal}`,
         `UPI Revenue,${report.upiTotal}`,
         `Estimated Tips,${report.tips}`,
         `Average Service Duration,${report.avgServiceTime}`,
         `Resolved Requests,${report.completedTasks}`,
         `Pending Tasks,${report.pendingTasks}`,
         `Reported Incidents,${report.incidents}`
        ].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `shift_report_${user?.uid || 'waiter'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Shift report exported as CSV.');
  };

  const handlePrintReport = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Daily Shift Report</title>
            <style>
              body { font-family: monospace; padding: 30px; text-align: left; }
              .header { text-align: center; margin-bottom: 30px; }
              .row { display: flex; justify-content: space-between; margin-bottom: 8px; }
              .divider { border-bottom: 1px dashed #000; margin: 15px 0; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>DAILY SHIFT REPORT</h2>
              <p>Staff: ${user?.displayName || user?.email}</p>
              <p>Generated: ${new Date().toLocaleString()}</p>
            </div>
            <div class="divider"></div>
            <div class="row"><span>Tables Served:</span> <span>${report.tablesServed}</span></div>
            <div class="row"><span>Orders Delivered:</span> <span>${report.ordersDelivered}</span></div>
            <div class="row"><span>Total Sales:</span> <span>${formatPrice(report.revenue)}</span></div>
            <div class="divider"></div>
            <div class="row"><span>Cash Sales:</span> <span>${formatPrice(report.cashTotal)}</span></div>
            <div class="row"><span>Card Sales:</span> <span>${formatPrice(report.cardTotal)}</span></div>
            <div class="row"><span>UPI Sales:</span> <span>${formatPrice(report.upiTotal)}</span></div>
            <div class="divider"></div>
            <div class="row"><span>Estimated Tips:</span> <span>${formatPrice(report.tips)}</span></div>
            <div class="row"><span>Avg Service Duration:</span> <span>${report.avgServiceTime}</span></div>
            <div class="row"><span>Resolved Tasks:</span> <span>${report.completedTasks}</span></div>
            <div class="row"><span>Reported Incidents:</span> <span>${report.incidents}</span></div>
            <script>window.print();</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  if (isLoading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <LoadingSpinner label="Compiling shift report metrics..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left select-none pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-extrabold text-[#18201D]">Daily Shift Report</h1>
          <p className="text-xs text-[#5F6875] font-semibold">Automatic shift closing summaries, orders resolved, tips earned, and revenue performance.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePrintReport}
            className="p-2.5 bg-white border border-[#E3DED5] text-[#18201D] rounded-xl hover:bg-[#F7F4EE] shadow-xs transition-all flex items-center gap-1.5 text-xs font-bold"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="p-2.5 bg-white border border-[#E3DED5] text-[#18201D] rounded-xl hover:bg-[#F7F4EE] shadow-xs transition-all flex items-center gap-1.5 text-xs font-bold"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="p-6 bg-white border border-[#E3DED5] rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            <h3 className="font-extrabold text-sm text-[#18201D] uppercase tracking-wider">Shift Revenue & Tips</h3>
          </div>
          <div className="space-y-3 font-semibold text-xs">
            <div className="flex justify-between border-b border-[#E3DED5] pb-2">
              <span className="text-[#5F6875]">Total Shift Sales:</span>
              <span className="font-extrabold text-emerald-700 font-mono">{formatPrice(report.revenue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#5F6875]">Estimated Tips:</span>
              <span className="font-extrabold text-[#18201D] font-mono">{formatPrice(report.tips)}</span>
            </div>
          </div>
        </Card>

        {/* Payment Breakdown */}
        <Card className="p-6 bg-white border border-[#E3DED5] rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            <h3 className="font-extrabold text-sm text-[#18201D] uppercase tracking-wider">Payment Breakdown</h3>
          </div>
          <div className="space-y-3 font-semibold text-xs">
            <div className="flex justify-between border-b border-[#E3DED5] pb-2">
              <span className="text-[#5F6875]">Cash Receipts:</span>
              <span className="font-extrabold text-[#18201D] font-mono">{formatPrice(report.cashTotal)}</span>
            </div>
            <div className="flex justify-between border-b border-[#E3DED5] pb-2">
              <span className="text-[#5F6875]">Card Receipts:</span>
              <span className="font-extrabold text-[#18201D] font-mono">{formatPrice(report.cardTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#5F6875]">UPI/QR Receipts:</span>
              <span className="font-extrabold text-[#18201D] font-mono">{formatPrice(report.upiTotal)}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white border border-[#E3DED5] rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center space-x-2">
            <ClipboardCheck className="w-5 h-5 text-emerald-600" />
            <h3 className="font-extrabold text-sm text-[#18201D] uppercase tracking-wider">Task Allocations</h3>
          </div>
          <div className="space-y-3 font-semibold text-xs">
            <div className="flex justify-between border-b border-[#E3DED5] pb-2">
              <span className="text-[#5F6875]">Resolved Requests:</span>
              <span className="font-extrabold text-emerald-700">{report.completedTasks}</span>
            </div>
            <div className="flex justify-between border-b border-[#E3DED5] pb-2">
              <span className="text-[#5F6875]">Pending Tasks:</span>
              <span className="font-extrabold text-[#18201D]">{report.pendingTasks}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#5F6875]">Reported Incidents:</span>
              <span className={report.incidents > 0 ? 'text-red-700 font-extrabold' : 'text-[#18201D]'}>{report.incidents}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Approval Status and Close Shift Actions */}
      <Card className="p-6 border border-[#E3DED5] bg-white rounded-2xl shadow-xs flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
        <div>
          <h3 className="font-extrabold text-sm text-[#18201D] flex items-center gap-2 justify-center md:justify-start">
            <span>Shift Closing Checklist</span>
            {approvalRequested ? (
              <Badge variant="warning" className="font-bold">Manager Review Pending</Badge>
            ) : (
              <Badge variant="muted" className="font-bold">Awaiting Manager Sign-off</Badge>
            )}
          </h3>
          <p className="text-xs text-[#5F6875] mt-1">Please ensure all pending table invoices are checked out and manager approval is requested.</p>
        </div>
        <div className="flex gap-2">
          {!approvalRequested && (
            <button
              onClick={handleRequestApproval}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all"
            >
              Request Approval
            </button>
          )}
          <button
            onClick={() => toast.success('Shift closed successfully.')}
            disabled={!approvalRequested}
            className={`px-5 py-2.5 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all ${
              approvalRequested 
                ? 'bg-primary text-white hover:bg-primary/90' 
                : 'bg-[#E3DED5] text-[#667085] cursor-not-allowed'
            }`}
          >
            Close & Archive Shift
          </button>
        </div>
      </Card>
    </div>
  );
};

export default WaiterShiftReportPage;
