import React, { useEffect, useState } from 'react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc 
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../context/AuthContext';
import { IOrder } from '../../../types';
import { formatPrice } from '../../../utils/format';

// UI Kit components
import Card from '../../../components/ui/Card/Card';
import Badge from '../../../components/ui/Badge/Badge';
import Button from '../../../components/ui/Button/Button';
import Input from '../../../components/ui/Input/Input';
import Modal from '../../../components/ui/Modal/Modal';
import LoadingSpinner from '../../../components/ui/LoadingSpinner/LoadingSpinner';

// Hot Toast notifications
import toast from 'react-hot-toast';
import { 
  LayoutGrid, 
  Coffee, 
  DollarSign, 
  UserCheck, 
  CheckCircle,
  Clock, 
  ChevronRight 
} from 'lucide-react';

export const WaiterMatrix: React.FC = () => {
  const { user } = useAuth();
  
  // Real-time Database states
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Bill Modal states
  const [selectedOrder, setSelectedOrder] = useState<IOrder | null>(null);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [isUpdatingBill, setIsUpdatingBill] = useState(false);

  // Subscribe to real-time orders restaurants/{restaurantId}/orders
  useEffect(() => {
    if (!user?.tenantId) return;

    setIsLoading(true);
    const colRef = collection(db, 'restaurants', user.tenantId, 'orders');

    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const list: IOrder[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ ...docSnap.data() } as IOrder);
        });
        setOrders(list);
        setIsLoading(false);
      },
      (error) => {
        console.error(error);
        toast.error('Failed to subscribe to orders feed.');
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Status transitions
  const handleAssignWaiter = async (orderId: string) => {
    if (!user?.tenantId) return;
    try {
      const docRef = doc(db, 'restaurants', user.tenantId, 'orders', orderId);
      // Assign waiterId to current authenticated staff display name
      const waiterName = user.displayName || user.email || 'Staff';
      await updateDoc(docRef, { waiterId: waiterName });
      toast.success(`Assigned to ${waiterName}`, { id: 'waiter-assign-toast' });
    } catch (e) {
      console.error(e);
      toast.error('Failed to assign waiter.');
    }
  };

  const handleMarkDelivered = async (orderId: string) => {
    if (!user?.tenantId) return;
    try {
      const docRef = doc(db, 'restaurants', user.tenantId, 'orders', orderId);
      await updateDoc(docRef, { status: 'DELIVERED' });
      toast.success('Order marked as delivered!');
    } catch (e) {
      console.error(e);
      toast.error('Failed to update status.');
    }
  };

  // Close order and pay bill
  const handleMarkPaid = async () => {
    if (!user?.tenantId || !selectedOrder) return;
    setIsUpdatingBill(true);
    try {
      const docRef = doc(db, 'restaurants', user.tenantId, 'orders', selectedOrder.orderId);
      
      // Calculate active totals with discount
      const subtotal = selectedOrder.subtotal;
      const discount = Math.round(subtotal * (discountPercent / 100));
      const newTax = Math.round((subtotal - discount) * 0.08);
      const newTotal = (subtotal - discount) + newTax;

      await updateDoc(docRef, { 
        paymentStatus: 'paid',
        status: 'DELIVERED', // set delivered on payment close
        subtotal,
        discount,
        tax: newTax,
        total: newTotal
      });

      toast.success(`Table ${selectedOrder.tableNumber} bill closed successfully.`);
      setSelectedOrder(null);
      setDiscountPercent(0);
    } catch (e) {
      console.error(e);
      toast.error('Failed to process payment.');
    } finally {
      setIsUpdatingBill(false);
    }
  };

  // Generate dynamic Tables layout 1 to 8 mapping active orders
  const tablesList = Array.from({ length: 8 }, (_, i) => {
    const tableNum = (i + 1).toString();
    
    // Find active unpaid order for this table
    const activeOrder = orders.find(
      o => o.tableNumber === tableNum && o.status !== 'DELIVERED' && o.status !== 'CANCELLED'
    );

    return {
      number: tableNum,
      occupied: !!activeOrder,
      activeOrder
    };
  });

  // Ready list cards
  const readyOrders = orders.filter(o => o.status === 'READY');

  return (
    <div className="space-y-8 text-left select-none">
      <div>
        <h1 className="text-2xl font-display font-extrabold text-textPearl">Waiter Panel</h1>
        <p className="text-xs text-mutedAsh font-semibold">Monitor table seating and deliver ready dishes.</p>
      </div>

      {/* Tables layout grid map */}
      <div className="space-y-4">
        <h2 className="text-sm font-display font-bold text-textPearl flex items-center space-x-2">
          <LayoutGrid className="w-4 h-4 text-primary" />
          <span>Tables Overview</span>
        </h2>
        
        {isLoading ? (
          <div className="h-32 flex items-center justify-center">
            <LoadingSpinner label="Loading seating mapping..." />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {tablesList.map((table) => (
              <Card 
                key={table.number}
                className={`p-4 border-slate-850 bg-slate-900/40 flex flex-col justify-between h-36 transition-all duration-300 ${
                  table.occupied 
                    ? 'border-primary/25 bg-primary/5 ring-1 ring-primary/10' 
                    : 'border-slate-850 hover:bg-slate-900/60'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-display font-extrabold text-textPearl">Table {table.number}</span>
                    <Badge variant={table.occupied ? 'warning' : 'success'}>
                      {table.occupied ? 'Occupied' : 'Free'}
                    </Badge>
                  </div>
                  
                  {table.occupied && table.activeOrder ? (
                    <div className="mt-2 text-xs space-y-1">
                      <div className="text-slate-400 font-semibold truncate">
                        {table.activeOrder.customerName}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium">
                        Status: <span className="text-primary capitalize">{table.activeOrder.status}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 text-xs text-slate-600">Vacant table ready for check-in</div>
                  )}
                </div>

                {/* Table Footer actions */}
                {table.occupied && table.activeOrder ? (
                  <div className="flex justify-between items-center pt-2 border-t border-slate-850/60">
                    <span className="text-xs font-bold text-slate-200">{formatPrice(table.activeOrder.total)}</span>
                    <button
                      onClick={() => setSelectedOrder(table.activeOrder || null)}
                      className="text-[10px] font-bold text-primary hover:text-primary-hover flex items-center gap-0.5"
                    >
                      <span>Bill</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                ) : null}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Deliveries list column */}
      <div className="space-y-4">
        <h2 className="text-sm font-display font-bold text-textPearl flex items-center space-x-2">
          <Coffee className="w-4 h-4 text-emerald-500" />
          <span>Orders Ready for Delivery</span>
        </h2>

        {isLoading ? (
          <div className="h-24 flex items-center justify-center">
            <LoadingSpinner label="Fetching ready items..." />
          </div>
        ) : readyOrders.length === 0 ? (
          <div className="py-8 text-center border border-dashed border-slate-850 rounded-2xl bg-slate-900/10">
            <CheckCircle className="w-8 h-8 text-slate-700 mx-auto mb-1.5" />
            <p className="text-xs text-slate-450 font-semibold">No ready plates waiting for servers.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {readyOrders.map((order) => (
              <Card 
                key={order.orderId}
                className="p-4 border-slate-850 bg-slate-900/40 flex flex-col justify-between space-y-4 hover:border-slate-800 transition-all"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xs font-display font-extrabold text-textPearl">
                      Order #{order.orderId.split('-')[1] || order.orderId}
                    </h3>
                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider mt-0.5">Table {order.tableNumber}</span>
                  </div>
                  {/* @ts-ignore */}
                  {order.waiterId ? (
                    // @ts-ignore
                    <Badge variant="success">Assigned: {order.waiterId}</Badge>
                  ) : (
                    <Badge variant="danger">Unassigned</Badge>
                  )}
                </div>

                {/* Items preview */}
                <div className="text-xs text-slate-400 space-y-1">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-slate-350">
                      <span>{item.name} x{item.count}</span>
                    </div>
                  ))}
                </div>

                {/* Action layout operations */}
                <div className="pt-3 border-t border-slate-850/65 flex justify-end space-x-2">
                  {/* @ts-ignore */}
                  {!order.waiterId ? (
                    <Button 
                      size="sm" 
                      onClick={() => handleAssignWaiter(order.orderId)}
                      className="px-3 py-1.5 bg-primary hover:bg-primary-hover text-background text-[11px] font-bold rounded-lg flex items-center space-x-1"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Assign to Me</span>
                    </Button>
                  ) : (
                    <Button 
                      size="sm" 
                      onClick={() => handleMarkDelivered(order.orderId)}
                      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-[11px] font-bold rounded-lg flex items-center space-x-1"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Mark Delivered</span>
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Bill summary dialog modal */}
      <Modal
        isOpen={selectedOrder !== null}
        onClose={() => {
          setSelectedOrder(null);
          setDiscountPercent(0);
        }}
        title={`Bill Summary - Table ${selectedOrder?.tableNumber}`}
      >
        {selectedOrder && (
          <div className="space-y-4 text-left">
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Ordered Items</span>
              <div className="text-xs divide-y divide-slate-850">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between py-2 text-slate-300">
                    <span>{item.name} x{item.count}</span>
                    <span>{formatPrice(item.pricePerUnit * item.count)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Discount input form */}
            <div className="pt-2 border-t border-slate-800/40">
              <Input
                label="Apply Discount (%)"
                type="number"
                min="0"
                max="100"
                placeholder="10"
                value={discountPercent || ''}
                onChange={(e) => setDiscountPercent(Number(e.target.value))}
                disabled={isUpdatingBill}
              />
            </div>

            {/* Calculations layout details */}
            <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span>{formatPrice(selectedOrder.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Discount ({discountPercent}%)</span>
                <span>-{formatPrice(Math.round(selectedOrder.subtotal * (discountPercent / 100)))}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Tax (8%)</span>
                <span>{formatPrice(Math.round((selectedOrder.subtotal - Math.round(selectedOrder.subtotal * (discountPercent / 100))) * 0.08))}</span>
              </div>
              <div className="flex justify-between text-textPearl font-semibold text-sm pt-2 border-t border-slate-800/20">
                <span>Grand Total</span>
                <span>
                  {formatPrice(
                    (selectedOrder.subtotal - Math.round(selectedOrder.subtotal * (discountPercent / 100))) +
                    Math.round((selectedOrder.subtotal - Math.round(selectedOrder.subtotal * (discountPercent / 100))) * 0.08)
                  )}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => setSelectedOrder(null)}
                disabled={isUpdatingBill}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 flex items-center justify-center space-x-1.5"
                onClick={handleMarkPaid}
                isLoading={isUpdatingBill}
              >
                <DollarSign className="w-4 h-4" />
                <span>Mark Paid</span>
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
export default WaiterMatrix;
