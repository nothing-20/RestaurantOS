import React, { useState, useMemo } from 'react';
import { useWaiterData } from './useWaiterData';
import Card from '../../../components/ui/Card/Card';
import Badge from '../../../components/ui/Badge/Badge';
import LoadingSpinner from '../../../components/ui/LoadingSpinner/LoadingSpinner';
import { formatPrice } from '../../../utils/format';
import { Search, Calendar, User, Clock, DollarSign, ListFilter, ClipboardCheck, Award } from 'lucide-react';

const TIMELINE_LABELS: Record<string, string> = {
  PLACED: 'Order Created',
  VERIFIED: 'Waiter Verified',
  SENT_TO_KITCHEN: 'Sent to Kitchen',
  ACCEPTED: 'Kitchen Accepted',
  PREPARING: 'Cooking Started',
  READY: 'Ready',
  PICKED_UP: 'Waiter Picked Up',
  DELIVERING: 'Delivering',
  DELIVERED: 'Delivered to Table',
  DINING: 'Dining',
  BILL_REQUESTED: 'Bill Requested',
  PAYMENT_COMPLETED: 'Payment Completed',
  COMPLETED: 'Closed',
  PAID: 'Paid'
};

export const WaiterOrderHistoryPage: React.FC = () => {
  const { orders, employees, isLoading } = useWaiterData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTable, setSelectedTable] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedWaiter, setSelectedWaiter] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  // Filter derivations
  const tableNumbers = useMemo(() => {
    const list = new Set<string>();
    orders.forEach(o => { if (o.tableNumber) list.add(String(o.tableNumber)); });
    return Array.from(list).sort((a, b) => Number(a) - Number(b));
  }, [orders]);

  const uniqueStatuses = useMemo(() => {
    const list = new Set<string>();
    orders.forEach(o => { if (o.status) list.add(o.status); });
    return Array.from(list).sort();
  }, [orders]);

  const uniqueWaiters = useMemo(() => {
    const list = new Set<string>();
    orders.forEach(o => { if (o.waiterName) list.add(o.waiterName); });
    return Array.from(list).sort();
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = 
        (o.orderId || '').toLowerCase().includes(term) ||
        (o.customerName || '').toLowerCase().includes(term) ||
        (o.customerPhone || o.phone || '').toLowerCase().includes(term) ||
        String(o.tableNumber).includes(term) ||
        (o.invoiceNumber || '').toLowerCase().includes(term) ||
        (o.waiterName || '').toLowerCase().includes(term) ||
        (o.assignedChefName || '').toLowerCase().includes(term) ||
        (o.createdAt || '').includes(term);

      const matchesTable = selectedTable === 'all' || String(o.tableNumber) === selectedTable;
      const matchesStatus = selectedStatus === 'all' || o.status === selectedStatus;
      const matchesWaiter = selectedWaiter === 'all' || o.waiterName === selectedWaiter;
      const matchesPayment = selectedPayment === 'all' || o.paymentStatus === selectedPayment;

      let matchesDate = true;
      if (dateFilter !== 'all') {
        const orderDate = new Date(o.createdAt);
        const now = new Date();
        if (dateFilter === 'today') {
          matchesDate = orderDate.toDateString() === now.toDateString();
        } else if (dateFilter === 'yesterday') {
          const yesterday = new Date();
          yesterday.setDate(now.getDate() - 1);
          matchesDate = orderDate.toDateString() === yesterday.toDateString();
        } else if (dateFilter === 'week') {
          const diffDays = Math.ceil(Math.abs(now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
          matchesDate = diffDays <= 7;
        }
      }

      return matchesSearch && matchesTable && matchesStatus && matchesWaiter && matchesPayment && matchesDate;
    });
  }, [orders, searchTerm, selectedTable, selectedStatus, selectedWaiter, selectedPayment, dateFilter]);

  const getSlaTimes = (order: any) => {
    let kitchenTime = '—';
    let deliveryTime = '—';

    if (order.createdAt && order.readyAt) {
      const diff = new Date(order.readyAt).getTime() - new Date(order.createdAt).getTime();
      kitchenTime = diff > 0 ? `${Math.round(diff / 60000)}m` : '—';
    }

    if (order.readyAt && order.deliveredAt) {
      const diff = new Date(order.deliveredAt).getTime() - new Date(order.readyAt).getTime();
      deliveryTime = diff > 0 ? `${Math.round(diff / 60000)}m` : '—';
    }

    return { kitchenTime, deliveryTime };
  };

  if (isLoading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <LoadingSpinner label="Loading order history database..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left select-none pb-24">
      <div>
        <h1 className="text-2xl font-display font-extrabold text-textPearl">Order History</h1>
        <p className="text-xs text-mutedAsh font-semibold">Search, audit, and inspect timelines of all customer orders.</p>
      </div>

      {/* Filters Toolbar */}
      <Card className="p-4 bg-slate-900/40 border-slate-850 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="relative col-span-1 md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by ID, Customer, Phone, Table, Waiter..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-955 border border-slate-800 rounded-xl text-textPearl outline-none focus:border-primary/50"
            />
          </div>

          <div className="space-y-1">
            <select
              value={selectedTable}
              onChange={e => setSelectedTable(e.target.value)}
              className="w-full bg-slate-955 border border-slate-800 rounded-xl p-2 text-xs text-slate-300 outline-none"
            >
              <option value="all">All Tables</option>
              {tableNumbers.map(n => (
                <option key={n} value={n}>Table {n}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-955 border border-slate-800 rounded-xl p-2 text-xs text-slate-300 outline-none"
            >
              <option value="all">All Statuses</option>
              {uniqueStatuses.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <select
              value={selectedWaiter}
              onChange={e => setSelectedWaiter(e.target.value)}
              className="w-full bg-slate-955 border border-slate-800 rounded-xl p-2 text-xs text-slate-300 outline-none"
            >
              <option value="all">All Waiters</option>
              {uniqueWaiters.map(w => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <select
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="w-full bg-slate-955 border border-slate-800 rounded-xl p-2 text-xs text-slate-300 outline-none"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">Past 7 Days</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <Card className="p-12 text-center border-slate-850 bg-slate-900/10 rounded-3xl text-slate-500">
          <Calendar className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <p className="text-sm font-semibold">No orders matched the selected filter criteria.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map(order => {
            const { kitchenTime, deliveryTime } = getSlaTimes(order);
            const subtotal = order.subtotal || 0;
            const discount = order.discount || 0;
            const tax = order.tax || 0;
            const grandTotal = order.total || 0;
            const guestCount = (order as any).guestsCount || '—';
            const phone = order.phone || (order as any).customerPhone || '—';
            const invoice = order.invoiceNumber || '—';
            const paymentMethod = order.paymentMethods ? Object.keys(order.paymentMethods).join(', ') : '—';
            const chef = order.assignedChefName || '—';
            
            return (
              <Card key={order.orderId} className="p-5 border-slate-850 bg-slate-900/20 rounded-2xl text-xs space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-3 border-b border-slate-800/40">
                  <div>
                    <h3 className="text-sm font-extrabold text-textPearl font-mono">ID: {order.orderId}</h3>
                    <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                      Placed on: {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="muted">Table {order.tableNumber}</Badge>
                    <Badge variant={order.paymentStatus === 'paid' ? 'success' : 'warning'}>
                      {order.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                    </Badge>
                    <Badge variant="warning">{order.status}</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Items List */}
                  <div className="space-y-1.5 md:col-span-2">
                    <strong className="text-[10px] text-slate-500 font-extrabold uppercase">Dishes Ordered:</strong>
                    <div className="space-y-1 pl-1 text-slate-350">
                      {order.items?.map((it: any, idx: number) => (
                        <div key={idx} className="flex justify-between">
                          <span>{it.name} ×{it.count}</span>
                          <span>{formatPrice(it.pricePerUnit * it.count)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="space-y-1.5">
                    <strong className="text-[10px] text-slate-500 font-extrabold uppercase">Customer & Staff:</strong>
                    <div className="space-y-1 text-slate-350">
                      <div className="flex justify-between">
                        <span>Customer Name:</span>
                        <span className="font-bold text-slate-300">{order.customerName || 'Diner'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Guest Count:</span>
                        <span className="text-slate-300">{guestCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Phone:</span>
                        <span className="text-slate-300">{phone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Waiter:</span>
                        <span className="font-semibold text-slate-300">{order.waiterName || '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Chef:</span>
                        <span className="font-semibold text-slate-300">{chef}</span>
                      </div>
                    </div>
                  </div>

                  {/* Financials & Invoice */}
                  <div className="space-y-1.5">
                    <strong className="text-[10px] text-slate-500 font-extrabold uppercase">Financials:</strong>
                    <div className="space-y-1 text-slate-350">
                      <div className="flex justify-between">
                        <span>Invoice:</span>
                        <span className="text-slate-300 font-mono">{invoice}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Payment Method:</span>
                        <span className="text-slate-300">{paymentMethod}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>{formatPrice(subtotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax (8%):</span>
                        <span>{formatPrice(tax)}</span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between text-rose-400">
                          <span>Discount:</span>
                          <span>-{formatPrice(discount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between border-t border-slate-800/40 pt-1">
                        <span className="font-bold">Grand Total:</span>
                        <span className="font-extrabold text-emerald-450">{formatPrice(grandTotal)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* SLA Timers */}
                  <div className="space-y-1.5 bg-slate-955/40 p-3 rounded-xl border border-slate-850 md:col-span-2">
                    <strong className="text-[9px] text-slate-500 font-extrabold uppercase">Service Timers:</strong>
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400">
                      <div className="flex justify-between items-center pr-2 border-r border-slate-800/60">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-yellow-450" /> Kitchen Ready:</span>
                        <span className="font-bold text-slate-200">{kitchenTime}</span>
                      </div>
                      <div className="flex justify-between items-center pl-1">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-orange-450" /> Serving Delivery:</span>
                        <span className="font-bold text-slate-200">{deliveryTime}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Audit */}
                  <div className="space-y-1.5 bg-slate-955/40 p-3 rounded-xl border border-slate-850 md:col-span-2">
                    <strong className="text-[9px] text-slate-500 font-extrabold uppercase">Status Incidents:</strong>
                    <div className="flex space-x-4 text-[10px] text-slate-400">
                      <div>
                        <span>Refund Status:</span>{' '}
                        <span className="font-bold text-slate-300">{(order as any).refundStatus || 'None'}</span>
                      </div>
                      <div>
                        <span>Cancellation:</span>{' '}
                        <span className={order.status === 'CANCELLED' ? 'text-red-400 font-bold' : 'text-slate-450'}>
                          {order.status === 'CANCELLED' ? 'Cancelled' : 'Active'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Audit Timeline */}
                {order.timeline && order.timeline.length > 0 && (
                  <div className="pt-3 border-t border-slate-800/40 space-y-2">
                    <strong className="text-[9px] text-slate-500 font-extrabold uppercase flex items-center gap-1">
                      <ClipboardCheck className="w-3.5 h-3.5 text-primary" />
                      Order Audit Trail Log
                    </strong>
                    <div className="flex flex-wrap gap-2.5">
                      {order.timeline.map((event: any, idx: number) => (
                        <div key={idx} className="flex items-center space-x-1.5 bg-slate-955 border border-slate-800 px-2 py-1 rounded-lg text-[9px] text-slate-400">
                          <span className="font-bold text-slate-300">{TIMELINE_LABELS[event.type] || event.type || event.title}</span>
                          <span className="text-slate-600">|</span>
                          <span className="text-[8px]">{new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WaiterOrderHistoryPage;
