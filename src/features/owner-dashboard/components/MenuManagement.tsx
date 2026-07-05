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
  updateDoc 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../../config/firebase';
import { useAuth } from '../../../context/AuthContext';
import { IMenuItem } from '../../../types';
import { zodResolver } from '../../../utils/zodResolver';
import { formatPrice } from '../../../utils/format';

// UI Kit Primitives
import Button from '../../../components/ui/Button/Button';
import Input from '../../../components/ui/Input/Input';
import TextArea from '../../../components/ui/TextArea/TextArea';
import Select from '../../../components/ui/Select/Select';
import Switch from '../../../components/ui/Switch/Switch';
import Card from '../../../components/ui/Card/Card';
import Modal from '../../../components/ui/Modal/Modal';
import Dialog from '../../../components/ui/Dialog/Dialog';
import Table from '../../../components/ui/Table/Table';
import Badge from '../../../components/ui/Badge/Badge';
import SearchBar from '../../../components/ui/SearchBar/SearchBar';
import LoadingSpinner from '../../../components/ui/LoadingSpinner/LoadingSpinner';

// Hot Toast for feedback alerts
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Search, Filter } from 'lucide-react';

// Form validation schema
const menuItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
  price: z.preprocess(
    (val) => Number(val), 
    z.number().min(1, 'Price must be greater than zero')
  ),
  discountPrice: z.preprocess(
    (val) => (val === '' || val === undefined ? undefined : Number(val)),
    z.number().min(0).optional()
  ),
  veg: z.boolean().default(false),
  available: z.boolean().default(true),
  preparationTime: z.preprocess(
    (val) => Number(val),
    z.number().min(1, 'Prep time must be at least 1 minute')
  ),
  tagsInput: z.string().optional()
});

type TMenuItemForm = z.infer<typeof menuItemSchema>;

