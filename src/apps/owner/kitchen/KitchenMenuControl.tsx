import React, { useEffect, useState } from 'react';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  query 
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../context/AuthContext';
import { IMenuItem } from '../../../types';
import { formatPrice } from '../../../utils/format';

// UI Kit components
import Card from '../../../components/ui/Card/Card';
import Badge from '../../../components/ui/Badge/Badge';
import Switch from '../../../components/ui/Switch/Switch';
import SearchBar from '../../../components/ui/SearchBar/SearchBar';
import Select from '../../../components/ui/Select/Select';
import LoadingSpinner from '../../../components/ui/LoadingSpinner/LoadingSpinner';

// Hot Toast notifications
import toast from 'react-hot-toast';
import { AlertTriangle } from 'lucide-react';

export const KitchenMenuControl: React.FC = () => {
  const { user } = useAuth();
  
  const [menuItems, setMenuItems] = useState<IMenuItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<IMenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'Starters', label: 'Starters' },
    { value: 'Mains', label: 'Mains' },
    { value: 'Desserts', label: 'Desserts' },
    { value: 'Beverages', label: 'Beverages' }
  ];

  // Fetch all menu items from Firestore
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
      console.error(e);
      toast.error('Failed to load menu list.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, [user]);

  // Handle Search and Category Filters
  useEffect(() => {
    let filtered = [...menuItems];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(q) || 
        item.category.toLowerCase().includes(q)
      );
    }
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }
    setFilteredItems(filtered);
  }, [searchQuery, selectedCategory, menuItems]);

  // Toggle availability status in Firestore immediately
  const handleToggleAvailable = async (item: IMenuItem) => {
    if (!user?.tenantId) return;
    try {
      const docRef = doc(db, 'restaurants', user.tenantId, 'menu', item.id);
      const nextStatus = !item.available;
      
      await updateDoc(docRef, { available: nextStatus });
      toast.success(`${item.name} is now ${nextStatus ? 'Available' : 'Out of Stock'}`);
      
      // Update local state list
      setMenuItems(prev => 
        prev.map(i => i.id === item.id ? { ...i, available: nextStatus } : i)
      );
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to update item status.');
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header section */}
      <div>
        <h1 className="text-2xl font-display font-extrabold text-textPearl">Kitchen Stock Control</h1>
        <p className="text-xs text-mutedAsh font-semibold">Toggle dishes in/out of stock. Customers see changes instantly.</p>
      </div>

      {/* Query filters */}
      <Card className="p-4 border-slate-850 bg-slate-900/35">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <SearchBar 
              placeholder="Search dishes by name..." 
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

      {/* Stock list cards */}
      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <LoadingSpinner label="Fetching menu items..." />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-center border border-dashed border-slate-850 rounded-2xl bg-slate-900/10">
          <AlertTriangle className="w-8 h-8 text-slate-700 mb-2" />
          <p className="text-sm font-semibold text-slate-450">No items match your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <Card 
              key={item.id} 
              className={`p-4 border-slate-850 bg-slate-900/40 flex items-center justify-between space-x-4 transition-all duration-300 ${
                !item.available ? 'border-red-500/15 bg-red-500/5' : ''
              }`}
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center space-x-2">
                  <h3 className="font-display font-bold text-sm text-textPearl">{item.name}</h3>
                  {item.veg ? <Badge variant="success">Veg</Badge> : <Badge variant="danger">Non-Veg</Badge>}
                </div>
                <div className="text-xs font-semibold text-slate-450">{formatPrice(item.price)}</div>
                <Badge variant="muted" className="mt-1">{item.category}</Badge>
              </div>

              {/* Status Selector switcher */}
              <div className="shrink-0 flex flex-col items-end space-y-1.5">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${item.available ? 'text-emerald-500' : 'text-red-500'}`}>
                  {item.available ? 'In Stock' : 'Out of Stock'}
                </span>
                <Switch 
                  checked={item.available} 
                  onChange={() => handleToggleAvailable(item)} 
                  className="accent-primary"
                />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default KitchenMenuControl;
