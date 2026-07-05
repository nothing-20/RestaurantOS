import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  query, 
  getDoc,
  updateDoc 
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../context/AuthContext';

import { zodResolver } from '../../../utils/zodResolver';

// UI Kit components
import Button from '../../../components/ui/Button/Button';
import Input from '../../../components/ui/Input/Input';
import Select from '../../../components/ui/Select/Select';
import Table from '../../../components/ui/Table/Table';
import Card from '../../../components/ui/Card/Card';
import Badge from '../../../components/ui/Badge/Badge';
import Modal from '../../../components/ui/Modal/Modal';
import Dialog from '../../../components/ui/Dialog/Dialog';
import LoadingSpinner from '../../../components/ui/LoadingSpinner/LoadingSpinner';
import Tabs from '../../../components/ui/Tabs/Tabs';
import SearchBar from '../../../components/ui/SearchBar/SearchBar';

// Hot Toast notifications
import toast from 'react-hot-toast';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  Package, 
  Settings, 
  AlertTriangle 
} from 'lucide-react';
import OwnerSettings from './OwnerSettings';

// Form validation schemas
const inventorySchema = z.object({
  name: z.string().min(1, 'Item name is required'),
  category: z.string().min(1, 'Category is required'),
  currentQuantity: z.preprocess(
    (val) => Number(val),
    z.number().min(0, 'Current quantity must be non-negative')
  ),
  minimumQuantity: z.preprocess(
    (val) => Number(val),
    z.number().min(0, 'Minimum quantity must be non-negative')
  ),
  supplier: z.string().min(1, 'Supplier is required'),
  unit: z.string().min(1, 'Unit is required'),
  cost: z.preprocess(
    (val) => Number(val),
    z.number().min(0, 'Cost must be non-negative')
  ),
  purchaseDate: z.string().min(1, 'Purchase date is required'),
  expiryDate: z.string().min(1, 'Expiry date is required')
});

type TInventoryForm = z.infer<typeof inventorySchema>;

interface IInventoryItem {
  id: string;
  name: string;
  category: string;
  currentQuantity: number;
  minimumQuantity: number;
  supplier: string;
  unit: string;
  cost: number;
  purchaseDate: string;
  expiryDate: string;
}