export const MenuManagement: React.FC = () => {
  const { user } = useAuth();
  
  const [menuItems, setMenuItems] = useState<IMenuItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<IMenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Modal and Dialog Trigger States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<IMenuItem | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  
  // Image Upload States
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'Starters', label: 'Starters' },
    { value: 'Mains', label: 'Mains' },
    { value: 'Desserts', label: 'Desserts' },
    { value: 'Beverages', label: 'Beverages' }
  ];

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm<TMenuItemForm>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      veg: false,
      available: true,
      preparationTime: 10,
      tagsInput: ''
    }
  });

  const vegValue = watch('veg');
  const availableValue = watch('available');

  // Fetch Menu from restaurants/{restaurantId}/menu
  const fetchMenu = async () => {
    if (!user?.tenantId) return;
    setIsLoading(true);
    try {
      const colRef = collection(db, 'restaurants', user.tenantId, 'menu');
      const querySnap = await getDocs(query(colRef));
      const items: IMenuItem[] = [];
      querySnap.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as IMenuItem);
      });
      setMenuItems(items);
      setFilteredItems(items);
    } catch (e: any) {
      console.error('Failed to load menu', e);
      toast.error('Failed to retrieve menu list.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, [user]);

  // Apply filters on query or category updates
  useEffect(() => {
    let filtered = [...menuItems];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
      );
    }
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((item) => item.category === selectedCategory);
    }
    setFilteredItems(filtered);
  }, [searchQuery, selectedCategory, menuItems]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const openAddModal = () => {
    setEditingItem(null);
    setImageFile(null);
    setImagePreview('');
    reset({
      name: '',
      description: '',
      category: 'Starters',
      price: undefined,
      discountPrice: undefined,
      veg: false,
      available: true,
      preparationTime: 10,
      tagsInput: ''
    });
    setIsFormOpen(true);
  };

  const openEditModal = (item: IMenuItem) => {
    setEditingItem(item);
    setImageFile(null);
    setImagePreview(item.imageUrl || '');
    reset({
      name: item.name,
      description: item.description,
      category: item.category,
      price: item.price / 100, // Cents to dollar display
      discountPrice: item.discountPrice ? item.discountPrice / 100 : undefined,
      veg: item.veg,
      available: item.available,
      preparationTime: item.preparationTime,
      tagsInput: item.tags.join(', ')
    });
    setIsFormOpen(true);
  };

  // Create or Update operational menu item
  const onSubmitForm = async (data: TMenuItemForm) => {
    if (!user?.tenantId) return;
    setIsSubmitting(true);
    try {
      const itemId = editingItem ? editingItem.id : Math.random().toString(36).substring(2, 9);
      let uploadedUrl = editingItem ? editingItem.imageUrl : '';

      // Upload file to storage if a new one is selected
      if (imageFile) {
        const storageRef = ref(storage, `restaurants/${user.tenantId}/menu/${itemId}`);
        const uploadResult = await uploadBytes(storageRef, imageFile);
        uploadedUrl = await getDownloadURL(uploadResult.ref);
      }

      const docRef = doc(db, 'restaurants', user.tenantId, 'menu', itemId);
      
      const tags = data.tagsInput
        ? data.tagsInput.split(',').map((t) => t.trim()).filter((t) => t !== '')
        : [];

      const menuItemData: Omit<IMenuItem, 'id'> = {
        name: data.name,
        description: data.description,
        category: data.category,
        price: Math.round(data.price * 100), // Dollar input to cents
        discountPrice: data.discountPrice ? Math.round(data.discountPrice * 100) : undefined,
        imageUrl: uploadedUrl,
        veg: data.veg,
        available: data.available,
        preparationTime: data.preparationTime,
        tags,
        createdAt: editingItem ? editingItem.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(docRef, menuItemData);
      
      toast.success(editingItem ? 'Item updated successfully!' : 'Item added successfully!', {
        id: 'menu-toast-success'
      });
      setIsFormOpen(false);
      fetchMenu();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Operation failed.', { id: 'menu-toast-error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle availability state directly
  const handleToggleAvailable = async (item: IMenuItem) => {
    if (!user?.tenantId) return;
    try {
      const docRef = doc(db, 'restaurants', user.tenantId, 'menu', item.id);
      const nextStatus = !item.available;
      await updateDoc(docRef, { available: nextStatus });
      toast.success(`Status updated for ${item.name}`, { id: 'avail-success' });
      setMenuItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, available: nextStatus } : i))
      );
    } catch (e) {
      console.error(e);
      toast.error('Failed to modify availability.');
    }
  };

  const triggerDeleteConfirm = (id: string) => {
    setDeletingItemId(id);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!user?.tenantId || !deletingItemId) return;
    try {
      const docRef = doc(db, 'restaurants', user.tenantId, 'menu', deletingItemId);
      await deleteDoc(docRef);
      toast.success('Menu item deleted successfully.');
      fetchMenu();
    } catch (e) {
      console.error(e);
      toast.error('Delete failed.');
    } finally {
      setIsDeleteOpen(false);
      setDeletingItemId(null);
    }
  };

  // Table primitive Columns definitions
  const columns = [
    {
      header: 'Image',
      accessor: (row: IMenuItem) => (
        <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-800 bg-slate-900">
          {row.imageUrl ? (
            <img src={row.imageUrl} alt={row.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-650 text-[10px]">No img</div>
          )}
        </div>
      )
    },
    {
      header: 'Name',
      accessor: (row: IMenuItem) => (
        <div>
          <span className="font-semibold text-textPearl text-sm">{row.name}</span>
          <div className="flex space-x-1 mt-0.5">
            {row.veg ? <Badge variant="success">Veg</Badge> : <Badge variant="danger">Non-Veg</Badge>}
            <Badge variant="muted">{row.category}</Badge>
          </div>
        </div>
      )
    },
    {
      header: 'Price',
      accessor: (row: IMenuItem) => (
        <div>
          <span className="font-semibold text-slate-200">{formatPrice(row.price)}</span>
          {row.discountPrice ? (
            <div className="text-[10px] text-primary line-through">{formatPrice(row.discountPrice)}</div>
          ) : null}
        </div>
      )
    },
    {
      header: 'Prep Time',
      accessor: (row: IMenuItem) => <span className="text-slate-450">{row.preparationTime} mins</span>
    },
    {
      header: 'Available',
      accessor: (row: IMenuItem) => (
        <Switch 
          checked={row.available} 
          onChange={() => handleToggleAvailable(row)} 
        />
      )
    },
    {
      header: 'Actions',
      accessor: (row: IMenuItem) => (
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

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-extrabold text-textPearl text-left">Menu Manager</h1>
          <p className="text-xs text-mutedAsh text-left">Manage food categories, pricing, descriptions, and stock tags.</p>
        </div>
        <Button onClick={openAddModal} className="flex items-center space-x-1.5 self-start">
          <Plus className="w-4 h-4" />
          <span>Add Menu Item</span>
        </Button>
      </div>

      {/* Query Filters */}
      <Card className="p-4 border-slate-850 bg-slate-900/35">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <SearchBar 
              placeholder="Search items by name or category..." 
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

      {/* Database data output */}
      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <LoadingSpinner label="Querying menu catalog..." />
        </div>
      ) : (
        <Card className="p-0 overflow-hidden border-slate-850">
          <Table 
            columns={columns} 
            data={filteredItems}
            keyExtractor={(row) => row.id} 
          />
        </Card>
      )}

      {/* Form Modal Add/Edit */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
        className="max-w-lg"
      >
        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4 text-left">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Item Name"
              type="text"
              placeholder="Cheeseburger"
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

          <TextArea
            label="Description"
            placeholder="Grilled beef patty with melted cheddar cheese, fresh lettuce, tomatoes, and home dressing."
            error={errors.description?.message}
            disabled={isSubmitting}
            {...register('description')}
          />

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Price ($)"
              type="number"
              step="0.01"
              placeholder="12.50"
              error={errors.price?.message}
              disabled={isSubmitting}
              {...register('price')}
            />
            <Input
              label="Discount Price ($)"
              type="number"
              step="0.01"
              placeholder="10.00"
              error={errors.discountPrice?.message}
              disabled={isSubmitting}
              {...register('discountPrice')}
            />
            <Input
              label="Prep Time (mins)"
              type="number"
              placeholder="15"
              error={errors.preparationTime?.message}
              disabled={isSubmitting}
              {...register('preparationTime')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 py-2 border-y border-slate-800/40">
            <Switch
              label="Vegetarian"
              checked={vegValue}
              onChange={(val) => setValue('veg', val)}
            />
            <Switch
              label="Available / In Stock"
              checked={availableValue}
              onChange={(val) => setValue('available', val)}
            />
          </div>

          <Input
            label="Tags (comma-separated)"
            type="text"
            placeholder="Specialty, Bestseller, Gluten-Free"
            error={errors.tagsInput?.message}
            disabled={isSubmitting}
            {...register('tagsInput')}
          />

          {/* Image Upload Input */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-400 select-none">Dish Image</span>
            <div className="flex items-center space-x-4">
              <input
                id="file-upload"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                disabled={isSubmitting}
                className="hidden"
              />
              <label 
                htmlFor="file-upload"
                className="px-4 py-2 border border-slate-800 bg-slate-900 text-slate-300 rounded-xl text-xs font-bold hover:border-primary hover:text-primary transition-all cursor-pointer select-none"
              >
                Choose Photo
              </label>

              {imagePreview ? (
                <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-800">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              ) : null}
            </div>
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
              {editingItem ? 'Save Changes' : 'Add Item'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Dialog delete */}
      <Dialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Menu Item"
        message="Are you sure you want to delete this menu item? This action will permanently remove the item from the catalog and customer browser."
        confirmLabel="Delete"
        isDangerous={true}
      />
    </div>
  );
};
export default MenuManagement;
