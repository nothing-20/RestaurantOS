import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { ITenant } from '../../../types';
import { useAuth } from '../../../context/AuthContext';

// UI Kit components
import Card from '../../../components/ui/Card/Card';
import Badge from '../../../components/ui/Badge/Badge';
import SearchBar from '../../../components/ui/SearchBar/SearchBar';
import LoadingSpinner from '../../../components/ui/LoadingSpinner/LoadingSpinner';

// Icons
import { Star, MapPin, Clock, Utensils, LogOut } from 'lucide-react';

export const RestaurantDiscovery: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [restaurants, setRestaurants] = useState<ITenant[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<ITenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCuisine, setActiveCuisine] = useState('all');
  const [sortByRating, setSortByRating] = useState(false);

  const fetchRestaurants = async () => {
    setIsLoading(true);
    try {
      const colRef = collection(db, 'tenants');
      const querySnap = await getDocs(query(colRef));
      const list: ITenant[] = [];
      querySnap.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as ITenant);
      });
      setRestaurants(list);
      setFilteredRestaurants(list);
    } catch (e) {
      console.error('Failed to load restaurants', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  // Filter & Sort Logic
  useEffect(() => {
    let result = [...restaurants];

    // Search query matching
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          (r.restaurantName || r.name || '').toLowerCase().includes(q) ||
          (r.cuisine || '').toLowerCase().includes(q) ||
          (typeof r.address === 'string' ? r.address : r.address?.city || '').toLowerCase().includes(q)
      );
    }

    // Cuisine filter
    if (activeCuisine !== 'all') {
      result = result.filter((r) => (r.cuisine || '').toLowerCase().includes(activeCuisine.toLowerCase()));
    }

    // Sort by rating
    if (sortByRating) {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    setFilteredRestaurants(result);
  }, [searchQuery, activeCuisine, sortByRating, restaurants]);

  // Extract unique cuisines for filter bar
  const cuisineCategories = ['all'];
  restaurants.forEach((r) => {
    if (r.cuisine) {
      const parts = r.cuisine.split(/[&,]/).map((p) => p.trim());
      parts.forEach((p) => {
        const clean = p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
        if (clean && !cuisineCategories.includes(clean)) {
          cuisineCategories.push(clean);
        }
      });
    }
  });

  return (
    <div className="min-h-screen bg-slate-950 pb-16 text-left relative overflow-hidden select-none">
      {/* Background ambient accents */}
      <div className="absolute top-[-10%] left-[-15%] w-[600px] h-[600px] rounded-full bg-primary/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-[150px] pointer-events-none" />

      {/* TOP HEADER */}
      <header className="bg-slate-900/40 border-b border-slate-850/60 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center mx-auto shadow-lg shadow-primary/5">
              <span className="text-primary font-display font-extrabold text-xl">R</span>
            </div>
            <div>
              <h1 className="text-sm font-display font-extrabold text-textPearl tracking-wide uppercase">RestaurantOS</h1>
              <span className="text-[10px] text-mutedAsh font-semibold">Welcome, {user?.displayName || 'Diner'}</span>
            </div>
          </div>
          <button 
            onClick={logout}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-red-500/10 border border-slate-750 text-slate-400 hover:text-red-400 text-xs font-bold rounded-xl transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* BODY CONTENT */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6 relative z-10">
        <div className="space-y-1">
          <h2 className="text-2xl font-display font-extrabold text-textPearl">Discover Restaurants</h2>
          <p className="text-xs text-mutedAsh font-semibold">Select your favorite restaurant workspace to begin ordering.</p>
        </div>

        {/* SEARCH, SORT & CUISINE FILTERS */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <SearchBar 
                placeholder="Search by restaurant name, cuisine or address..."
                value={searchQuery}
                onSearchChange={setSearchQuery}
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSortByRating(!sortByRating)}
                className={`px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all select-none ${
                  sortByRating
                    ? 'bg-primary border-primary text-background'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-textPearl hover:bg-slate-850'
                }`}
              >
                <Star className="w-3.5 h-3.5" />
                <span>Sort by Rating</span>
              </button>
            </div>
          </div>

          {/* Cuisine Categories Scroll */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none select-none">
            {cuisineCategories.slice(0, 10).map((cuisine) => (
              <button
                key={cuisine}
                onClick={() => setActiveCuisine(cuisine.toLowerCase() === 'all' ? 'all' : cuisine)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-300 border ${
                  (activeCuisine === 'all' && cuisine.toLowerCase() === 'all') || (activeCuisine.toLowerCase() === cuisine.toLowerCase())
                    ? 'bg-primary border-primary text-background font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-textPearl hover:bg-slate-850'
                }`}
              >
                {cuisine.toUpperCase() === 'ALL' ? 'All Cuisines' : cuisine}
              </button>
            ))}
          </div>
        </div>

        {/* RESTAURANTS LIST GRID */}
        {isLoading ? (
          <div className="py-24 flex items-center justify-center">
            <LoadingSpinner label="Locating nearby restaurants..." />
          </div>
        ) : filteredRestaurants.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-slate-850 rounded-3xl bg-slate-900/10">
            <Utensils className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-textPearl mb-1">No restaurants available</h3>
            <p className="text-xs text-mutedAsh font-semibold">Try modifying your search or cuisine filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRestaurants.map((res) => {
              const isOpen = res.status === 'active' || res.status === 'trial';
              const rLogo = res.logo || res.logoUrl || 'https://picsum.photos/200/200?random=logo';
              const rCover = res.coverImage || 'https://picsum.photos/800/600?random=cover';
              const rName = res.restaurantName || res.name || 'Gourmet Restaurant';
              const rCuisine = res.cuisine || 'Fine Dining';
              const rRating = res.rating || 4.5;
              const rWait = res.waitingTime || '15-25 min';
              const rAddr = typeof res.address === 'string' ? res.address : `${res.address?.street}, ${res.address?.city}`;

              return (
                <Card 
                  key={res.id}
                  onClick={() => navigate(`/customer/restaurant/${res.id}`)}
                  className="group cursor-pointer border-slate-850 hover:border-primary/20 bg-slate-900/30 hover:bg-slate-900/60 transition-all duration-300 rounded-3xl overflow-hidden flex flex-col h-full relative"
                >
                  <div className="w-full h-48 relative overflow-hidden bg-slate-950">
                    <img 
                      src={rCover} 
                      alt={rName} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent opacity-60" />
                    
                    <div className="absolute top-4 right-4">
                      <Badge variant={isOpen ? 'success' : 'danger'}>
                        {isOpen ? 'Open Now' : 'Closed'}
                      </Badge>
                    </div>

                    <div className="absolute bottom-4 left-4 flex items-center space-x-1.5 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-xl text-[10px] font-bold text-textPearl border border-slate-800">
                      <Clock className="w-3.5 h-3.5 text-primary" />
                      <span>{rWait}</span>
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between space-x-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-11 h-11 rounded-2xl border border-slate-850 bg-slate-900 overflow-hidden shrink-0 flex items-center justify-center">
                            <img src={rLogo} alt={rName} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <h3 className="font-display font-extrabold text-base text-textPearl leading-tight">{rName}</h3>
                            <span className="text-[10px] text-primary font-bold uppercase tracking-wider">{rCuisine}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 px-2 py-0.5 rounded-lg text-xs font-bold">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span>{rRating.toFixed(1)}</span>
                        </div>
                      </div>

                      {res.description ? (
                        <p className="text-xs text-mutedAsh line-clamp-2 leading-relaxed font-medium">
                          {res.description}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex items-start space-x-1.5 text-[10px] text-slate-500 font-semibold pt-3 border-t border-slate-850/60">
                      <MapPin className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                      <span className="line-clamp-1">{rAddr}</span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default RestaurantDiscovery;
