import React, { useEffect, useState, useMemo } from 'react';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  query,
  onSnapshot,
  addDoc
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../context/AuthContext';
import { formatPrice } from '../../../shared/utils/format';
import { inventoryService } from '../../../shared/services/inventoryService';

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

// Lucide Icons
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Package, 
  Settings, 
  AlertTriangle,
  BookOpen,
  TrendingUp,
  Truck,
  AlertOctagon,
  Calendar,
  Trash,
  Sparkles,
  RefreshCcw,
  CheckCircle,
  HelpCircle,
  FileText
} from 'lucide-react';
import toast from 'react-hot-toast';

import { IStockIngredient, IRecipe, IStockMovement, ISupplier, IPurchaseSuggestion, IWasteLog } from '../../../shared/domain/inventory/types';

export const OwnerInventoryManager: React.FC = () => {
  const { user } = useAuth();
  const tenantId = user?.tenantId;

  // Navigation state
  const [activeTab, setActiveTab] = useState('overview');

  // Real-time Database states
  const [ingredients, setIngredients] = useState<IStockIngredient[]>([]);
  const [recipes, setRecipes] = useState<IRecipe[]>([]);
  const [movements, setMovements] = useState<IStockMovement[]>([]);
  const [suppliers, setSuppliers] = useState<ISupplier[]>([]);
  const [suggestions, setSuggestions] = useState<IPurchaseSuggestion[]>([]);
  const [wasteLogs, setWasteLogs] = useState<IWasteLog[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // CRUD Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<IStockIngredient | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ingredient Form Field states
  const [ingName, setIngName] = useState('');
  const [ingCategory, setIngCategory] = useState<'Vegetables' | 'Meat' | 'Dairy' | 'Dry Goods' | 'Beverages' | 'Spices' | 'Bakery' | 'Other'>('Vegetables');
  const [ingUnit, setIngUnit] = useState<'kg' | 'g' | 'liters' | 'ml' | 'pieces' | 'packs'>('kg');
  const [ingCurrentStock, setIngCurrentStock] = useState('0');
  const [ingMinStock, setIngMinStock] = useState('5');
  const [ingMaxStock, setIngMaxStock] = useState('50');
  const [ingReorderLevel, setIngReorderLevel] = useState('10');
  const [ingSupplierId, setIngSupplierId] = useState('');
  const [ingPurchaseCost, setIngPurchaseCost] = useState('0');
  const [ingStorageLocation, setIngStorageLocation] = useState<'Fridge' | 'Freezer' | 'Pantry' | 'Dry Storage' | 'Bar' | 'Kitchen Shelf'>('Pantry');
  const [ingExpiryDate, setIngExpiryDate] = useState('');

  // Recipe Edit Drawer States
  const [selectedRecipeItem, setSelectedRecipeItem] = useState<any | null>(null);
  const [recipeIngredients, setRecipeIngredients] = useState<any[]>([]);
  const [recipeVersion, setRecipeVersion] = useState('v1.0');
  const [recipeYield, setRecipeYield] = useState('1');
  const [recipeWastePercent, setRecipeWastePercent] = useState('0');
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);

  // Waste Recording Modal States
  const [isWasteModalOpen, setIsWasteModalOpen] = useState(false);
  const [wasteIngId, setWasteIngId] = useState('');
  const [wasteQty, setWasteQty] = useState('');
  const [wasteReason, setWasteReason] = useState<'spoilage' | 'expired' | 'damaged' | 'staff_mistake' | 'customer_return'>('spoilage');
  const [wasteNote, setWasteNote] = useState('');

  // Supplier Form Modal States
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<ISupplier | null>(null);
  const [supName, setSupName] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supEmail, setSupEmail] = useState('');
  const [supAddress, setSupAddress] = useState('');
  const [supDeliveryDays, setSupDeliveryDays] = useState('3');
  const [supRating, setSupRating] = useState('5');

  // Supplier Delete States
  const [isSupDeleteOpen, setIsSupDeleteOpen] = useState(false);
  const [deletingSupId, setDeletingSupId] = useState<string | null>(null);

  // Categories definition
  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'Vegetables', label: 'Vegetables' },
    { value: 'Meat', label: 'Meat & Seafood' },
    { value: 'Dairy', label: 'Dairy' },
    { value: 'Dry Goods', label: 'Dry Goods' },
    { value: 'Beverages', label: 'Beverages' },
    { value: 'Spices', label: 'Spices' },
    { value: 'Bakery', label: 'Bakery' },
    { value: 'Other', label: 'Other Items' }
  ];

  // 1. Subscribe to all inventory collections
  useEffect(() => {
    if (!tenantId) return;

    setIsLoading(true);

    // Ingredients listener
    const unsubIngredients = onSnapshot(collection(db, 'restaurants', tenantId, 'inventory'), (snap) => {
      const list: IStockIngredient[] = [];
      snap.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as IStockIngredient);
      });
      setIngredients(list);
    });

    // Recipes listener
    const unsubRecipes = onSnapshot(collection(db, 'restaurants', tenantId, 'recipes'), (snap) => {
      const list: IRecipe[] = [];
      snap.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as IRecipe);
      });
      setRecipes(list);
    });

    // Movements listener
    const unsubMovements = onSnapshot(collection(db, 'restaurants', tenantId, 'stockMovements'), (snap) => {
      const list: IStockMovement[] = [];
      snap.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as IStockMovement);
      });
      list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setMovements(list);
    });

    // Suppliers listener
    const unsubSuppliers = onSnapshot(collection(db, 'restaurants', tenantId, 'suppliers'), (snap) => {
      const list: ISupplier[] = [];
      snap.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as ISupplier);
      });
      setSuppliers(list);
    });

    // Purchase Suggestions listener
    const unsubSuggestions = onSnapshot(collection(db, 'restaurants', tenantId, 'purchaseSuggestions'), (snap) => {
      const list: IPurchaseSuggestion[] = [];
      snap.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as IPurchaseSuggestion);
      });
      setSuggestions(list);
    });

    // Waste Logs listener
    const unsubWaste = onSnapshot(collection(db, 'restaurants', tenantId, 'waste'), (snap) => {
      const list: IWasteLog[] = [];
      snap.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as IWasteLog);
      });
      list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setWasteLogs(list);
    });

    // Menu Items loader
    const fetchMenuItems = async () => {
      try {
        const querySnap = await getDocs(collection(db, 'restaurants', tenantId, 'menu', 'default', 'items'));
        const list: any[] = [];
        querySnap.forEach(docSnap => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });
        setMenuItems(list);
      } catch (e) {
        console.error(e);
      }
    };
    fetchMenuItems();

    setIsLoading(false);

    return () => {
      unsubIngredients();
      unsubRecipes();
      unsubMovements();
      unsubSuppliers();
      unsubSuggestions();
      unsubWaste();
    };
  }, [tenantId]);

  // Derived stock overview metrics
  const stockMetrics = useMemo(() => {
    const total = ingredients.length;
    const low = ingredients.filter(i => i.status === 'low').length;
    const critical = ingredients.filter(i => i.status === 'critical').length;
    const out = ingredients.filter(i => i.status === 'out_of_stock').length;
    
    // Total value of safety stock in kitchen
    const value = ingredients.reduce((sum, item) => sum + (item.currentStock * (item.purchaseCost || 0)), 0);

    // Filter expiring
    const todayStr = new Date().toISOString().split('T')[0];
    const soonDate = new Date();
    soonDate.setDate(soonDate.getDate() + 7);
    const soonStr = soonDate.toISOString().split('T')[0];

    const expired = ingredients.filter(i => i.expiryDate && i.expiryDate < todayStr).length;
    const expiringSoon = ingredients.filter(i => i.expiryDate && i.expiryDate >= todayStr && i.expiryDate <= soonStr).length;

    // Total loss to spoilage/waste this week
    const wasteCost = wasteLogs.reduce((sum, item) => sum + (item.valueLost || 0), 0);

    return { total, low, critical, out, value, expired, expiringSoon, wasteCost };
  }, [ingredients, wasteLogs]);

  // Search & Filtered ingredients list
  const filteredIngredients = useMemo(() => {
    return ingredients.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (item.supplierName && item.supplierName.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [ingredients, searchQuery, categoryFilter]);

  // Add / Edit Ingredient logic
  const handleOpenAddIngredient = () => {
    setEditingIngredient(null);
    setIngName('');
    setIngCategory('Vegetables');
    setIngUnit('kg');
    setIngCurrentStock('10');
    setIngMinStock('5');
    setIngMaxStock('50');
    setIngReorderLevel('10');
    setIngSupplierId('');
    setIngPurchaseCost('1.5');
    setIngStorageLocation('Pantry');
    setIngExpiryDate('');
    setIsFormOpen(true);
  };

  const handleOpenEditIngredient = (item: IStockIngredient) => {
    setEditingIngredient(item);
    setIngName(item.name);
    setIngCategory(item.category);
    setIngUnit(item.unit);
    setIngCurrentStock(String(item.currentStock));
    setIngMinStock(String(item.minimumStock));
    setIngMaxStock(String(item.maximumStock));
    setIngReorderLevel(String(item.reorderLevel));
    setIngSupplierId(item.supplierId || '');
    setIngPurchaseCost(String((item.purchaseCost || 0) / 100)); // convert cents to cost
    setIngStorageLocation(item.storageLocation);
    setIngExpiryDate(item.expiryDate || '');
    setIsFormOpen(true);
  };

  const handleSubmitIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;

    if (!ingName.trim()) {
      toast.error('Ingredient name is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const ingId = editingIngredient ? editingIngredient.id : `ING-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      const docRef = doc(db, 'restaurants', tenantId, 'inventory', ingId);
      
      const resolvedSupplier = suppliers.find(s => s.id === ingSupplierId);
      const supplierName = resolvedSupplier ? resolvedSupplier.name : 'Direct Purchase';

      const currentStockVal = parseFloat(ingCurrentStock) || 0;
      const minStockVal = parseFloat(ingMinStock) || 0;
      const purchaseCostCents = Math.round(parseFloat(ingPurchaseCost) * 100) || 0;

      // Determine stock status health
      let status: IStockIngredient['status'] = 'healthy';
      if (currentStockVal === 0) status = 'out_of_stock';
      else if (currentStockVal <= minStockVal * 0.5) status = 'critical';
      else if (currentStockVal <= minStockVal) status = 'low';

      const ingredientPayload = {
        id: ingId,
        name: ingName.trim(),
        category: ingCategory,
        unit: ingUnit,
        currentStock: currentStockVal,
        minimumStock: minStockVal,
        maximumStock: parseFloat(ingMaxStock) || 50,
        reorderLevel: parseFloat(ingReorderLevel) || 10,
        supplierId: ingSupplierId,
        supplierName,
        purchaseCost: purchaseCostCents,
        storageLocation: ingStorageLocation,
        expiryDate: ingExpiryDate,
        status,
        updatedAt: new Date().toISOString()
      };

      await setDoc(docRef, ingredientPayload);

      // Create stock movement if manual level adjustment happened
      if (!editingIngredient || editingIngredient.currentStock !== currentStockVal) {
        const diff = editingIngredient ? currentStockVal - editingIngredient.currentStock : currentStockVal;
        
        const movementId = `MVT-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
        await setDoc(doc(db, 'restaurants', tenantId, 'stockMovements', movementId), {
          id: movementId,
          ingredientId: ingId,
          ingredientName: ingName.trim(),
          quantity: diff,
          type: editingIngredient ? 'adjustment' : 'purchase',
          reason: editingIngredient ? 'Manual corrections log' : 'Initial shelf setup',
          submittedBy: user?.uid || 'unknown',
          submittedByName: user?.displayName || 'Owner',
          timestamp: new Date().toISOString()
        });
      }

      toast.success(editingIngredient ? 'Ingredient updated!' : 'Ingredient added to Master list!');
      setIsFormOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to save ingredient details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDelete = (id: string) => {
    setDeletingId(id);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!tenantId || !deletingId) return;

    try {
      await deleteDoc(doc(db, 'restaurants', tenantId, 'inventory', deletingId));
      toast.success('Ingredient deleted from stock master.');
      setIsDeleteOpen(false);
    } catch (e) {
      console.error(e);
      toast.error('Delete failed.');
    }
  };

  // Recipe edit mapping triggers
  const handleOpenRecipeMapping = (menuItem: any) => {
    setSelectedRecipeItem(menuItem);
    const existingRecipe = recipes.find(r => r.menuItemId === menuItem.id);
    
    if (existingRecipe) {
      setRecipeIngredients(existingRecipe.ingredients || []);
      setRecipeVersion(existingRecipe.version || 'v1.0');
      setRecipeYield(String(existingRecipe.yieldQuantity || '1'));
      setRecipeWastePercent(String(existingRecipe.wastePercentage || '0'));
    } else {
      setRecipeIngredients([]);
      setRecipeVersion('v1.0');
      setRecipeYield('1');
      setRecipeWastePercent('0');
    }
    setIsRecipeModalOpen(true);
  };

  const handleAddIngredientRow = () => {
    if (ingredients.length === 0) {
      toast.error('Please create stock ingredients first.');
      return;
    }
    const defaultIng = ingredients[0];
    setRecipeIngredients([...recipeIngredients, {
      ingredientId: defaultIng.id,
      ingredientName: defaultIng.name,
      quantity: 10,
      unit: defaultIng.unit
    }]);
  };

  const handleUpdateRecipeRow = (index: number, field: string, value: any) => {
    const rows = [...recipeIngredients];
    if (field === 'ingredientId') {
      const resolved = ingredients.find(i => i.id === value);
      if (resolved) {
        rows[index].ingredientId = resolved.id;
        rows[index].ingredientName = resolved.name;
        rows[index].unit = resolved.unit;
      }
    } else {
      rows[index][field] = value;
    }
    setRecipeIngredients(rows);
  };

  const handleRemoveRecipeRow = (index: number) => {
    setRecipeIngredients(recipeIngredients.filter((_, i) => i !== index));
  };

  const handleSaveRecipe = async () => {
    if (!tenantId || !selectedRecipeItem) return;

    setIsSubmitting(true);
    try {
      const recipeRef = doc(db, 'restaurants', tenantId, 'recipes', selectedRecipeItem.id);
      
      const payload: IRecipe = {
        id: selectedRecipeItem.id,
        menuItemId: selectedRecipeItem.id,
        menuItemName: selectedRecipeItem.name,
        version: recipeVersion || 'v1.0',
        yieldQuantity: parseFloat(recipeYield) || 1,
        wastePercentage: parseFloat(recipeWastePercent) || 0,
        ingredients: recipeIngredients.map(ing => ({
          ingredientId: ing.ingredientId,
          ingredientName: ing.ingredientName,
          quantity: parseFloat(ing.quantity) || 0,
          unit: ing.unit || 'g'
        })),
        updatedAt: new Date().toISOString()
      };

      await setDoc(recipeRef, payload);
      toast.success(`Recipe mapping for "${selectedRecipeItem.name}" updated!`);
      setIsRecipeModalOpen(false);
    } catch (e) {
      console.error(e);
      toast.error('Failed to map recipe.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Waste logs submit
  const handleOpenWaste = () => {
    if (ingredients.length === 0) {
      toast.error('No ingredients listed in inventory.');
      return;
    }
    setWasteIngId(ingredients[0].id);
    setWasteQty('');
    setWasteReason('spoilage');
    setWasteNote('');
    setIsWasteModalOpen(true);
  };

  const handleSubmitWaste = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;

    const ing = ingredients.find(i => i.id === wasteIngId);
    if (!ing) return;

    const qty = parseFloat(wasteQty);
    if (isNaN(qty) || qty <= 0) {
      toast.error('Enter valid waste quantity.');
      return;
    }

    setIsSubmitting(true);
    try {
      const lostValueCents = qty * (ing.purchaseCost || 0);

      const wastePayload = {
        ingredientId: wasteIngId,
        ingredientName: ing.name,
        quantity: qty,
        unit: ing.unit,
        reason: wasteReason,
        valueLost: lostValueCents,
        submittedBy: user?.uid || 'staff',
        submittedByName: user?.displayName || 'Kitchen Chef',
        notes: wasteNote.trim()
      };

      await inventoryService.recordWaste(tenantId, wastePayload);
      toast.success('Waste logged, stock levels adjusted.');
      setIsWasteModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to record waste.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Supplier modal handlers
  const handleOpenAddSupplier = () => {
    setEditingSupplier(null);
    setSupName('');
    setSupPhone('');
    setSupEmail('');
    setSupAddress('');
    setSupDeliveryDays('3');
    setSupRating('5');
    setIsSupplierModalOpen(true);
  };

  const handleOpenEditSupplier = (supplier: ISupplier) => {
    setEditingSupplier(supplier);
    setSupName(supplier.name);
    setSupPhone(supplier.phone);
    setSupEmail(supplier.email);
    setSupAddress(supplier.address);
    setSupDeliveryDays(String(supplier.deliveryTimeDays));
    setSupRating(String(supplier.rating));
    setIsSupplierModalOpen(true);
  };

  const handleSubmitSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;

    if (!supName.trim()) {
      toast.error('Supplier name is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const supplierId = editingSupplier ? editingSupplier.id : `SUP-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      const supRef = doc(db, 'restaurants', tenantId, 'suppliers', supplierId);

      const payload: ISupplier = {
        id: supplierId,
        name: supName.trim(),
        phone: supPhone.trim(),
        email: supEmail.trim(),
        address: supAddress.trim(),
        suppliedIngredientIds: editingSupplier ? editingSupplier.suppliedIngredientIds || [] : [],
        deliveryTimeDays: parseInt(supDeliveryDays) || 3,
        rating: parseInt(supRating) || 5,
        updatedAt: new Date().toISOString()
      };

      await setDoc(supRef, payload);
      toast.success(editingSupplier ? 'Supplier details updated!' : 'New Supplier registered!');
      setIsSupplierModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Supplier operations failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDeleteSupplier = (id: string) => {
    setDeletingSupId(id);
    setIsSupDeleteOpen(true);
  };

  const handleConfirmDeleteSupplier = async () => {
    if (!tenantId || !deletingSupId) return;

    try {
      await deleteDoc(doc(db, 'restaurants', tenantId, 'suppliers', deletingSupId));
      toast.success('Supplier removed.');
      setIsSupDeleteOpen(false);
    } catch (e) {
      console.error(e);
      toast.error('Delete failed.');
    }
  };

  const handleMarkSuggestionOrdered = async (id: string) => {
    if (!tenantId) return;
    try {
      await updateDoc(doc(db, 'restaurants', tenantId, 'purchaseSuggestions', id), {
        status: 'ordered'
      });
      toast.success('Suggested order status changed to Ordered!');
    } catch (e) {
      console.error(e);
    }
  };

  const handleCompleteSuggestion = async (sug: IPurchaseSuggestion) => {
    if (!tenantId) return;
    try {
      // 1. Add Stock back to inventory
      const ingRef = doc(db, 'restaurants', tenantId, 'inventory', sug.ingredientId);
      const ingSnap = await getDoc(ingRef);
      
      if (ingSnap.exists()) {
        const ingData = ingSnap.data() as IStockIngredient;
        const newQty = (ingData.currentStock || 0) + sug.recommendedQuantity;
        
        await updateDoc(ingRef, {
          currentStock: newQty,
          status: 'healthy',
          updatedAt: new Date().toISOString()
        });

        // 2. Log Stock movement purchase
        const movementId = `MVT-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
        await setDoc(doc(db, 'restaurants', tenantId, 'stockMovements', movementId), {
          id: movementId,
          ingredientId: sug.ingredientId,
          ingredientName: sug.ingredientName,
          quantity: sug.recommendedQuantity,
          type: 'purchase',
          reason: 'Replenishment order completed',
          submittedBy: user?.uid || 'owner',
          submittedByName: user?.displayName || 'Owner',
          timestamp: new Date().toISOString()
        });
      }

      // 3. Remove suggestion document
      await deleteDoc(doc(db, 'restaurants', tenantId, 'purchaseSuggestions', sug.id));
      toast.success('Replenishment stock received and inventory levels increased!');
    } catch (e) {
      console.error(e);
      toast.error('Failed to complete suggestion.');
    }
  };

  // Nav tabs config
  const navTabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'ingredients', label: 'Ingredients list', icon: Package },
    { id: 'recipes', label: 'Recipes map', icon: BookOpen },
    { id: 'movements', label: 'Movements Log', icon: FileText },
    { id: 'suppliers', label: 'Suppliers', icon: Truck },
    { id: 'lowstock', label: 'Low Stock warnings', icon: AlertOctagon },
    { id: 'expiry', label: 'Expiry monitor', icon: Calendar },
    { id: 'waste', label: 'Waste Logs', icon: Trash },
    { id: 'suggestions', label: 'Suggestions list', icon: Sparkles }
  ];

  return (
    <div className="space-y-6 text-left select-none antialiased">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-extrabold text-textPearl">Inventory Automation</h1>
          <p className="text-xs text-mutedAsh font-semibold">Automatic stock calculations, recipes mappings, waste losses tracking, and replenishment alerts.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleOpenWaste} variant="secondary" className="flex items-center gap-1.5 text-xs font-bold py-2 px-3">
            <Trash className="w-3.5 h-3.5" />
            <span>Record Waste</span>
          </Button>
          <Button onClick={handleOpenAddIngredient} className="flex items-center gap-1.5 text-xs font-bold py-2 px-3 bg-gradient-to-r from-primary to-amber-600 hover:from-primary-hover hover:to-amber-700 text-background">
            <Plus className="w-3.5 h-3.5" />
            <span>Add Stock Ingredient</span>
          </Button>
        </div>
      </div>

      <Tabs 
        tabs={navTabs} 
        activeTabId={activeTab} 
        onTabChange={setActiveTab} 
      />

      {/* Overview tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-5 border-slate-850 bg-slate-900/30 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Kitchen Stock Value</span>
                <strong className="text-xl font-mono text-textPearl font-extrabold">{formatPrice(stockMetrics.value)}</strong>
              </div>
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl text-emerald-400">
                <TrendingUp className="w-6 h-6" />
              </div>
            </Card>

            <Card className="p-5 border-slate-850 bg-slate-900/30 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Low Stock Warnings</span>
                <strong className="text-xl font-mono text-amber-500 font-extrabold">{stockMetrics.low + stockMetrics.critical}</strong>
              </div>
              <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-2xl text-amber-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </Card>

            <Card className="p-5 border-slate-850 bg-slate-900/30 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Out of Stock</span>
                <strong className="text-xl font-mono text-red-500 font-extrabold">{stockMetrics.out}</strong>
              </div>
              <div className="p-3 bg-red-500/10 border border-red-500/25 rounded-2xl text-red-400">
                <AlertOctagon className="w-6 h-6 animate-pulse" />
              </div>
            </Card>

            <Card className="p-5 border-slate-850 bg-slate-900/30 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Spoilage & Waste Lost</span>
                <strong className="text-xl font-mono text-slate-400 font-extrabold">{formatPrice(stockMetrics.wasteCost)}</strong>
              </div>
              <div className="p-3 bg-slate-800 border border-slate-750 rounded-2xl text-slate-400">
                <Trash className="w-6 h-6" />
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-5 border-slate-850 bg-slate-900/30 space-y-4">
              <h3 className="text-xs font-bold text-textPearl uppercase tracking-wider pb-2 border-b border-slate-850/60">
                Low Stock warnings
              </h3>
              {ingredients.filter(i => i.status === 'low' || i.status === 'critical' || i.status === 'out_of_stock').length === 0 ? (
                <p className="text-xs text-slate-500 font-semibold py-4 text-center">All stock levels healthy!</p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {ingredients.filter(i => i.status === 'low' || i.status === 'critical' || i.status === 'out_of_stock').slice(0, 5).map(i => (
                    <div key={i.id} className="flex justify-between items-center bg-slate-950/40 p-2.5 border border-slate-855 rounded-xl text-xs">
                      <div>
                        <span className="font-bold text-textPearl block">{i.name}</span>
                        <span className="text-[9px] text-slate-500 font-bold block uppercase mt-0.5">Supplier: {i.supplierName}</span>
                      </div>
                      <div className="text-right space-y-1">
                        <strong className="font-mono text-amber-500 font-extrabold">{i.currentStock} {i.unit}</strong>
                        <Badge variant={i.status === 'out_of_stock' ? 'danger' : 'warning'} className="scale-90 origin-right block">
                          {i.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-5 border-slate-850 bg-slate-900/30 space-y-4">
              <h3 className="text-xs font-bold text-textPearl uppercase tracking-wider pb-2 border-b border-slate-850/60">
                Recent Stock Movements
              </h3>
              {movements.length === 0 ? (
                <p className="text-xs text-slate-500 font-semibold py-4 text-center">No movements recorded yet.</p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {movements.slice(0, 5).map(m => (
                    <div key={m.id} className="flex justify-between items-center bg-slate-950/40 p-2.5 border border-slate-855 rounded-xl text-xs">
                      <div>
                        <span className="font-bold text-slate-300 block">{m.ingredientName}</span>
                        <span className="text-[9px] text-slate-550 block font-semibold">{m.reason}</span>
                      </div>
                      <div className="text-right space-y-0.5">
                        <strong className={`font-mono font-extrabold ${m.quantity > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {m.quantity > 0 ? '+' : ''}{m.quantity}
                        </strong>
                        <span className="text-[8.5px] text-slate-600 block uppercase tracking-widest">{m.type.replace('_', ' ')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* Ingredients list Tab */}
      {activeTab === 'ingredients' && (
        <div className="space-y-6">
          <Card className="p-4 border-slate-850 bg-slate-900/20">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <SearchBar 
                  placeholder="Search ingredient list..." 
                  value={searchQuery}
                  onSearchChange={setSearchQuery}
                />
              </div>
              <div className="w-full md:w-56">
                <Select 
                  options={categories}
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                />
              </div>
            </div>
          </Card>

          {filteredIngredients.length === 0 ? (
            <Card className="p-8 text-center border border-dashed border-slate-850 rounded-2xl bg-slate-900/10">
              <AlertTriangle className="w-10 h-10 text-slate-700 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-450">No stock records found.</p>
            </Card>
          ) : (
            <Card className="p-0 overflow-hidden border-slate-850">
              <Table 
                keyExtractor={(row: IStockIngredient) => row.id} 
                data={filteredIngredients}
                columns={[
                  {
                    header: 'Ingredient Details',
                    accessor: (row: IStockIngredient) => (
                      <div>
                        <span className="font-bold text-textPearl text-sm">{row.name}</span>
                        <div className="flex space-x-1.5 mt-0.5">
                          <Badge variant="muted">{row.category}</Badge>
                          <Badge variant="muted" className="bg-slate-900 border-slate-800 text-slate-400">
                            Storage: {row.storageLocation}
                          </Badge>
                        </div>
                      </div>
                    )
                  },
                  {
                    header: 'Current Stock',
                    accessor: (row: IStockIngredient) => (
                      <div>
                        <span className="font-bold text-slate-300">{row.currentStock} {row.unit}</span>
                        <span className="text-[10px] text-slate-550 block font-semibold">Min limit: {row.minimumStock}</span>
                      </div>
                    )
                  },
                  {
                    header: 'Stock Status',
                    accessor: (row: IStockIngredient) => (
                      <Badge variant={
                        row.status === 'healthy' ? 'success' :
                        row.status === 'low' ? 'warning' : 'danger'
                      }>
                        {row.status.replace('_', ' ')}
                      </Badge>
                    )
                  },
                  {
                    header: 'Preferred Supplier',
                    accessor: (row: IStockIngredient) => (
                      <div>
                        <span className="text-slate-350 font-semibold block">{row.supplierName || 'None'}</span>
                        <span className="text-[9.5px] text-slate-550 font-bold block uppercase">Cost: {formatPrice(row.purchaseCost)}</span>
                      </div>
                    )
                  },
                  {
                    header: 'Expiry Date',
                    accessor: (row: IStockIngredient) => (
                      <span className="text-slate-400 text-xs">
                        {row.expiryDate ? new Date(row.expiryDate).toLocaleDateString() : 'N/A'}
                      </span>
                    )
                  },
                  {
                    header: 'Actions',
                    accessor: (row: IStockIngredient) => (
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEditIngredient(row)}
                          className="p-1 text-slate-400 hover:text-primary hover:bg-slate-800/50"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDelete(row.id)}
                          className="p-1 text-slate-450 hover:text-red-500 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )
                  }
                ]}
              />
            </Card>
          )}
        </div>
      )}

      {/* Recipes mapping Tab */}
      {activeTab === 'recipes' && (
        <div className="space-y-6">
          <Card className="p-5 border-slate-850 bg-slate-900/30">
            <h3 className="text-xs font-bold text-textPearl uppercase tracking-wider pb-2 border-b border-slate-850/60">
              Recipe Configurator List
            </h3>
            <div className="divide-y divide-slate-850/40">
              {menuItems.map((item) => {
                const recipe = recipes.find(r => r.menuItemId === item.id);
                return (
                  <div key={item.id} className="flex justify-between items-center py-4 select-none text-xs">
                    <div>
                      <strong className="text-textPearl block font-bold text-sm">{item.name}</strong>
                      <span className="text-[10px] text-slate-550 block font-semibold mt-0.5">
                        Category: {item.category} • Price: {formatPrice(item.price || 0)}
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      {recipe ? (
                        <div className="text-right">
                          <Badge variant="success" className="scale-95">Recipe Mapped</Badge>
                          <span className="text-[9.5px] text-slate-500 font-bold block uppercase tracking-wider mt-0.5">
                            {recipe.ingredients?.length || 0} ingredients • Yield {recipe.yieldQuantity}
                          </span>
                        </div>
                      ) : (
                        <Badge variant="danger" className="scale-95">No Recipe Linked</Badge>
                      )}
                      
                      <Button onClick={() => handleOpenRecipeMapping(item)} className="text-xs font-bold py-1.5 px-3">
                        Config Recipe
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* Movements Log Tab */}
      {activeTab === 'movements' && (
        <Card className="p-0 overflow-hidden border-slate-850">
          <Table
            keyExtractor={(row: IStockMovement) => row.id}
            data={movements}
            columns={[
              {
                header: 'Timestamp',
                accessor: (row: IStockMovement) => (
                  <span className="text-slate-450 font-mono text-[10px]">
                    {new Date(row.timestamp).toLocaleString()}
                  </span>
                )
              },
              {
                header: 'Ingredient',
                accessor: (row: IStockMovement) => <span className="font-bold text-textPearl">{row.ingredientName}</span>
              },
              {
                header: 'Quantity Delta',
                accessor: (row: IStockMovement) => (
                  <span className={`font-mono font-bold ${row.quantity > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {row.quantity > 0 ? '+' : ''}{row.quantity}
                  </span>
                )
              },
              {
                header: 'Adjustment Type',
                accessor: (row: IStockMovement) => (
                  <Badge variant={
                    ['purchase', 'refund_restock', 'cancellation_restock'].includes(row.type) ? 'success' :
                    row.type === 'consumption' ? 'muted' : 'danger'
                  }>
                    {row.type.replace('_', ' ')}
                  </Badge>
                )
              },
              {
                header: 'Audit Reason',
                accessor: (row: IStockMovement) => <span className="text-slate-400 font-semibold">{row.reason}</span>
              },
              {
                header: 'Performed By',
                accessor: (row: IStockMovement) => <span className="text-slate-500 font-semibold">{row.submittedByName}</span>
              }
            ]}
          />
        </Card>
      )}

      {/* Suppliers tab */}
      {activeTab === 'suppliers' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Registered Supplier Matrix</h3>
            <Button onClick={handleOpenAddSupplier} className="text-xs font-bold py-1.5 px-3">
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span>Add Supplier</span>
            </Button>
          </div>

          {suppliers.length === 0 ? (
            <Card className="p-8 text-center border border-dashed border-slate-850 rounded-2xl bg-slate-900/10">
              <AlertTriangle className="w-10 h-10 text-slate-700 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-450">No suppliers logged.</p>
            </Card>
          ) : (
            <Card className="p-0 overflow-hidden border-slate-850">
              <Table
                keyExtractor={(row: ISupplier) => row.id}
                data={suppliers}
                columns={[
                  {
                    header: 'Supplier Name',
                    accessor: (row: ISupplier) => <span className="font-bold text-textPearl text-sm">{row.name}</span>
                  },
                  {
                    header: 'Contact Details',
                    accessor: (row: ISupplier) => (
                      <div className="space-y-0.5">
                        <span className="text-slate-350 font-semibold block">{row.phone}</span>
                        <span className="text-[10px] text-slate-550 block font-semibold">{row.email}</span>
                      </div>
                    )
                  },
                  {
                    header: 'Delivery Speed',
                    accessor: (row: ISupplier) => (
                      <span className="text-slate-350 font-semibold">{row.deliveryTimeDays} working days</span>
                    )
                  },
                  {
                    header: 'Supplier Rating',
                    accessor: (row: ISupplier) => (
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star key={star} className={`w-3.5 h-3.5 ${star <= row.rating ? 'text-amber-500 fill-current' : 'text-slate-700'}`} />
                        ))}
                      </div>
                    )
                  },
                  {
                    header: 'Actions',
                    accessor: (row: ISupplier) => (
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEditSupplier(row)}
                          className="p-1 text-slate-400 hover:text-primary hover:bg-slate-800/50"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDeleteSupplier(row.id)}
                          className="p-1 text-slate-450 hover:text-red-500 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )
                  }
                ]}
              />
            </Card>
          )}
        </div>
      )}

      {/* Low Stock tab */}
      {activeTab === 'lowstock' && (
        <Card className="p-0 overflow-hidden border-slate-850">
          <Table
            keyExtractor={(row: IStockIngredient) => row.id}
            data={ingredients.filter(i => i.status === 'low' || i.status === 'critical' || i.status === 'out_of_stock')}
            columns={[
              {
                header: 'Ingredient Details',
                accessor: (row: IStockIngredient) => (
                  <div>
                    <span className="font-bold text-textPearl">{row.name}</span>
                    <Badge variant="muted" className="mt-0.5 ml-0">{row.category}</Badge>
                  </div>
                )
              },
              {
                header: 'Current Stock level',
                accessor: (row: IStockIngredient) => (
                  <strong className="font-mono text-amber-500 font-extrabold">{row.currentStock} {row.unit}</strong>
                )
              },
              {
                header: 'Safety Min Limit',
                accessor: (row: IStockIngredient) => <span className="text-slate-400 font-semibold">{row.minimumStock} {row.unit}</span>
              },
              {
                header: 'Stock Warning State',
                accessor: (row: IStockIngredient) => (
                  <Badge variant={row.status === 'out_of_stock' ? 'danger' : 'warning'}>
                    {row.status.replace('_', ' ')}
                  </Badge>
                )
              },
              {
                header: 'Contact Supplier',
                accessor: (row: IStockIngredient) => <span className="text-slate-400 font-semibold">{row.supplierName}</span>
              }
            ]}
          />
        </Card>
      )}

      {/* Expiry Tab */}
      {activeTab === 'expiry' && (
        <Card className="p-0 overflow-hidden border-slate-850">
          <Table
            keyExtractor={(row: IStockIngredient) => row.id}
            data={ingredients.filter(i => i.expiryDate)}
            columns={[
              {
                header: 'Ingredient Name',
                accessor: (row: IStockIngredient) => <span className="font-bold text-textPearl">{row.name}</span>
              },
              {
                header: 'Expiration Date',
                accessor: (row: IStockIngredient) => {
                  const todayStr = new Date().toISOString().split('T')[0];
                  const expired = row.expiryDate < todayStr;
                  return (
                    <span className={`font-semibold ${expired ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                      {new Date(row.expiryDate).toLocaleDateString()}
                    </span>
                  );
                }
              },
              {
                header: 'Expirations Health Status',
                accessor: (row: IStockIngredient) => {
                  const todayStr = new Date().toISOString().split('T')[0];
                  const expired = row.expiryDate < todayStr;
                  return (
                    <Badge variant={expired ? 'danger' : 'success'}>
                      {expired ? 'EXPIRED' : 'HEALTHY'}
                    </Badge>
                  );
                }
              },
              {
                header: 'Storage Area',
                accessor: (row: IStockIngredient) => <span className="text-slate-450 font-semibold">{row.storageLocation}</span>
              }
            ]}
          />
        </Card>
      )}

      {/* Waste Logs Tab */}
      {activeTab === 'waste' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kitchen Waste Loss Log</h3>
            <Button onClick={handleOpenWaste} className="text-xs font-bold py-1.5 px-3 bg-red-600 hover:bg-red-700 text-white">
              <Trash className="w-3.5 h-3.5 mr-1" />
              <span>Record Waste Document</span>
            </Button>
          </div>

          {wasteLogs.length === 0 ? (
            <p className="text-xs text-slate-550 font-bold uppercase text-center py-8">No waste records logged.</p>
          ) : (
            <Card className="p-0 overflow-hidden border-slate-850">
              <Table
                keyExtractor={(row: IWasteLog) => row.id}
                data={wasteLogs}
                columns={[
                  {
                    header: 'Timestamp',
                    accessor: (row: IWasteLog) => (
                      <span className="text-slate-450 font-mono text-[10px]">
                        {new Date(row.timestamp).toLocaleString()}
                      </span>
                    )
                  },
                  {
                    header: 'Wasted item',
                    accessor: (row: IWasteLog) => <span className="font-bold text-textPearl">{row.ingredientName}</span>
                  },
                  {
                    header: 'Quantity Loss',
                    accessor: (row: IWasteLog) => (
                      <span className="text-slate-300 font-semibold">{row.quantity} {row.unit}</span>
                    )
                  },
                  {
                    header: 'Loss Value',
                    accessor: (row: IWasteLog) => (
                      <strong className="text-red-500 font-mono font-extrabold">{formatPrice(row.valueLost)}</strong>
                    )
                  },
                  {
                    header: 'Waste Reason',
                    accessor: (row: IWasteLog) => (
                      <Badge variant="danger" className="scale-90 origin-left">
                        {row.reason.replace('_', ' ')}
                      </Badge>
                    )
                  },
                  {
                    header: 'Wasted By',
                    accessor: (row: IWasteLog) => <span className="text-slate-500 font-semibold">{row.submittedByName}</span>
                  }
                ]}
              />
            </Card>
          )}
        </div>
      )}

      {/* Suggestions tab */}
      {activeTab === 'suggestions' && (
        <div className="space-y-6">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Replenishment Suggestions</h3>
          {suggestions.length === 0 ? (
            <p className="text-xs text-slate-500 font-semibold py-8 text-center bg-slate-900/10 border border-slate-850 rounded-2xl">
              All stock replenishment levels are healthy. No active purchase suggestions.
            </p>
          ) : (
            <Card className="p-0 overflow-hidden border-slate-850">
              <Table
                keyExtractor={(row: IPurchaseSuggestion) => row.id}
                data={suggestions}
                columns={[
                  {
                    header: 'Replenishment Ingredient',
                    accessor: (row: IPurchaseSuggestion) => <span className="font-bold text-textPearl">{row.ingredientName}</span>
                  },
                  {
                    header: 'Recommended Order Qty',
                    accessor: (row: IPurchaseSuggestion) => (
                      <strong className="font-mono text-primary font-extrabold">{row.recommendedQuantity} {row.unit}</strong>
                    )
                  },
                  {
                    header: 'Preferred Supplier',
                    accessor: (row: IPurchaseSuggestion) => <span className="text-slate-400 font-semibold">{row.supplierName}</span>
                  },
                  {
                    header: 'Est. Replenish Cost',
                    accessor: (row: IPurchaseSuggestion) => (
                      <span className="font-mono text-emerald-500 font-bold">{formatPrice(row.estimatedCost)}</span>
                    )
                  },
                  {
                    header: 'Purchase Priority',
                    accessor: (row: IPurchaseSuggestion) => (
                      <Badge variant={row.priority === 'critical' ? 'danger' : 'warning'}>
                        {row.priority.toUpperCase()}
                      </Badge>
                    )
                  },
                  {
                    header: 'Actions',
                    accessor: (row: IPurchaseSuggestion) => (
                      <div className="flex items-center space-x-2">
                        {row.status === 'pending' ? (
                          <Button
                            size="sm"
                            onClick={() => handleMarkSuggestionOrdered(row.id)}
                            className="text-[10px] font-bold py-1 px-2.5 bg-slate-800 border border-slate-750 text-slate-300 hover:text-textPearl"
                          >
                            Mark Ordered
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleCompleteSuggestion(row)}
                            className="text-[10px] font-bold py-1 px-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-background"
                          >
                            Receive Stock
                          </Button>
                        )}
                      </div>
                    )
                  }
                ]}
              />
            </Card>
          )}
        </div>
      )}

      {/* FORM MODAL FOR INGREDIENTS */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingIngredient ? 'Edit Master Ingredient' : 'Register Ingredient Master'}
      >
        <form onSubmit={handleSubmitIngredient} className="space-y-4 text-left select-none text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-slate-500 uppercase block">Ingredient Name</label>
              <input
                type="text"
                placeholder="E.g. Boneless Chicken"
                value={ingName}
                onChange={(e) => setIngName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-850 focus:border-primary rounded-xl p-3 text-xs font-semibold text-textPearl outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-500 uppercase block">Category</label>
              <select
                value={ingCategory}
                onChange={(e: any) => setIngCategory(e.target.value)}
                className="w-full bg-slate-900 border border-slate-850 focus:border-primary rounded-xl p-3 text-xs font-semibold text-textPearl outline-none"
              >
                {categories.filter(c => c.value !== 'all').map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-slate-500 uppercase block">Current stock qty</label>
              <input
                type="number"
                step="0.01"
                placeholder="10"
                value={ingCurrentStock}
                onChange={(e) => setIngCurrentStock(e.target.value)}
                className="w-full bg-slate-900 border border-slate-850 focus:border-primary rounded-xl p-3 text-xs font-semibold text-textPearl outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-500 uppercase block">Safety Min Level</label>
              <input
                type="number"
                step="0.01"
                placeholder="5"
                value={ingMinStock}
                onChange={(e) => setIngMinStock(e.target.value)}
                className="w-full bg-slate-900 border border-slate-850 focus:border-primary rounded-xl p-3 text-xs font-semibold text-textPearl outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-500 uppercase block">Safety Max level</label>
              <input
                type="number"
                step="0.01"
                placeholder="50"
                value={ingMaxStock}
                onChange={(e) => setIngMaxStock(e.target.value)}
                className="w-full bg-slate-900 border border-slate-850 focus:border-primary rounded-xl p-3 text-xs font-semibold text-textPearl outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-slate-500 uppercase block">Reorder Level Threshold</label>
              <input
                type="number"
                step="0.01"
                placeholder="10"
                value={ingReorderLevel}
                onChange={(e) => setIngReorderLevel(e.target.value)}
                className="w-full bg-slate-900 border border-slate-850 focus:border-primary rounded-xl p-3 text-xs font-semibold text-textPearl outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-500 uppercase block">Measurement Unit</label>
              <select
                value={ingUnit}
                onChange={(e: any) => setIngUnit(e.target.value)}
                className="w-full bg-slate-900 border border-slate-850 focus:border-primary rounded-xl p-3 text-xs font-semibold text-textPearl outline-none"
              >
                {['kg', 'g', 'liters', 'ml', 'pieces', 'packs'].map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-500 uppercase block">Purchase Cost ($)</label>
              <input
                type="number"
                step="0.01"
                placeholder="1.50"
                value={ingPurchaseCost}
                onChange={(e) => setIngPurchaseCost(e.target.value)}
                className="w-full bg-slate-900 border border-slate-850 focus:border-primary rounded-xl p-3 text-xs font-semibold text-textPearl outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-slate-500 uppercase block">Supplier</label>
              <select
                value={ingSupplierId}
                onChange={(e) => setIngSupplierId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-850 focus:border-primary rounded-xl p-3 text-xs font-semibold text-textPearl outline-none"
              >
                <option value="">Select Supplier</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-500 uppercase block">Storage Location</label>
              <select
                value={ingStorageLocation}
                onChange={(e: any) => setIngStorageLocation(e.target.value)}
                className="w-full bg-slate-900 border border-slate-850 focus:border-primary rounded-xl p-3 text-xs font-semibold text-textPearl outline-none"
              >
                {['Fridge', 'Freezer', 'Pantry', 'Dry Storage', 'Bar', 'Kitchen Shelf'].map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-500 uppercase block">Expiry Date</label>
              <input
                type="date"
                value={ingExpiryDate}
                onChange={(e) => setIngExpiryDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-850 focus:border-primary rounded-xl p-3 text-xs font-semibold text-textPearl outline-none"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3 pt-4 border-t border-slate-800/40 mt-4">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => setIsFormOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-primary to-amber-600 hover:from-primary-hover hover:to-amber-700 text-background"
              isLoading={isSubmitting}
            >
              {editingIngredient ? 'Save Changes' : 'Register Ingredient'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* RECIPE CONFIGURATION MODAL */}
      <Modal
        isOpen={isRecipeModalOpen}
        onClose={() => setIsRecipeModalOpen(false)}
        title={`Map Recipe: ${selectedRecipeItem?.name}`}
      >
        <div className="space-y-4 text-left select-none text-xs">
          <div className="grid grid-cols-3 gap-3.5">
            <div className="space-y-1">
              <label className="font-bold text-slate-500 uppercase block">Yield Servings</label>
              <input
                type="number"
                value={recipeYield}
                onChange={(e) => setRecipeYield(e.target.value)}
                className="w-full bg-slate-900 border border-slate-850 focus:border-primary rounded-xl p-3 text-xs font-semibold text-textPearl outline-none font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-500 uppercase block">Waste Factor (%)</label>
              <input
                type="number"
                value={recipeWastePercent}
                onChange={(e) => setRecipeWastePercent(e.target.value)}
                className="w-full bg-slate-900 border border-slate-850 focus:border-primary rounded-xl p-3 text-xs font-semibold text-textPearl outline-none font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-500 uppercase block">Recipe Version</label>
              <input
                type="text"
                value={recipeVersion}
                onChange={(e) => setRecipeVersion(e.target.value)}
                className="w-full bg-slate-900 border border-slate-850 focus:border-primary rounded-xl p-3 text-xs font-semibold text-textPearl outline-none font-mono"
              />
            </div>
          </div>

          <div className="flex justify-between items-center pb-2 border-b border-slate-850">
            <span className="font-bold text-slate-400">Ingredient Proportions Mapping</span>
            <button
              onClick={handleAddIngredientRow}
              className="text-[10px] text-primary hover:text-primary-hover font-bold uppercase tracking-wider flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Ingredient row</span>
            </button>
          </div>

          {recipeIngredients.length === 0 ? (
            <p className="text-center py-6 text-slate-500">No ingredients mapped to this recipe. Click "Add Ingredient row" to connect elements.</p>
          ) : (
            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {recipeIngredients.map((row, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <div className="flex-1">
                    <select
                      value={row.ingredientId}
                      onChange={(e) => handleUpdateRecipeRow(idx, 'ingredientId', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-850 focus:border-primary rounded-xl p-3 text-xs font-semibold text-textPearl outline-none"
                    >
                      {ingredients.map(ing => (
                        <option key={ing.id} value={ing.id}>{ing.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-24">
                    <input
                      type="number"
                      placeholder="Qty"
                      value={row.quantity}
                      onChange={(e) => handleUpdateRecipeRow(idx, 'quantity', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-850 focus:border-primary rounded-xl p-3 text-xs font-semibold text-textPearl outline-none font-mono"
                    />
                  </div>
                  <span className="text-xs text-slate-500 font-bold w-12 truncate">{row.unit}</span>
                  <button
                    onClick={() => handleRemoveRecipeRow(idx)}
                    className="p-2 text-slate-500 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center space-x-3 pt-4 border-t border-slate-850 mt-4">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => setIsRecipeModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveRecipe}
              className="flex-1 bg-gradient-to-r from-primary to-amber-600 hover:from-primary-hover hover:to-amber-700 text-background"
              isLoading={isSubmitting}
            >
              Save Recipe Proportions
            </Button>
          </div>
        </div>
      </Modal>

      {/* WASTE RECORDING MODAL */}
      <Modal
        isOpen={isWasteModalOpen}
        onClose={() => setIsWasteModalOpen(false)}
        title="Record Stock Waste & Spoilage"
      >
        <form onSubmit={handleSubmitWaste} className="space-y-4 text-left select-none text-xs">
          <div className="space-y-1">
            <label className="font-bold text-slate-500 uppercase block">Select Ingredient</label>
            <select
              value={wasteIngId}
              onChange={(e) => setWasteIngId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-850 focus:border-primary rounded-xl p-3 text-xs font-semibold text-textPearl outline-none"
            >
              {ingredients.map(ing => (
                <option key={ing.id} value={ing.id}>{ing.name} ({ing.currentStock} {ing.unit} available)</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-slate-500 uppercase block">Waste Quantity</label>
              <input
                type="number"
                step="0.01"
                placeholder="2.5"
                value={wasteQty}
                onChange={(e) => setWasteQty(e.target.value)}
                className="w-full bg-slate-900 border border-slate-850 focus:border-primary rounded-xl p-3 text-xs font-semibold text-textPearl outline-none font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-500 uppercase block">Reason</label>
              <select
                value={wasteReason}
                onChange={(e: any) => setWasteReason(e.target.value)}
                className="w-full bg-slate-900 border border-slate-850 focus:border-primary rounded-xl p-3 text-xs font-semibold text-textPearl outline-none"
              >
                <option value="spoilage">Spoilage</option>
                <option value="expired">Expired Stock</option>
                <option value="damaged">Damaged Stock</option>
                <option value="staff_mistake">Staff Mistake</option>
                <option value="customer_return">Customer Return</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-500 uppercase block">Notes</label>
            <textarea
              placeholder="Provide extra details on root cause..."
              value={wasteNote}
              onChange={(e) => setWasteNote(e.target.value)}
              className="w-full bg-slate-900 border border-slate-850 focus:border-primary rounded-xl p-3 text-xs font-semibold text-textPearl outline-none"
              rows={2}
            />
          </div>

          <div className="flex items-center space-x-3 pt-4 border-t border-slate-850 mt-4">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => setIsWasteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              isLoading={isSubmitting}
            >
              Log Waste Deduction
            </Button>
          </div>
        </form>
      </Modal>

      {/* SUPPLIER MODAL */}
      <Modal
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        title={editingSupplier ? 'Edit Supplier Details' : 'Register New Supplier'}
      >
        <form onSubmit={handleSubmitSupplier} className="space-y-4 text-left select-none text-xs">
          <div className="space-y-1">
            <label className="font-bold text-slate-500 uppercase block">Supplier Name</label>
            <input
              type="text"
              placeholder="E.g. Apex Meat Distribs"
              value={supName}
              onChange={(e) => setSupName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-850 focus:border-primary rounded-xl p-3 text-xs font-semibold text-textPearl outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-slate-500 uppercase block">Phone</label>
              <input
                type="text"
                placeholder="+1 555-0199"
                value={supPhone}
                onChange={(e) => setSupPhone(e.target.value)}
                className="w-full bg-slate-900 border border-slate-850 focus:border-primary rounded-xl p-3 text-xs font-semibold text-textPearl outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-500 uppercase block">Email</label>
              <input
                type="email"
                placeholder="orders@apexmeat.com"
                value={supEmail}
                onChange={(e) => setSupEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-850 focus:border-primary rounded-xl p-3 text-xs font-semibold text-textPearl outline-none font-mono"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-500 uppercase block">Supplier Address</label>
            <input
              type="text"
              placeholder="12 Logistics Way, Suite A"
              value={supAddress}
              onChange={(e) => setSupAddress(e.target.value)}
              className="w-full bg-slate-900 border border-slate-850 focus:border-primary rounded-xl p-3 text-xs font-semibold text-textPearl outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-slate-500 uppercase block">Delivery Turnaround (Days)</label>
              <input
                type="number"
                value={supDeliveryDays}
                onChange={(e) => setSupDeliveryDays(e.target.value)}
                className="w-full bg-slate-900 border border-slate-850 focus:border-primary rounded-xl p-3 text-xs font-semibold text-textPearl outline-none font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-500 uppercase block">Supplier Rating</label>
              <select
                value={supRating}
                onChange={(e) => setSupRating(e.target.value)}
                className="w-full bg-slate-900 border border-slate-850 focus:border-primary rounded-xl p-3 text-xs font-semibold text-textPearl outline-none"
              >
                {['1', '2', '3', '4', '5'].map(stars => (
                  <option key={stars} value={stars}>{stars} Stars</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-3 pt-4 border-t border-slate-850 mt-4">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => setIsSupplierModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-primary to-amber-600 hover:from-primary-hover hover:to-amber-700 text-background"
              isLoading={isSubmitting}
            >
              {editingSupplier ? 'Save Changes' : 'Register Supplier'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATIONS */}
      <Dialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Stock Document"
        message="Are you sure you want to delete this stock item? This will clear its registry levels history."
        confirmLabel="Delete"
        isDangerous={true}
      />

      <Dialog
        isOpen={isSupDeleteOpen}
        onClose={() => setIsSupDeleteOpen(false)}
        onConfirm={handleConfirmDeleteSupplier}
        title="Remove Supplier"
        message="Are you sure you want to delete this supplier listing? Ingredients mapped to this supplier will revert to direct purchases."
        confirmLabel="Delete"
        isDangerous={true}
      />
    </div>
  );
};

export default OwnerInventoryManager;
