import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc,
  onSnapshot,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../../config/firebase';
import { useAuth } from '../../../context/AuthContext';
import { IMenuItem, IMenuCategory } from '../../../types';
import { zodResolver } from '../../../utils/zodResolver';
import { formatPrice } from '../../../utils/format';
import { 
  getMenuCategoryPath, 
  getMenuItemPath
} from '../../../firebase/collections';

// UI Kit Primitives
import Button from '../../../components/ui/Button/Button';
import Input from '../../../components/ui/Input/Input';
import TextArea from '../../../components/ui/TextArea/TextArea';
import Select from '../../../components/ui/Select/Select';
import Switch from '../../../components/ui/Switch/Switch';
import Card from '../../../components/ui/Card/Card';
import Modal from '../../../components/ui/Modal/Modal';
import Dialog from '../../../components/ui/Dialog/Dialog';
import Badge from '../../../components/ui/Badge/Badge';
import SearchBar from '../../../components/ui/SearchBar/SearchBar';
import LoadingSpinner from '../../../components/ui/LoadingSpinner/LoadingSpinner';

// Hot Toast for feedback alerts
import toast from 'react-hot-toast';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  Filter, 
  Copy, 
  Archive, 
  ArrowUp, 
  ArrowDown, 
  Eye, 
  DollarSign, 
  Check, 
  Layers, 
  Grid, 
  Sparkles, 
  Flame, 
  Leaf, 
  ShoppingBag,
  TrendingUp
} from 'lucide-react';

// Form validation schemas
const categorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  image: z.string().url('Must be a valid URL').or(z.literal('')),
  displayOrder: z.preprocess((val) => Number(val), z.number().min(0)),
  isActive: z.boolean().default(true)
});

const menuItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  categoryId: z.string().min(1, 'Category is required'),
  price: z.preprocess(
    (val) => Number(val), 
    z.number().min(0.01, 'Price must be greater than zero')
  ),
  discountPrice: z.preprocess(
    (val) => (val === '' || val === undefined ? undefined : Number(val)),
    z.number().min(0).optional()
  ),
  isVeg: z.boolean().default(false),
  isAvailable: z.boolean().default(true),
  isBestSeller: z.boolean().default(false),
  isRecommended: z.boolean().default(false),
  spiceLevel: z.string().default('none'),
  preparationTime: z.preprocess(
    (val) => Number(val),
    z.number().min(1, 'Prep time must be at least 1 minute')
  ),
  image: z.string().url('Must be a valid URL').or(z.literal(''))
});

type TCategoryForm = z.infer<typeof categorySchema>;
type TMenuItemForm = z.infer<typeof menuItemSchema>;

const FALLBACK_CATEGORY_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=60';
const FALLBACK_ITEM_IMAGE = 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=400&auto=format&fit=crop&q=60';