export const OwnerInventoryManager: React.FC = () => {
  const { user } = useAuth();

  
  const [activeTab, setActiveTab] = useState('inventory');
  
  // Real-time Inventory states
  const [inventory, setInventory] = useState<IInventoryItem[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<IInventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Modal and Dialog Trigger states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<IInventoryItem | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);



  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'Vegetables', label: 'Vegetables' },
    { value: 'Meat', label: 'Meat & Seafood' },
    { value: 'Dairy', label: 'Dairy Items' },
    { value: 'Dry Goods', label: 'Dry Goods & Spices' },
    { value: 'Beverages', label: 'Beverages stock' }
  ];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<TInventoryForm>({
    resolver: zodResolver(inventorySchema),
    defaultValues: {
      unit: 'kg'
    }
  });

  // Fetch Inventory from restaurants/{restaurantId}/inventory
  const fetchInventory = async () => {
    if (!user?.tenantId) return;
    setIsLoading(true);
    try {
      const colRef = collection(db, 'restaurants', user.tenantId, 'inventory');
      const querySnap = await getDocs(query(colRef));
      const list: IInventoryItem[] = [];
      querySnap.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as IInventoryItem);
      });
      setInventory(list);
      setFilteredInventory(list);
    } catch (e: any) {
      console.error(e);
      toast.error('Failed to load inventory.');
    } finally {
      setIsLoading(false);
    }
  };



  useEffect(() => {
    fetchInventory();
  }, [user]);

  // Filters logic
  useEffect(() => {
    let filtered = [...inventory];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(q) || 
        item.supplier.toLowerCase().includes(q)
      );
    }
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }
    setFilteredInventory(filtered);
  }, [searchQuery, selectedCategory, inventory]);

  const openAddModal = () => {
    setEditingItem(null);
    reset({
      name: '',
      category: 'Vegetables',
      currentQuantity: undefined,
      minimumQuantity: undefined,
      supplier: '',
      unit: 'kg',
      cost: undefined,
      purchaseDate: new Date().toISOString().split('T')[0],
      expiryDate: ''
    });
    setIsFormOpen(true);
  };

  const openEditModal = (item: IInventoryItem) => {
    setEditingItem(item);
    reset({
      name: item.name,
      category: item.category,
      currentQuantity: item.currentQuantity,
      minimumQuantity: item.minimumQuantity,
      supplier: item.supplier,
      unit: item.unit,
      cost: item.cost,
      purchaseDate: item.purchaseDate,
      expiryDate: item.expiryDate
    });
    setIsFormOpen(true);
  };

  // Submit Operations
  const onSubmitForm = async (data: TInventoryForm) => {
    if (!user?.tenantId) return;
    setIsSubmitting(true);
    try {
      const itemId = editingItem ? editingItem.id : Math.random().toString(36).substring(2, 9);
      const docRef = doc(db, 'restaurants', user.tenantId, 'inventory', itemId);

      await setDoc(docRef, {
        name: data.name,
        category: data.category,
        currentQuantity: data.currentQuantity,
        minimumQuantity: data.minimumQuantity,
        supplier: data.supplier,
        unit: data.unit,
        cost: data.cost,
        purchaseDate: data.purchaseDate,
        expiryDate: data.expiryDate,
        updatedAt: new Date().toISOString()
      });

      toast.success(editingItem ? 'Item updated successfully!' : 'Item registered successfully!');
      setIsFormOpen(false);
      fetchInventory();
    } catch (e: any) {
      console.error(e);
      toast.error('Operation failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerDeleteConfirm = (id: string) => {
    setDeletingItemId(id);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!user?.tenantId || !deletingItemId) return;
    try {
      const docRef = doc(db, 'restaurants', user.tenantId, 'inventory', deletingItemId);
      await deleteDoc(docRef);
      toast.success('Inventory item deleted.');
      fetchInventory();
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete item.');
    } finally {
      setIsDeleteOpen(false);
      setDeletingItemId(null);
    }
  };



  // Helper checks
  const isExpired = (expiryStr: string) => {
    return new Date(expiryStr).getTime() < new Date().getTime();
  };

  // Columns definition
  const columns = [
    {
      header: 'Item Name',
      accessor: (row: IInventoryItem) => (
        <div>
          <span className="font-semibold text-textPearl text-sm">{row.name}</span>
          <div className="flex space-x-1.5 mt-0.5">
            <Badge variant="muted">{row.category}</Badge>
            {row.currentQuantity <= row.minimumQuantity ? (
              <Badge variant="danger">Low Stock</Badge>
            ) : null}
            {isExpired(row.expiryDate) ? (
              <Badge variant="danger">Expired</Badge>
            ) : null}
          </div>
        </div>
      )
    },
    {
      header: 'Quantity',
      accessor: (row: IInventoryItem) => (
        <span className="font-bold text-slate-350">{row.currentQuantity} {row.unit}</span>
      )
    },
    {
      header: 'Supplier',
      accessor: (row: IInventoryItem) => <span className="text-slate-400 font-semibold">{row.supplier}</span>
    },
    {
      header: 'Expiry Date',
      accessor: (row: IInventoryItem) => (
        <span className={isExpired(row.expiryDate) ? 'text-red-500 font-bold' : 'text-slate-450'}>
          {new Date(row.expiryDate).toLocaleDateString()}
        </span>
      )
    },
    {
      header: 'Actions',
      accessor: (row: IInventoryItem) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openEditModal(row)}
            className="p-1 text-slate-400 hover:text-primary hover:bg-slate-800/50"
            title="Edit Item"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => triggerDeleteConfirm(row.id)}
            className="p-1 text-slate-450 hover:text-red-500 hover:bg-red-500/10"
            title="Delete Item"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      )
    }
  ];

  const tabItems = [
    { id: 'inventory', label: 'Inventory list', icon: Package },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="space-y-6 text-left select-none">
      {/* Visual Navigation switcher */}
      <Tabs 
        tabs={tabItems} 
        activeTabId={activeTab} 
        onTabChange={setActiveTab} 
      />

      {activeTab === 'inventory' ? (
        <div className="space-y-6">
          {/* Inventory header controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-display font-extrabold text-textPearl">Ingredient Stock</h1>
              <p className="text-xs text-mutedAsh font-semibold">Monitor shelf levels, expiry alerts, and suppliers listings.</p>
            </div>
            <Button onClick={openAddModal} className="flex items-center space-x-1.5 self-start">
              <Plus className="w-4 h-4" />
              <span>Add Stock Item</span>
            </Button>
          </div>

          {/* Filters */}
          <Card className="p-4 border-slate-850 bg-slate-900/35">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <SearchBar 
                  placeholder="Search inventory items..." 
                  value={searchQuery}
                  onSearchChange={setSearchQuery}
                />
              </div>
              <div className="w-full md:w-56">
                <Select 
                  options={categories}
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                />
              </div>
            </div>
          </Card>

          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <LoadingSpinner label="Loading inventory registry..." />
            </div>
          ) : filteredInventory.length === 0 ? (
            <Card className="p-8 text-center border border-dashed border-slate-850 rounded-2xl bg-slate-900/10">
              <AlertTriangle className="w-10 h-10 text-slate-700 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-450">No stock records found.</p>
            </Card>
          ) : (
            <Card className="p-0 overflow-hidden border-slate-850">
              <Table 
                columns={columns} 
                data={filteredInventory} 
                keyExtractor={(row) => row.id} 
              />
            </Card>
          )}

          {/* CRUD Form Modal */}
          <Modal
            isOpen={isFormOpen}
            onClose={() => setIsFormOpen(false)}
            title={editingItem ? 'Edit Inventory Details' : 'Add Inventory Item'}
          >
            <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4 text-left">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Item Name"
                  type="text"
                  placeholder="E.g. Fresh Tomatoes"
                  error={errors.name?.message}
                  disabled={isSubmitting}
                  {...register('name')}
                />
                <Select
                  label="Category"
                  options={categories.filter(c => c.value !== 'all')}
                  error={errors.category?.message}
                  disabled={isSubmitting}
                  {...register('category')}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Input
                  label="Current Stock"
                  type="number"
                  placeholder="15"
                  error={errors.currentQuantity?.message}
                  disabled={isSubmitting}
                  {...register('currentQuantity')}
                />
                <Input
                  label="Safety Min Stock"
                  type="number"
                  placeholder="5"
                  error={errors.minimumQuantity?.message}
                  disabled={isSubmitting}
                  {...register('minimumQuantity')}
                />
                <Input
                  label="Measurement Unit"
                  type="text"
                  placeholder="kg, liters, pieces"
                  error={errors.unit?.message}
                  disabled={isSubmitting}
                  {...register('unit')}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Supplier Name"
                  type="text"
                  placeholder="Gourmet Farm Co."
                  error={errors.supplier?.message}
                  disabled={isSubmitting}
                  {...register('supplier')}
                />
                <Input
                  label="Cost per Unit ($)"
                  type="number"
                  step="0.01"
                  placeholder="1.25"
                  error={errors.cost?.message}
                  disabled={isSubmitting}
                  {...register('cost')}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Purchase Date"
                  type="date"
                  error={errors.purchaseDate?.message}
                  disabled={isSubmitting}
                  {...register('purchaseDate')}
                />
                <Input
                  label="Expiration Date"
                  type="date"
                  error={errors.expiryDate?.message}
                  disabled={isSubmitting}
                  {...register('expiryDate')}
                />
              </div>

              <div className="flex items-center space-x-3 pt-4 border-t border-slate-800/40 mt-4">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setIsFormOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  isLoading={isSubmitting}
                >
                  {editingItem ? 'Save Changes' : 'Register Stock'}
                </Button>
              </div>
            </form>
          </Modal>

          {/* Delete Dialog */}
          <Dialog
            isOpen={isDeleteOpen}
            onClose={() => setIsDeleteOpen(false)}
            onConfirm={handleConfirmDelete}
            title="Delete Stock Document"
            message="Are you sure you want to delete this stock item? This will clear its registry levels history."
            confirmLabel="Delete"
            isDangerous={true}
          />
        </div>
      ) : (
        /* Settings Tab pane */
        <OwnerSettings />
      )}
    </div>
  );
};
export default OwnerInventoryManager;
