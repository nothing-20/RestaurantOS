import React, { useState, useMemo } from 'react';
import Card from '../../../components/ui/Card/Card';
import Select from '../../../components/ui/Select/Select';
import { Search, Calendar, User, LayoutGrid, CheckCircle } from 'lucide-react';

interface IOrderHistoryTabProps {
  orders: any[];
  employees: any[];
}

export const OrderHistoryTab: React.FC<IOrderHistoryTabProps> = ({ orders, employees }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChef, setSelectedChef] = useState('all');
  const [selectedWaiter, setSelectedWaiter] = useState('all');
  const [selectedTable, setSelectedTable] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [dateRange, setDateRange] = useState('all'); // all, today, week, month
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Derive unique lists for filters
  const waiters = useMemo(() => {
    const list = new Set<string>();
    orders.forEach(o => { if (o.waiterName) list.add(o.waiterName); });
    return Array.from(list).sort();
  }, [orders]);

  const tables = useMemo(() => {
    const list = new Set<string>();
    orders.forEach(o => { if (o.tableNumber) list.add(String(o.tableNumber)); });
    return Array.from(list).sort((a, b) => Number(a) - Number(b));
  }, [orders]);

  const statuses = useMemo(() => {
    const list = new Set<string>();
    orders.forEach(o => { if (o.status) list.add(o.status); });
    return Array.from(list).sort();
  }, [orders]);

  // Filter logic
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchesSearch = 
        (o.orderId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.items?.some((i: any) => i.name.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesChef = selectedChef === 'all' || o.assignedChefName === selectedChef;
      const matchesWaiter = selectedWaiter === 'all' || o.waiterName === selectedWaiter;
      const matchesTable = selectedTable === 'all' || String(o.tableNumber) === selectedTable;
      const matchesStatus = selectedStatus === 'all' || o.status === selectedStatus;

      // Date filtering
      if (dateRange === 'all') return matchesSearch && matchesChef && matchesWaiter && matchesTable && matchesStatus;
      
      const orderDate = new Date(o.createdAt);
      const now = new Date();
      let matchesDate = false;

      if (dateRange === 'today') {
        matchesDate = orderDate.toDateString() === now.toDateString();
      } else if (dateRange === 'week') {
        const diffTime = Math.abs(now.getTime() - orderDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        matchesDate = diffDays <= 7;
      } else if (dateRange === 'month') {
        matchesDate = orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
      }

      return matchesSearch && matchesChef && matchesWaiter && matchesTable && matchesStatus && matchesDate;
    });
  }, [orders, searchTerm, selectedChef, selectedWaiter, selectedTable, selectedStatus, dateRange]);

  // Sort orders descending by creation timestamp
  const sortedOrders = useMemo(() => {
    return [...filteredOrders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [filteredOrders]);

  // Pagination logic
  const totalPages = Math.ceil(sortedOrders.length / itemsPerPage);
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedOrders.slice(start, start + itemsPerPage);
  }, [sortedOrders, currentPage]);

  const calculateKitchenDuration = (order: any) => {
    if (!order.createdAt || !order.readyAt) return '—';
    const start = new Date(order.createdAt).getTime();
    const end = new Date(order.readyAt).getTime();
    const diffMs = end - start;
    if (diffMs < 0) return '—';
    const mins = Math.floor(diffMs / 60000);
    const secs = Math.floor((diffMs % 60000) / 1000);
    return `${mins}m ${secs}s`;
  };

  const formatTimestamp = (isoString?: string) => {
    if (!isoString) return '—';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' · ' + date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-4 text-left select-none">
      {/* Search & Multi Filter Bar */}
      <Card className="p-4 border-slate-850 bg-slate-900/35 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search Order ID or item..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-950/40 border border-slate-850 rounded-xl text-textPearl outline-none focus:border-primary/50"
            />
          </div>

          <Select
            value={selectedChef}
            onChange={e => { setSelectedChef(e.target.value); setCurrentPage(1); }}
            options={[
              { value: 'all', label: 'All Chefs' },
              ...employees.filter(emp => emp.role === 'chef' || emp.role === 'kitchen_staff').map(emp => ({ value: emp.fullName, label: emp.fullName }))
            ]}
          />

          <Select
            value={selectedWaiter}
            onChange={e => { setSelectedWaiter(e.target.value); setCurrentPage(1); }}
            options={[
              { value: 'all', label: 'All Waiters' },
              ...waiters.map(w => ({ value: w, label: w }))
            ]}
          />

          <Select
            value={selectedTable}
            onChange={e => { setSelectedTable(e.target.value); setCurrentPage(1); }}
            options={[
              { value: 'all', label: 'All Tables' },
              ...tables.map(t => ({ value: t, label: `Table ${t}` }))
            ]}
          />

          <Select
            value={selectedStatus}
            onChange={e => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
            options={[
              { value: 'all', label: 'All Statuses' },
              ...statuses.map(s => ({ value: s, label: s }))
            ]}
          />
        </div>

        <div className="flex items-center space-x-2 border-t border-slate-850/50 pt-3">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Date range:</span>
          {['all', 'today', 'week', 'month'].map(r => (
            <button
              key={r}
              onClick={() => { setDateRange(r); setCurrentPage(1); }}
              className={`px-3 py-1 text-[10px] font-bold rounded-lg border transition-all uppercase tracking-wider ${
                dateRange === r
                  ? 'bg-primary/10 border-primary/30 text-primary'
                  : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-textPearl'
              }`}
            >
              {r}
            </button>
          ))}
          <span className="ml-auto text-[10px] text-slate-500 font-bold">{sortedOrders.length} records found</span>
        </div>
      </Card>

      {/* Results Table */}
      <Card className="border-slate-850 bg-slate-900/35 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 border-b border-slate-850 text-slate-400 font-extrabold uppercase tracking-widest text-[9px]">
              <tr>
                <th className="px-4 py-3.5">Order ID</th>
                <th className="px-4 py-3.5 text-center">Table</th>
                <th className="px-4 py-3.5">Waiter</th>
                <th className="px-4 py-3.5">Assigned Chef</th>
                <th className="px-4 py-3.5">Items</th>
                <th className="px-4 py-3.5 text-center">Qty</th>
                <th className="px-4 py-3.5 text-center">Kitchen Duration</th>
                <th className="px-4 py-3.5">Created At</th>
                <th className="px-4 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500 font-semibold">
                    No matching order history records found.
                  </td>
                </tr>
              ) : (
                paginatedOrders.map(o => (
                  <tr key={o.orderId} className="hover:bg-slate-900/25 transition-colors">
                    <td className="px-4 py-4 font-mono font-bold text-textPearl">
                      {o.orderId}
                    </td>
                    <td className="px-4 py-4 text-center font-extrabold text-slate-300">T{o.tableNumber}</td>
                    <td className="px-4 py-4 text-slate-350 font-medium">{o.waiterName || '—'}</td>
                    <td className="px-4 py-4 text-slate-350 font-semibold">{o.assignedChefName || 'Unassigned'}</td>
                    <td className="px-4 py-4 text-slate-400 font-medium max-w-[200px] truncate" title={o.items?.map((i: any) => `${i.count}x ${i.name}`).join(', ')}>
                      {o.items?.map((i: any) => `${i.count}x ${i.name}`).join(', ')}
                    </td>
                    <td className="px-4 py-4 text-center font-bold text-slate-300">
                      {o.items?.reduce((acc: number, i: any) => acc + i.count, 0) || 0}
                    </td>
                    <td className="px-4 py-4 text-center font-mono font-extrabold text-primary">{calculateKitchenDuration(o)}</td>
                    <td className="px-4 py-4 font-mono text-[10px] text-slate-450">{formatTimestamp(o.createdAt)}</td>
                    <td className="px-4 py-4">
                      <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border ${
                        o.status === 'COMPLETED' || o.status === 'PAID' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-450' :
                        o.status === 'CANCELLED' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                        'bg-blue-500/10 border-blue-500/20 text-blue-400'
                      }`}>
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center bg-slate-950 p-4 border-t border-slate-850">
            <span className="text-[10px] text-slate-500 font-bold">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex space-x-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-slate-400 hover:text-textPearl transition-all disabled:opacity-30 disabled:pointer-events-none"
              >
                Previous
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-slate-400 hover:text-textPearl transition-all disabled:opacity-30 disabled:pointer-events-none"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
export default OrderHistoryTab;