export const MenuManagement: React.FC = () => {
  const { user } = useAuth();
  
  const [categories, setCategories] = useState<IMenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<IMenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Tab State
  const [activeTab, setActiveTab] = useState<'categories' | 'items' | 'availability' | 'pricing' | 'preview'>('categories');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterVeg, setFilterVeg] = useState('all'); // 'all' | 'veg' | 'non-veg'
  const [filterAvailable, setFilterAvailable] = useState('all'); // 'all' | 'available' | 'out-of-stock'
  const [sortBy, setSortBy] = useState('name-asc'); // 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'newest'

  // Modal / Dialog States
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isDeleteCategoryOpen, setIsDeleteCategoryOpen] = useState(false);
  const [isDeleteItemOpen, setIsDeleteItemOpen] = useState(false);

  // Editing / Action targets
  const [editingCategory, setEditingCategory] = useState<IMenuCategory | null>(null);
  const [editingItem, setEditingItem] = useState<IMenuItem | null>(null);
  const [targetCategoryId, setTargetCategoryId] = useState<string | null>(null);
  const [targetItemId, setTargetItemId] = useState<string | null>(null);

  // Image Upload / Preview States
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // React Hook Forms
  const {
    register: registerCategory,
    handleSubmit: handleSubmitCategory,
    reset: resetCategory,
    formState: { errors: categoryErrors }
  } = useForm<TCategoryForm>({
    resolver: zodResolver(categorySchema),
    defaultValues: { isActive: true, displayOrder: 0, image: '' }
  });

  const {
    register: registerItem,
    handleSubmit: handleSubmitItem,
    reset: resetItem,
    setValue: setValueItem,
    watch: watchItem,
    formState: { errors: itemErrors }
  } = useForm<TMenuItemForm>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      isVeg: false,
      isAvailable: true,
      isBestSeller: false,
      isRecommended: false,
      spiceLevel: 'none',
      preparationTime: 10,
      image: ''
    }
  });

  const watchIsVeg = watchItem('isVeg');
  const watchIsAvailable = watchItem('isAvailable');
  const watchIsBestSeller = watchItem('isBestSeller');
  const watchIsRecommended = watchItem('isRecommended');

  // Real-time Firestore Listeners
  useEffect(() => {
    if (!user?.tenantId) return;

    setIsLoading(true);

    const categoriesColRef = collection(db, getMenuCategoryPath(user.tenantId));
    const unsubCategories = onSnapshot(categoriesColRef, 
      (snap) => {
        const catList: IMenuCategory[] = [];
        snap.forEach((doc) => {
          catList.push({ id: doc.id, ...doc.data() } as IMenuCategory);
        });
        setCategories(catList.sort((a, b) => a.displayOrder - b.displayOrder));
        setIsLoading(false);
      },
      (err) => {
        console.error('Categories read failed', err);
        toast.error('Failed to load menu categories.');
      }
    );

    const itemsColRef = collection(db, getMenuItemPath(user.tenantId));
    const unsubItems = onSnapshot(itemsColRef,
      (snap) => {
        const itemList: IMenuItem[] = [];
        snap.forEach((doc) => {
          itemList.push({ id: doc.id, ...doc.data() } as IMenuItem);
        });
        setMenuItems(itemList);
      },
      (err) => {
        console.error('Items read failed', err);
        toast.error('Failed to load menu items.');
      }
    );

    return () => {
      unsubCategories();
      unsubItems();
    };
  }, [user?.tenantId]);

  // Image handling
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // ----------------------------------------------------
  // CATEGORY OPERATIONS
  // ----------------------------------------------------
  const openAddCategory = () => {
    setEditingCategory(null);
    setImageFile(null);
    setImagePreview('');
    resetCategory({
      name: '',
      description: '',
      image: '',
      displayOrder: categories.length + 1,
      isActive: true
    });
    setIsCategoryModalOpen(true);
  };

  const openEditCategory = (cat: IMenuCategory) => {
    setEditingCategory(cat);
    setImageFile(null);
    setImagePreview(cat.image || '');
    resetCategory({
      name: cat.name,
      description: cat.description,
      image: cat.image || '',
      displayOrder: cat.displayOrder,
      isActive: cat.isActive
    });
    setIsCategoryModalOpen(true);
  };

  const onSubmitCategory = async (data: TCategoryForm) => {
    if (!user?.tenantId) return;

    // Check duplicate name
    const isDuplicate = categories.some(
      (c) => c.name.toLowerCase() === data.name.trim().toLowerCase() && c.id !== editingCategory?.id
    );
    if (isDuplicate) {
      toast.error('A category with this name already exists.');
      return;
    }

    setIsSubmitting(true);
    try {
      const catId = editingCategory ? editingCategory.id : `CAT-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      let imageUrl = data.image || FALLBACK_CATEGORY_IMAGE;

      if (imageFile) {
        const storageRef = ref(storage, `restaurants/${user.tenantId}/categories/${catId}`);
        const uploadResult = await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(uploadResult.ref);
      }

      const docRef = doc(db, getMenuCategoryPath(user.tenantId), catId);
      const categoryData: Omit<IMenuCategory, 'id'> = {
        name: data.name.trim(),
        description: data.description.trim(),
        displayOrder: data.displayOrder,
        isActive: data.isActive,
        image: imageUrl
      };

      await setDoc(docRef, categoryData);
      toast.success(editingCategory ? 'Category updated!' : 'Category created!');
      setIsCategoryModalOpen(false);
    } catch (e: any) {
      console.error(e);
      toast.error('Failed to save category.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleCategoryActive = async (cat: IMenuCategory) => {
    if (!user?.tenantId) return;
    try {
      const docRef = doc(db, getMenuCategoryPath(user.tenantId), cat.id);
      await updateDoc(docRef, { isActive: !cat.isActive });
      toast.success(`${cat.name} status updated.`);
    } catch (e) {
      console.error(e);
      toast.error('Failed to toggle status.');
    }
  };

  const reorderCategory = async (cat: IMenuCategory, direction: 'up' | 'down') => {
    if (!user?.tenantId) return;
    const currentIndex = categories.findIndex((c) => c.id === cat.id);
    if (direction === 'up' && currentIndex === 0) return;
    if (direction === 'down' && currentIndex === categories.length - 1) return;

    const swapWith = direction === 'up' ? categories[currentIndex - 1] : categories[currentIndex + 1];

    try {
      const refCurrent = doc(db, getMenuCategoryPath(user.tenantId), cat.id);
      const refSwap = doc(db, getMenuCategoryPath(user.tenantId), swapWith.id);

      await updateDoc(refCurrent, { displayOrder: swapWith.displayOrder });
      await updateDoc(refSwap, { displayOrder: cat.displayOrder });
    } catch (e) {
      console.error(e);
      toast.error('Reordering failed.');
    }
  };

  const triggerDeleteCategory = (id: string) => {
    setTargetCategoryId(id);
    setIsDeleteCategoryOpen(true);
  };

  const confirmDeleteCategory = async () => {
    if (!user?.tenantId || !targetCategoryId) return;
    try {
      const docRef = doc(db, getMenuCategoryPath(user.tenantId), targetCategoryId);
      await deleteDoc(docRef);
      toast.success('Category deleted successfully.');
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete category.');
    } finally {
      setIsDeleteCategoryOpen(false);
      setTargetCategoryId(null);
    }
  };

  // ----------------------------------------------------
  // MENU ITEM OPERATIONS
  // ----------------------------------------------------
  const openAddItem = () => {
    setEditingItem(null);
    setImageFile(null);
    setImagePreview('');
    resetItem({
      name: '',
      description: '',
      categoryId: categories[0]?.id || '',
      price: undefined,
      discountPrice: undefined,
      isVeg: false,
      isAvailable: true,
      isBestSeller: false,
      isRecommended: false,
      spiceLevel: 'none',
      preparationTime: 10,
      image: ''
    });
    setIsItemModalOpen(true);
  };

  const openEditItem = (item: IMenuItem) => {
    setEditingItem(item);
    setImageFile(null);
    setImagePreview(item.image || '');
    resetItem({
      name: item.name,
      description: item.description,
      categoryId: item.categoryId,
      price: item.price / 100,
      discountPrice: item.discountPrice ? item.discountPrice / 100 : undefined,
      isVeg: item.isVeg,
      isAvailable: item.isAvailable,
      isBestSeller: item.isBestSeller,
      isRecommended: item.isRecommended,
      spiceLevel: item.spiceLevel || 'none',
      preparationTime: item.preparationTime,
      image: item.image || ''
    });
    setIsItemModalOpen(true);
  };

  const onSubmitItem = async (data: TMenuItemForm) => {
    if (!user?.tenantId) return;

    // Check duplicate name within the same category
    const isDuplicate = menuItems.some(
      (i) => i.name.toLowerCase() === data.name.trim().toLowerCase() && 
             i.categoryId === data.categoryId && 
             i.id !== editingItem?.id
    );
    if (isDuplicate) {
      toast.error('An item with this name already exists in this category.');
      return;
    }

    if (data.discountPrice && data.discountPrice >= data.price) {
      toast.error('Discount price must be less than regular price.');
      return;
    }

    setIsSubmitting(true);
    try {
      const itemId = editingItem ? editingItem.id : `ITEM-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      let imageUrl = data.image || FALLBACK_ITEM_IMAGE;

      if (imageFile) {
        const storageRef = ref(storage, `restaurants/${user.tenantId}/items/${itemId}`);
        const uploadResult = await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(uploadResult.ref);
      }

      const docRef = doc(db, getMenuItemPath(user.tenantId), itemId);
      
      const catName = categories.find((c) => c.id === data.categoryId)?.name || '';

      const itemData: Omit<IMenuItem, 'id'> = {
        name: data.name.trim(),
        description: data.description.trim(),
        categoryId: data.categoryId,
        category: catName,
        price: Math.round(data.price * 100),
        discountPrice: data.discountPrice ? Math.round(data.discountPrice * 100) : undefined,
        image: imageUrl,
        imageUrl: imageUrl,
        preparationTime: data.preparationTime,
        isVeg: data.isVeg,
        veg: data.isVeg,
        isAvailable: data.isAvailable,
        available: data.isAvailable,
        isBestSeller: data.isBestSeller,
        isRecommended: data.isRecommended,
        spiceLevel: data.spiceLevel,
        tags: [data.isVeg ? 'Veg' : 'Non-Veg'],
        createdAt: editingItem ? editingItem.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(docRef, itemData);
      toast.success(editingItem ? 'Item updated!' : 'Item added!');
      setIsItemModalOpen(false);
    } catch (e: any) {
      console.error(e);
      toast.error('Failed to save menu item.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const duplicateItem = async (item: IMenuItem) => {
    if (!user?.tenantId) return;
    try {
      const newItemId = `ITEM-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      const docRef = doc(db, getMenuItemPath(user.tenantId), newItemId);
      
      const duplicateData: Omit<IMenuItem, 'id'> = {
        ...item,
        name: `${item.name} - Copy`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(docRef, duplicateData);
      toast.success(`Duplicated: ${item.name}`);
    } catch (e) {
      console.error(e);
      toast.error('Duplication failed.');
    }
  };

  const toggleItemAvailable = async (item: IMenuItem) => {
    if (!user?.tenantId) return;
    try {
      const docRef = doc(db, getMenuItemPath(user.tenantId), item.id);
      await updateDoc(docRef, { 
        isAvailable: !item.isAvailable,
        available: !item.isAvailable
      });
      toast.success(`${item.name} status updated.`);
    } catch (e) {
      console.error(e);
      toast.error('Failed to modify availability.');
    }
  };

  const toggleItemBestSeller = async (item: IMenuItem) => {
    if (!user?.tenantId) return;
    try {
      const docRef = doc(db, getMenuItemPath(user.tenantId), item.id);
      await updateDoc(docRef, { isBestSeller: !item.isBestSeller });
      toast.success(`${item.name} bestseller status updated.`);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleItemRecommended = async (item: IMenuItem) => {
    if (!user?.tenantId) return;
    try {
      const docRef = doc(db, getMenuItemPath(user.tenantId), item.id);
      await updateDoc(docRef, { isRecommended: !item.isRecommended });
      toast.success(`${item.name} recommendation updated.`);
    } catch (e) {
      console.error(e);
    }
  };

  const triggerDeleteItem = (id: string) => {
    setTargetItemId(id);
    setIsDeleteItemOpen(true);
  };

  const confirmDeleteItem = async () => {
    if (!user?.tenantId || !targetItemId) return;
    try {
      const docRef = doc(db, getMenuItemPath(user.tenantId), targetItemId);
      await deleteDoc(docRef);
      toast.success('Item deleted successfully.');
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete item.');
    } finally {
      setIsDeleteItemOpen(false);
      setTargetItemId(null);
    }
  };

  // ----------------------------------------------------
  // SEARCH & FILTER LOGIC
  // ----------------------------------------------------
  const getFilteredItems = () => {
    return menuItems.filter((item) => {
      // Search text
      if (searchQuery.trim()) {
        const queryStr = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(queryStr);
        const matchesDesc = item.description.toLowerCase().includes(queryStr);
        if (!matchesName && !matchesDesc) return false;
      }

      // Category filter
      if (filterCategory !== 'all' && item.categoryId !== filterCategory) return false;

      // Veg filter
      if (filterVeg === 'veg' && !item.isVeg) return false;
      if (filterVeg === 'non-veg' && item.isVeg) return false;

      // Availability filter
      if (filterAvailable === 'available' && !item.isAvailable) return false;
      if (filterAvailable === 'out-of-stock' && item.isAvailable) return false;

      return true;
    }).sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });
  };

  // Pricing quick adjustments
  const handlePriceBlur = async (item: IMenuItem, valueStr: string, field: 'price' | 'discountPrice') => {
    if (!user?.tenantId) return;
    const value = parseFloat(valueStr);
    if (isNaN(value) || value < 0) {
      toast.error('Enter a valid non-negative number.');
      return;
    }

    try {
      const cents = Math.round(value * 100);
      const docRef = doc(db, getMenuItemPath(user.tenantId), item.id);
      
      if (field === 'price') {
        if (item.discountPrice && cents <= item.discountPrice) {
          toast.error('Regular price must be greater than discount price.');
          return;
        }
        await updateDoc(docRef, { price: cents });
      } else {
        if (cents >= item.price) {
          toast.error('Discount price must be less than regular price.');
          return;
        }
        await updateDoc(docRef, { discountPrice: cents === 0 ? null : cents });
      }
      toast.success('Price updated.');
    } catch (e) {
      console.error(e);
      toast.error('Failed to save price.');
    }
  };

  return (
    <div className="space-y-6 select-none text-left">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-display font-extrabold text-textPearl">Menu Engine</h1>
        <p className="text-xs text-mutedAsh">Setup categories, configure recipes, define prices, and verify live menus.</p>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-slate-800/60 pb-px gap-2 flex-wrap">
        {[
          { id: 'categories', label: 'Categories', icon: Layers },
          { id: 'items', label: 'Menu Items', icon: Grid },
          { id: 'availability', label: 'Availability', icon: Switch },
          { id: 'pricing', label: 'Pricing', icon: DollarSign },
          { id: 'preview', label: 'Menu Preview', icon: Eye }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border outline-none ${
                activeTab === tab.id
                  ? 'bg-primary text-background border-primary shadow-lg shadow-primary/10'
                  : 'bg-slate-900/40 text-slate-450 border-slate-850/80 hover:text-textPearl hover:bg-slate-900/65'
              }`}
            >
              {tab.id === 'availability' ? (
                <span className="w-3.5 h-3.5 flex items-center justify-center font-bold">⇅</span>
              ) : (
                <Icon className="w-3.5 h-3.5" />
              )}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Load State */}
      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <LoadingSpinner label="Loading Menu Workspace..." />
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* CATEGORIES TAB */}
          {activeTab === 'categories' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-xs font-semibold text-slate-450">Configure core categories and custom sort order.</p>
                <Button onClick={openAddCategory} className="flex items-center space-x-1.5" size="sm">
                  <Plus className="w-4 h-4" />
                  <span>Add Category</span>
                </Button>
              </div>

              {categories.length === 0 ? (
                <Card className="p-10 text-center border-slate-850 bg-slate-900/10">
                  <p className="text-sm text-slate-500">No categories created yet. Click Add Category to start.</p>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {categories.map((cat, idx) => (
                    <Card key={cat.id} className="p-4 border-slate-850 flex items-center space-x-4 bg-slate-900/20">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-950/40 border border-slate-850 shrink-0">
                        <img src={cat.image || FALLBACK_CATEGORY_IMAGE} alt={cat.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-bold text-textPearl text-sm truncate">{cat.name}</h3>
                          <Badge variant={cat.isActive ? 'success' : 'danger'}>
                            {cat.isActive ? 'Active' : 'Disabled'}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{cat.description}</p>
                      </div>

                      {/* Controls */}
                      <div className="flex flex-col items-center space-y-1.5 pl-2 border-l border-slate-850/60">
                        <div className="flex space-x-1">
                          <button 
                            onClick={() => reorderCategory(cat, 'up')} 
                            disabled={idx === 0}
                            className="p-1 rounded bg-slate-950/30 text-slate-400 hover:text-textPearl disabled:opacity-20 transition-all"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => reorderCategory(cat, 'down')} 
                            disabled={idx === categories.length - 1}
                            className="p-1 rounded bg-slate-950/30 text-slate-400 hover:text-textPearl disabled:opacity-20 transition-all"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex space-x-1.5">
                          <button onClick={() => openEditCategory(cat)} className="p-1 text-slate-400 hover:text-primary transition-all">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => triggerDeleteCategory(cat.id)} className="p-1 text-slate-500 hover:text-red-400 transition-all">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* MENU ITEMS TAB */}
          {activeTab === 'items' && (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1 max-w-md">
                  <SearchBar 
                    placeholder="Search menu catalog..."
                    value={searchQuery}
                    onSearchChange={setSearchQuery}
                  />
                </div>
                <Button onClick={openAddItem} className="flex items-center space-x-1.5 self-start" size="sm">
                  <Plus className="w-4 h-4" />
                  <span>Add Menu Item</span>
                </Button>
              </div>

              {/* Filters Panel */}
              <Card className="p-3 border-slate-850 bg-slate-900/20">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <Select 
                    options={[{ value: 'all', label: 'All Categories' }, ...categories.map(c => ({ value: c.id, label: c.name }))]}
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                  />
                  <Select 
                    options={[
                      { value: 'all', label: 'All Veg/Non-Veg' },
                      { value: 'veg', label: 'Vegetarian' },
                      { value: 'non-veg', label: 'Non-Vegetarian' }
                    ]}
                    value={filterVeg}
                    onChange={(e) => setFilterVeg(e.target.value)}
                  />
                  <Select 
                    options={[
                      { value: 'all', label: 'All Availability' },
                      { value: 'available', label: 'Available' },
                      { value: 'out-of-stock', label: 'Out of Stock' }
                    ]}
                    value={filterAvailable}
                    onChange={(e) => setFilterAvailable(e.target.value)}
                  />
                  <Select 
                    options={[
                      { value: 'name-asc', label: 'Name: A-Z' },
                      { value: 'name-desc', label: 'Name: Z-A' },
                      { value: 'price-asc', label: 'Price: Low to High' },
                      { value: 'price-desc', label: 'Price: High to Low' },
                      { value: 'newest', label: 'Newest Added' }
                    ]}
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  />
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={() => {
                      setSearchQuery('');
                      setFilterCategory('all');
                      setFilterVeg('all');
                      setFilterAvailable('all');
                      setSortBy('name-asc');
                    }}
                    className="col-span-2 md:col-span-1"
                  >
                    Clear Filters
                  </Button>
                </div>
              </Card>

              {/* Items List */}
              {getFilteredItems().length === 0 ? (
                <Card className="p-10 text-center border-slate-850 bg-slate-900/10">
                  <p className="text-sm text-slate-500">No menu items match your current search/filters.</p>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-3">
                  {getFilteredItems().map((item) => (
                    <Card key={item.id} className="overflow-hidden border-slate-850 flex flex-col bg-slate-900/20">
                      <div className="h-40 relative bg-slate-950/30 overflow-hidden shrink-0">
                        <img src={item.image || FALLBACK_ITEM_IMAGE} alt={item.name} className="w-full h-full object-cover" />
                        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                          {item.isVeg ? <Badge variant="success">Veg</Badge> : <Badge variant="danger">Non-Veg</Badge>}
                          {item.isBestSeller && <Badge variant="primary">Bestseller</Badge>}
                          {item.isRecommended && <Badge variant="warning">Recommended</Badge>}
                        </div>
                        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-slate-950/80 backdrop-blur text-[10px] font-bold text-textPearl">
                          {item.preparationTime} mins
                        </div>
                      </div>

                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start">
                            <h3 className="font-bold text-textPearl text-sm truncate pr-2">{item.name}</h3>
                            <span className="text-sm font-extrabold text-primary shrink-0">
                              {formatPrice(item.price)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 line-clamp-2 mt-1">{item.description}</p>
                          <div className="flex space-x-2 mt-2">
                            {item.spiceLevel !== 'none' && (
                              <div className="flex items-center text-[10px] font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">
                                <Flame className="w-2.5 h-2.5 mr-0.5" />
                                <span className="capitalize">{item.spiceLevel}</span>
                              </div>
                            )}
                            <div className="text-[10px] font-bold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                              {categories.find(c => c.id === item.categoryId)?.name || 'Uncategorized'}
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-850/60 flex items-center justify-between">
                          <Switch 
                            checked={item.isAvailable} 
                            onChange={() => toggleItemAvailable(item)}
                            label="Available"
                          />
                          <div className="flex space-x-1">
                            <button onClick={() => openEditItem(item)} className="p-1.5 rounded bg-slate-950/30 text-slate-400 hover:text-primary transition-all">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => duplicateItem(item)} className="p-1.5 rounded bg-slate-950/30 text-slate-400 hover:text-emerald-400 transition-all" title="Duplicate Item">
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => triggerDeleteItem(item.id)} className="p-1.5 rounded bg-slate-950/30 text-slate-500 hover:text-red-400 transition-all">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* AVAILABILITY TAB */}
          {activeTab === 'availability' && (
            <div className="grid gap-6 md:grid-cols-3">
              <div className="md:col-span-1 space-y-3">
                <h3 className="text-sm font-extrabold text-textPearl border-b border-slate-850 pb-2">Category Status</h3>
                <Card className="p-4 border-slate-850 space-y-4 bg-slate-900/10">
                  {categories.length === 0 ? (
                    <p className="text-xs text-slate-500">No categories found.</p>
                  ) : (
                    categories.map((cat) => (
                      <div key={cat.id} className="flex items-center justify-between py-1">
                        <span className="text-xs font-bold text-slate-350">{cat.name}</span>
                        <Switch 
                          checked={cat.isActive}
                          onChange={() => toggleCategoryActive(cat)}
                        />
                      </div>
                    ))
                  )}
                </Card>
              </div>

              <div className="md:col-span-2 space-y-4">
                <h3 className="text-sm font-extrabold text-textPearl border-b border-slate-850 pb-2">Menu Item In-Stock Status</h3>
                
                {categories.map((cat) => {
                  const catItems = menuItems.filter((i) => i.categoryId === cat.id);
                  if (catItems.length === 0) return null;
                  
                  return (
                    <Card key={cat.id} className="p-4 border-slate-850 bg-slate-900/10 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-850/40 pb-1.5">
                        <h4 className="text-xs font-extrabold text-primary uppercase tracking-wider">{cat.name}</h4>
                        <span className="text-[10px] text-slate-500 font-bold">{catItems.length} Items</span>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {catItems.map((item) => (
                          <div key={item.id} className="flex items-center justify-between p-2 rounded bg-slate-950/20 border border-slate-900">
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-textPearl truncate">{item.name}</p>
                              <p className="text-[10px] text-slate-500">{formatPrice(item.price)}</p>
                            </div>
                            <Switch 
                              checked={item.isAvailable}
                              onChange={() => toggleItemAvailable(item)}
                            />
                          </div>
                        ))}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* PRICING TAB */}
          {activeTab === 'pricing' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-xs font-semibold text-slate-450">Instantly modify prices and discounts. Changes save on blur.</p>
              </div>

              <Card className="p-0 overflow-hidden border-slate-850">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-850 bg-slate-900/30 text-xs font-bold text-slate-400 uppercase">
                      <th className="p-4">Item Details</th>
                      <th className="p-4 w-48">Base Price ($)</th>
                      <th className="p-4 w-48">Discount Price ($)</th>
                      <th className="p-4 w-40">Flags</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/40 text-xs">
                    {menuItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-900/25 transition-all">
                        <td className="p-4">
                          <div className="font-bold text-textPearl text-sm">{item.name}</div>
                          <div className="text-[10px] text-slate-500">
                            {categories.find(c => c.id === item.categoryId)?.name || 'Uncategorized'}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-1.5 bg-slate-950/40 border border-slate-850 rounded-xl px-2.5 py-1">
                            <span className="text-slate-500 font-bold">$</span>
                            <input 
                              type="number"
                              step="0.01"
                              defaultValue={(item.price / 100).toFixed(2)}
                              onBlur={(e) => handlePriceBlur(item, e.target.value, 'price')}
                              className="bg-transparent text-slate-200 outline-none w-full font-semibold text-xs"
                            />
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-1.5 bg-slate-950/40 border border-slate-850 rounded-xl px-2.5 py-1">
                            <span className="text-slate-500 font-bold">$</span>
                            <input 
                              type="number"
                              step="0.01"
                              defaultValue={item.discountPrice ? (item.discountPrice / 100).toFixed(2) : ''}
                              placeholder="No discount"
                              onBlur={(e) => handlePriceBlur(item, e.target.value, 'discountPrice')}
                              className="bg-transparent text-slate-200 outline-none w-full font-semibold text-xs"
                            />
                          </div>
                        </td>
                        <td className="p-4 space-y-1">
                          <div className="flex space-x-1">
                            <button 
                              onClick={() => toggleItemBestSeller(item)}
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold border transition-all ${
                                item.isBestSeller 
                                  ? 'bg-primary/10 text-primary border-primary/20' 
                                  : 'bg-slate-900/30 text-slate-500 border-slate-850'
                              }`}
                            >
                              Bestseller
                            </button>
                            <button 
                              onClick={() => toggleItemRecommended(item)}
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold border transition-all ${
                                item.isRecommended 
                                  ? 'bg-warning/10 text-warning border-warning/20' 
                                  : 'bg-slate-900/30 text-slate-500 border-slate-850'
                              }`}
                            >
                              Rec
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>
          )}

          {/* MENU PREVIEW */}
          {activeTab === 'preview' && (
            <div className="space-y-4">
              <div className="p-3 bg-primary/15 border border-primary/25 rounded-2xl flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-extrabold text-primary uppercase tracking-wider">Preview Mode Active</h3>
                  <p className="text-[10px] text-slate-400">Interact with the menu exactly as customers will view it table-side.</p>
                </div>
                <Badge variant="primary">Read Only</Badge>
              </div>

              <div className="grid gap-6 md:grid-cols-4 items-start">
                <Card className="p-3 border-slate-850 space-y-1 md:col-span-1 bg-slate-900/10">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 mb-2">Categories</h4>
                  {categories.filter(c => c.isActive).map((cat, idx) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        const element = document.getElementById(`preview-cat-${cat.id}`);
                        element?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-textPearl hover:bg-slate-900/60 transition-all outline-none"
                    >
                      {cat.name}
                    </button>
                  ))}
                </Card>

                <div className="md:col-span-3 space-y-6 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
                  {categories.filter(c => c.isActive).map((cat) => {
                    const catItems = menuItems.filter((i) => i.categoryId === cat.id && i.isAvailable);
                    if (catItems.length === 0) return null;

                    return (
                      <div key={cat.id} id={`preview-cat-${cat.id}`} className="space-y-3 scroll-mt-2">
                        <div className="border-b border-slate-800/40 pb-2">
                          <h3 className="text-base font-display font-extrabold text-textPearl">{cat.name}</h3>
                          <p className="text-xs text-slate-500">{cat.description}</p>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          {catItems.map((item) => (
                            <Card key={item.id} className="p-3 border-slate-850 flex bg-slate-900/20 hover:border-slate-800 transition-all select-none">
                              <div className="flex-1 min-w-0 flex flex-col justify-between pr-3">
                                <div>
                                  <div className="flex items-center space-x-1.5">
                                    <div className={`w-3.5 h-3.5 border flex items-center justify-center rounded shrink-0 ${
                                      item.isVeg ? 'border-emerald-500/40' : 'border-red-500/40'
                                    }`}>
                                      <div className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                    </div>
                                    <h4 className="font-bold text-textPearl text-sm truncate">{item.name}</h4>
                                  </div>
                                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">{item.description}</p>
                                  
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {item.isBestSeller && (
                                      <span className="flex items-center px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20 text-[9px] font-extrabold text-primary">
                                        <TrendingUp className="w-2.5 h-2.5 mr-0.5" /> Bestseller
                                      </span>
                                    )}
                                    {item.isRecommended && (
                                      <span className="flex items-center px-1.5 py-0.5 rounded bg-warning/10 border border-warning/20 text-[9px] font-extrabold text-warning">
                                        <Sparkles className="w-2.5 h-2.5 mr-0.5" /> Recommended
                                      </span>
                                    )}
                                    {item.spiceLevel !== 'none' && (
                                      <span className="flex items-center px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-[9px] font-extrabold text-red-400">
                                        <Flame className="w-2.5 h-2.5 mr-0.5" /> {item.spiceLevel}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center justify-between mt-3">
                                  <div className="flex flex-col">
                                    <span className="text-sm font-extrabold text-primary">
                                      {formatPrice(item.price)}
                                    </span>
                                    {item.discountPrice ? (
                                      <span className="text-[10px] text-slate-500 line-through">
                                        {formatPrice(item.discountPrice)}
                                      </span>
                                    ) : null}
                                  </div>
                                  <Button size="xs" className="flex items-center space-x-1" disabled>
                                    <ShoppingBag className="w-3 h-3" />
                                    <span>Add</span>
                                  </Button>
                                </div>
                              </div>

                              <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-950/40 border border-slate-850 shrink-0 self-center">
                                <img src={item.image || FALLBACK_ITEM_IMAGE} alt={item.name} className="w-full h-full object-cover" />
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* MODALS */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title={editingCategory ? 'Edit Category' : 'Add Category'}
        className="max-w-md"
      >
        <form onSubmit={handleSubmitCategory(onSubmitCategory)} className="space-y-4">
          <Input 
            label="Category Name *"
            type="text"
            placeholder="e.g. Appetizers"
            error={categoryErrors.name?.message}
            disabled={isSubmitting}
            {...registerCategory('name')}
          />
          <TextArea 
            label="Description *"
            placeholder="Introduce this category..."
            error={categoryErrors.description?.message}
            disabled={isSubmitting}
            {...registerCategory('description')}
          />
          <Input 
            label="Custom Image URL"
            type="text"
            placeholder="https://example.com/image.jpg"
            error={categoryErrors.image?.message}
            disabled={isSubmitting}
            {...registerCategory('image')}
          />

          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-450 select-none">Or Upload Photo</span>
            <div className="flex items-center space-x-3">
              <input
                id="cat-photo"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                disabled={isSubmitting}
                className="hidden"
              />
              <label 
                htmlFor="cat-photo"
                className="px-4 py-2 border border-slate-800 bg-slate-900 text-slate-300 rounded-xl text-xs font-bold hover:border-primary hover:text-primary transition-all cursor-pointer select-none"
              >
                Choose File
              </label>
              {imagePreview && (
                <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-800">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Display Order"
              type="number"
              error={categoryErrors.displayOrder?.message}
              disabled={isSubmitting}
              {...registerCategory('displayOrder')}
            />
            <div className="flex flex-col space-y-1.5 justify-end pb-1.5">
              <span className="text-xs font-semibold text-slate-450 select-none">Status</span>
              <Switch 
                checked={true}
                onChange={() => {}}
                label="Is Active"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3 pt-4 border-t border-slate-800/40">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsCategoryModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" isLoading={isSubmitting}>
              {editingCategory ? 'Save Changes' : 'Create Category'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        title={editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
        className="max-w-lg"
      >
        <form onSubmit={handleSubmitItem(onSubmitItem)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Item Name *"
              type="text"
              placeholder="e.g. Paneer Tikka"
              error={itemErrors.name?.message}
              disabled={isSubmitting}
              {...registerItem('name')}
            />
            <Select 
              label="Category *"
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
              error={itemErrors.categoryId?.message}
              disabled={isSubmitting}
              {...registerItem('categoryId')}
            />
          </div>

          <TextArea 
            label="Description *"
            placeholder="List ingredients and notes..."
            error={itemErrors.description?.message}
            disabled={isSubmitting}
            {...registerItem('description')}
          />

          <div className="grid grid-cols-3 gap-4">
            <Input 
              label="Base Price ($) *"
              type="number"
              step="0.01"
              placeholder="9.99"
              error={itemErrors.price?.message}
              disabled={isSubmitting}
              {...registerItem('price')}
            />
            <Input 
              label="Discount Price ($)"
              type="number"
              step="0.01"
              placeholder="e.g. 7.99"
              error={itemErrors.discountPrice?.message}
              disabled={isSubmitting}
              {...registerItem('discountPrice')}
            />
            <Input 
              label="Prep Time (mins) *"
              type="number"
              placeholder="15"
              error={itemErrors.preparationTime?.message}
              disabled={isSubmitting}
              {...registerItem('preparationTime')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 py-2 border-y border-slate-800/40">
            <Switch 
              checked={watchIsVeg}
              onChange={(val) => setValueItem('isVeg', val)}
              label="Vegetarian (Veg)"
            />
            <Switch 
              checked={watchIsAvailable}
              onChange={(val) => setValueItem('isAvailable', val)}
              label="Available / In Stock"
            />
          </div>

          <div className="grid grid-cols-3 gap-4 py-1">
            <Switch 
              checked={watchIsBestSeller}
              onChange={(val) => setValueItem('isBestSeller', val)}
              label="Bestseller"
            />
            <Switch 
              checked={watchIsRecommended}
              onChange={(val) => setValueItem('isRecommended', val)}
              label="Recommended"
            />
            <Select 
              label="Spice Level"
              options={[
                { value: 'none', label: 'Not Spicy' },
                { value: 'mild', label: 'Mild' },
                { value: 'medium', label: 'Medium' },
                { value: 'hot', label: 'Hot' }
              ]}
              disabled={isSubmitting}
              {...registerItem('spiceLevel')}
            />
          </div>

          <Input 
            label="Image URL"
            type="text"
            placeholder="https://example.com/food.jpg"
            error={itemErrors.image?.message}
            disabled={isSubmitting}
            {...registerItem('image')}
          />

          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-450 select-none">Or Upload Photo</span>
            <div className="flex items-center space-x-3">
              <input
                id="item-photo"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                disabled={isSubmitting}
                className="hidden"
              />
              <label 
                htmlFor="item-photo"
                className="px-4 py-2 border border-slate-800 bg-slate-900 text-slate-300 rounded-xl text-xs font-bold hover:border-primary hover:text-primary transition-all cursor-pointer select-none"
              >
                Choose File
              </label>
              {imagePreview && (
                <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-800">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3 pt-4 border-t border-slate-800/40">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsItemModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" isLoading={isSubmitting}>
              {editingItem ? 'Save Changes' : 'Create Item'}
            </Button>
          </div>
        </form>
      </Modal>

      <Dialog 
        isOpen={isDeleteCategoryOpen}
        onClose={() => setIsDeleteCategoryOpen(false)}
        onConfirm={confirmDeleteCategory}
        title="Delete Category"
        message="Are you sure you want to delete this category? Items under this category will remain, but will no longer have a valid category classification in preview."
        confirmLabel="Delete"
        isDangerous
      />

      <Dialog 
        isOpen={isDeleteItemOpen}
        onClose={() => setIsDeleteItemOpen(false)}
        onConfirm={confirmDeleteItem}
        title="Delete Menu Item"
        message="Are you sure you want to permanently delete this menu item from Firestore?"
        confirmLabel="Delete"
        isDangerous
      />

    </div>
  );
};
export default MenuManagement;
