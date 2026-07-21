import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import Card from '../../../components/ui/Card/Card';
import Badge from '../../../components/ui/Badge/Badge';
import LoadingSpinner from '../../../components/ui/LoadingSpinner/LoadingSpinner';
import { 
  Star, MapPin, Clock, Compass, Filter, Grid, Flame, 
  Sparkles, CheckCircle2, ChevronDown, Check, X, ShieldAlert, Search
} from 'lucide-react';

const REST_MOCK_IMAGES = [
  'https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=600&auto=format&fit=crop'
];

export const DiscoverPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // URL parameters
  const initialSearch = searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') || 'All';

  // State elements
  const [restaurantsList, setRestaurantsList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  
  // Filters state
  const [activeCuisine, setActiveCuisine] = useState('All');
  const [activePrice, setActivePrice] = useState('all');
  const [activeDistance, setActiveDistance] = useState<number>(5);
  const [showVegOnly, setShowVegOnly] = useState(false);
  const [showOpenNow, setShowOpenNow] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  
  const [facilities, setFacilities] = useState<Record<string, boolean>>({
    outdoorSeating: false,
    liveMusic: false,
    petFriendly: false,
    wheelchairAccess: false
  });

  // Pagination state
  const [visibleCount, setVisibleCount] = useState(6);

  // Fetch list of restaurants
  useEffect(() => {
    const loadRestaurants = async () => {
      setIsLoading(true);
      try {
        const snap = await getDocs(collection(db, 'tenants'));
        const list: any[] = [];
        let idx = 0;
        snap.forEach(d => {
          const data = d.data();
          list.push({
            id: d.id,
            name: data.restaurantName || data.name || 'Gourmet Bistro',
            cuisine: data.cuisine || 'Fine Dining',
            rating: data.rating || 4.7,
            distance: data.distanceNum || (0.4 + Math.random() * 3.5),
            priceRange: data.priceRange || (idx % 3 === 0 ? '$$$' : idx % 3 === 1 ? '$$' : '$'),
            vegOptions: data.vegOptions !== undefined ? data.vegOptions : true,
            openNow: data.status === 'active',
            image: data.coverImage || REST_MOCK_IMAGES[idx % REST_MOCK_IMAGES.length],
            isFeatured: idx % 3 === 0,
            isTrending: idx % 2 === 0,
            facilities: data.facilities || {
              outdoorSeating: idx % 2 === 0,
              liveMusic: idx % 3 === 0,
              petFriendly: idx % 2 !== 0,
              wheelchairAccess: true
            }
          });
          idx++;
        });

        // Mock fallback if Firestore collection is empty
        if (list.length === 0) {
          setRestaurantsList([
            { id: 'l-ambroisie', name: "L'Ambroisie", cuisine: "French Haute Cuisine", rating: 4.9, distance: 0.6, priceRange: '$$$', vegOptions: true, openNow: true, image: REST_MOCK_IMAGES[0], isFeatured: true, isTrending: true, facilities: { outdoorSeating: true, liveMusic: false, petFriendly: false, wheelchairAccess: true } },
            { id: 'shuko', name: "Shuko Sushi", cuisine: "Premium Japanese Omakase", rating: 4.8, distance: 1.2, priceRange: '$$$', vegOptions: false, openNow: true, image: REST_MOCK_IMAGES[3], isFeatured: false, isTrending: true, facilities: { outdoorSeating: false, liveMusic: true, petFriendly: true, wheelchairAccess: true } },
            { id: 'osteria', name: "Osteria Francescana", cuisine: "Italian Fine Dining", rating: 4.9, distance: 2.0, priceRange: '$$', vegOptions: true, openNow: true, image: REST_MOCK_IMAGES[1], isFeatured: true, isTrending: false, facilities: { outdoorSeating: true, liveMusic: true, petFriendly: false, wheelchairAccess: true } },
            { id: 'eleven-madison', name: "Eleven Madison", cuisine: "Contemporary American", rating: 4.7, distance: 1.5, priceRange: '$$$', vegOptions: true, openNow: false, image: REST_MOCK_IMAGES[2], isFeatured: false, isTrending: false, facilities: { outdoorSeating: false, liveMusic: false, petFriendly: true, wheelchairAccess: true } }
          ]);
        } else {
          setRestaurantsList(list);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    loadRestaurants();
  }, []);

  const toggleFacility = (key: string) => {
    setFacilities(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Safe fallback guards
  const restaurants = restaurantsList ?? [];
  
  const categories = useMemo(() => {
    return ['All', 'Fine Dining', 'Casual Eat', 'Sushi Bar', 'Cafeteria', 'Dessert'];
  }, []);

  const cuisineFilters = useMemo(() => {
    return ['All', 'French', 'Japanese', 'Italian', 'American'];
  }, []);

  // Filtered lists computation
  const processedRestaurants = useMemo(() => {
    let result = [...restaurants];

    // Category filter
    if (activeCategory !== 'All') {
      result = result.filter(r => r.cuisine.toLowerCase().includes(activeCategory.toLowerCase()));
    }

    // Cuisine filter
    if (activeCuisine !== 'All') {
      result = result.filter(r => r.cuisine.toLowerCase().includes(activeCuisine.toLowerCase()));
    }

    // Search query matching
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r => 
        r.name.toLowerCase().includes(q) || 
        r.cuisine.toLowerCase().includes(q)
      );
    }

    // Price range
    if (activePrice !== 'all') {
      result = result.filter(r => r.priceRange === activePrice);
    }

    // Distance
    result = result.filter(r => r.distance <= activeDistance);

    // Veg Only
    if (showVegOnly) {
      result = result.filter(r => r.vegOptions);
    }

    // Open Now
    if (showOpenNow) {
      result = result.filter(r => r.openNow);
    }

    // Facilities
    Object.keys(facilities).forEach(key => {
      if (facilities[key]) {
        result = result.filter(r => r.facilities && r.facilities[key]);
      }
    });

    return result;
  }, [restaurants, activeCategory, activeCuisine, searchQuery, activePrice, activeDistance, showVegOnly, showOpenNow, facilities]);

  // Featured restaurants list
  const featuredRestaurants = useMemo(() => {
    return processedRestaurants.filter(r => r.isFeatured);
  }, [processedRestaurants]);

  // Nearby restaurants list
  const nearbyRestaurants = useMemo(() => {
    return processedRestaurants.filter(r => r.distance <= 1.5);
  }, [processedRestaurants]);

  // Trending restaurants list
  const trendingRestaurants = useMemo(() => {
    return processedRestaurants.filter(r => r.isTrending || r.rating >= 4.8);
  }, [processedRestaurants]);

  return (
    <div className="space-y-8 text-left max-w-6xl mx-auto select-none relative pb-16">
      
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-display font-extrabold text-white flex items-center gap-2">
            Explore Culinary Masters <Sparkles className="w-6 h-6 text-primary animate-pulse" />
          </h2>
          <p className="text-xs text-slate-400 font-medium">Browse verified tables and gourmet details.</p>
        </div>

        {/* Search & Filter Trigger bar */}
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search by cuisine..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9.5 pr-4 py-2.5 bg-slate-900 border border-slate-850 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-primary/40 transition-all shadow-inner"
            />
          </div>

          <button
            onClick={() => setIsFilterDrawerOpen(true)}
            className="px-4 py-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-bold text-slate-350 hover:text-white rounded-xl transition-all flex items-center gap-1.5 shadow"
          >
            <Filter className="w-4 h-4 text-primary" /> Filter
          </button>
        </div>
      </div>

      {/* 2. Restaurant Categories (Horizontal scroll) */}
      <div className="space-y-3">
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-500">Categories</h3>
        <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border shrink-0 ${
                activeCategory === cat
                  ? 'bg-primary/10 border-primary text-primary shadow-sm shadow-primary/5'
                  : 'bg-slate-900/50 border-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Featured Restaurants */}
      {featuredRestaurants.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-500 flex items-center gap-1">
            <Sparkles className="w-4 h-4 text-primary" /> Featured Culinary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredRestaurants.slice(0, 3).map(r => (
              <Card 
                key={r.id}
                onClick={() => navigate(`/customer/restaurant/${r.id}`)}
                className="group bg-slate-900/20 border-slate-850 hover:border-slate-800 rounded-2xl overflow-hidden cursor-pointer transition-all flex flex-col justify-between shadow-lg"
              >
                <div className="h-32 w-full overflow-hidden relative">
                  <img src={r.image} alt={r.name} className="h-full w-full object-cover group-hover:scale-103 transition-transform" />
                  <span className="absolute top-2 right-2 bg-primary text-slate-950 text-[8.5px] uppercase font-extrabold py-0.5 px-2 rounded-lg">Featured</span>
                </div>
                <div className="p-4 space-y-1">
                  <h4 className="text-xs font-extrabold text-white group-hover:text-primary transition-colors">{r.name}</h4>
                  <div className="flex justify-between items-center text-[9px] text-slate-450 pt-2 border-t border-slate-900">
                    <span>{r.cuisine}</span>
                    <span className="flex items-center gap-0.5"><Star className="w-3 h-3 text-primary fill-current" /> {r.rating}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 4. Nearby Restaurants */}
      {nearbyRestaurants.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-500 flex items-center gap-1">
            <MapPin className="w-4 h-4 text-primary" /> Nearby Venues
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {nearbyRestaurants.slice(0, 3).map(r => (
              <Card 
                key={r.id}
                onClick={() => navigate(`/customer/restaurant/${r.id}`)}
                className="group bg-slate-900/20 border-slate-850 hover:border-slate-800 rounded-2xl overflow-hidden cursor-pointer transition-all flex flex-col justify-between shadow-lg"
              >
                <div className="h-32 w-full overflow-hidden relative">
                  <img src={r.image} alt={r.name} className="h-full w-full object-cover group-hover:scale-103 transition-transform" />
                </div>
                <div className="p-4 space-y-1">
                  <h4 className="text-xs font-extrabold text-white group-hover:text-primary transition-colors">{r.name}</h4>
                  <div className="flex justify-between items-center text-[9px] text-slate-455 pt-2 border-t border-slate-900">
                    <span>{r.distance.toFixed(1)} mi away</span>
                    <span className="flex items-center gap-0.5"><Star className="w-3 h-3 text-primary fill-current" /> {r.rating}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 5. Trending Restaurants */}
      {trendingRestaurants.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-500 flex items-center gap-1">
            <Flame className="w-4 h-4 text-primary animate-pulse" /> Trending Now
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {trendingRestaurants.slice(0, 3).map(r => (
              <Card 
                key={r.id}
                onClick={() => navigate(`/customer/restaurant/${r.id}`)}
                className="group bg-slate-900/20 border-slate-850 hover:border-slate-800 rounded-2xl overflow-hidden cursor-pointer transition-all flex flex-col justify-between shadow-lg"
              >
                <div className="h-32 w-full overflow-hidden relative">
                  <img src={r.image} alt={r.name} className="h-full w-full object-cover group-hover:scale-103 transition-transform" />
                </div>
                <div className="p-4 space-y-1">
                  <h4 className="text-xs font-extrabold text-white group-hover:text-primary transition-colors">{r.name}</h4>
                  <div className="flex justify-between items-center text-[9px] text-slate-455 pt-2 border-t border-slate-900">
                    <span>{r.cuisine}</span>
                    <span className="flex items-center gap-0.5"><Star className="w-3 h-3 text-primary fill-current font-extrabold" /> {r.rating}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 6. Cuisine Filters */}
      <div className="space-y-3">
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-500">Cuisine Filters</h3>
        <div className="flex flex-wrap gap-2">
          {cuisineFilters.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCuisine(c)}
              className={`px-3.5 py-1.5 rounded-xl border text-[10px] font-extrabold transition-all ${
                activeCuisine === c
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'bg-slate-900/50 border-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* 7. Core Restaurants Grid Results */}
      <div className="space-y-4">
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-500">All Dining Registry</h3>
        
        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <LoadingSpinner label="Opening registry ledger..." />
          </div>
        ) : processedRestaurants.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/20 border border-slate-900 rounded-2xl space-y-4">
            <ShieldAlert className="w-10 h-10 text-slate-700 mx-auto" />
            <div>
              <h4 className="text-xs font-extrabold text-white">No Matching Results Found</h4>
              <p className="text-[10px] text-slate-500 mt-1">Try resetting filter drawer attributes.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {processedRestaurants.slice(0, visibleCount).map((r) => (
              <Card 
                key={r.id} 
                onClick={() => navigate(`/customer/restaurant/${r.id}`)}
                className="group bg-slate-900/20 border-slate-850 hover:border-slate-800 rounded-2xl overflow-hidden cursor-pointer transition-all flex flex-col justify-between shadow-lg"
              >
                <div className="h-36 w-full overflow-hidden relative">
                  <img src={r.image} alt={r.name} className="h-full w-full object-cover group-hover:scale-103 transition-transform" />
                  <div className="absolute top-2.5 right-2.5 bg-slate-950/80 backdrop-blur-md px-2 py-0.5 rounded-lg border border-slate-800 text-[9px] text-slate-350 flex items-center gap-0.5 font-bold">
                    <Star className="w-2.5 h-2.5 text-primary fill-current" /> {r.rating}
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-extrabold text-white group-hover:text-primary transition-colors truncate">{r.name}</h4>
                    <p className="text-[10px] text-slate-500 font-semibold">{r.cuisine}</p>
                  </div>
                  <div className="flex justify-between items-center text-[9px] text-slate-455 pt-2 border-t border-slate-900">
                    <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3 text-slate-500" /> {r.distance.toFixed(1)} mi</span>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[8px] bg-slate-950 px-1 py-0.5 border border-slate-900 rounded font-bold">{r.priceRange}</span>
                      {r.openNow ? (
                        <Badge variant="success" className="text-[7.5px] uppercase py-0.5 px-1 font-bold border-0">Open</Badge>
                      ) : (
                        <Badge variant="muted" className="text-[7.5px] uppercase py-0.5 px-1 font-bold border-0">Closed</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* 8. Load More Button */}
        {!isLoading && processedRestaurants.length > visibleCount && (
          <div className="text-center pt-6">
            <button
              onClick={() => setVisibleCount(c => c + 6)}
              className="px-6 py-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-xs font-bold text-slate-350 hover:text-white rounded-2xl transition-all shadow"
            >
              Load More Restaurants
            </button>
          </div>
        )}
      </div>

      {/* 9. SORT & FILTER SIDEBAR DRAWER OVERLAY */}
      {isFilterDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setIsFilterDrawerOpen(false)} />
          <div className="relative w-80 max-w-full bg-slate-900 border-l border-slate-850 h-full p-6 flex flex-col justify-between shadow-2xl z-10 text-xs">
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-2 border-b border-slate-850">
                <span className="text-[10px] text-slate-450 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-primary" /> Filter Options
                </span>
                <button onClick={() => setIsFilterDrawerOpen(false)} className="p-1 hover:bg-slate-950 rounded-lg text-slate-450">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Price selector */}
              <div className="space-y-2">
                <label className="text-[10.5px] text-slate-450 font-bold uppercase block">Price Range</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {['all', '$', '$$', '$$$'].map((pr) => (
                    <button
                      key={pr}
                      type="button"
                      onClick={() => setActivePrice(pr)}
                      className={`py-1.5 border text-[10px] font-extrabold rounded-xl transition-all text-center uppercase ${
                        activePrice === pr ? 'bg-primary/10 border-primary text-primary' : 'bg-slate-950 border-slate-850 text-slate-400'
                      }`}
                    >
                      {pr}
                    </button>
                  ))}
                </div>
              </div>

              {/* Distance radius */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10.5px] text-slate-450 font-bold">
                  <span>Distance Limit</span>
                  <span className="text-primary">{activeDistance} miles</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  value={activeDistance}
                  onChange={(e) => setActiveDistance(Number(e.target.value))}
                  className="w-full accent-primary bg-slate-950 rounded-lg cursor-pointer border border-slate-850"
                />
              </div>

              {/* Dietary selector */}
              <div className="space-y-2">
                <label className="text-[10.5px] text-slate-450 font-bold uppercase block">Dietary Status</label>
                <div className="space-y-2 font-semibold text-slate-350">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={showVegOnly} 
                      onChange={(e) => setShowVegOnly(e.target.checked)}
                      className="rounded bg-slate-950 border-slate-850 text-primary focus:ring-0 focus:ring-offset-0" 
                    />
                    <span className="text-[10.5px]">Vegetarian Options</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={showOpenNow} 
                      onChange={(e) => setShowOpenNow(e.target.checked)}
                      className="rounded bg-slate-950 border-slate-850 text-primary focus:ring-0 focus:ring-offset-0" 
                    />
                    <span className="text-[10.5px]">Open Now Only</span>
                  </label>
                </div>
              </div>

              {/* Amenities checklist */}
              <div className="space-y-2">
                <label className="text-[10.5px] text-slate-450 font-bold uppercase block">Amenities & Vibe</label>
                <div className="space-y-2 font-semibold text-slate-350">
                  {[
                    { key: 'outdoorSeating', label: 'Outdoor Seating' },
                    { key: 'liveMusic', label: 'Live Music' },
                    { key: 'petFriendly', label: 'Pet Friendly' },
                    { key: 'wheelchairAccess', label: 'Wheelchair Access' }
                  ].map((f) => (
                    <label key={f.key} className="flex items-center space-x-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={facilities[f.key]} 
                        onChange={() => toggleFacility(f.key)}
                        className="rounded bg-slate-950 border-slate-850 text-primary focus:ring-0 focus:ring-offset-0" 
                      />
                      <span className="text-[10.5px]">{f.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <Button
              onClick={() => setIsFilterDrawerOpen(false)}
              className="w-full bg-primary text-slate-950 font-bold py-3.5 rounded-xl text-xs"
            >
              Apply Filter Parameters
            </Button>
          </div>
        </div>
      )}

    </div>
  );
};

export default DiscoverPage;
