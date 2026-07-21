import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { ITenant } from '../../../types';
import Card from '../../../components/ui/Card/Card';
import Badge from '../../../components/ui/Badge/Badge';
import SearchBar from '../../../components/ui/SearchBar/SearchBar';
import LoadingSpinner from '../../../components/ui/LoadingSpinner/LoadingSpinner';
import { 
  Star, MapPin, Clock, Compass, Filter, Grid, Flame, 
  Sparkles, CheckCircle2, ChevronDown, Check, X, ShieldAlert 
} from 'lucide-react';

const REST_MOCK_IMAGES = [
  'https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=600&auto=format&fit=crop'
];

export const RestaurantDiscovery: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // URL Param integrations
  const initialSearch = searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') || 'All';

  // Data state
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search, Filter, Sort state
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [activeCuisine, setActiveCuisine] = useState(initialCategory);
  const [activePrice, setActivePrice] = useState<string>('all');
  const [activeDistance, setActiveDistance] = useState<number>(5); // max 5 miles
  const [sortBy, setSortBy] = useState<string>('rating'); // rating, distance, prepTime
  const [showVegOnly, setShowVegOnly] = useState(false);
  const [showOpenNow, setShowOpenNow] = useState(false);
  
  // Facilities filters
  const [facilities, setFacilities] = useState<Record<string, boolean>>({
    outdoorSeating: false,
    liveMusic: false,
    petFriendly: false,
    wheelchairAccess: false
  });

  const toggleFacility = (key: string) => {
    setFacilities(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Fetch list of restaurants
  useEffect(() => {
    const fetchRestaurantsList = async () => {
      setIsLoading(true);
      try {
        const colSnap = await getDocs(collection(db, 'tenants'));
        const list: any[] = [];
        let index = 0;
        colSnap.forEach(d => {
          const data = d.data();
          list.push({
            id: d.id,
            name: data.restaurantName || data.name || 'Gourmet Bistro',
            cuisine: data.cuisine || 'Fine Dining',
            rating: data.rating || 4.7,
            distance: data.distanceNum || (0.4 + Math.random() * 3.5),
            priceRange: data.priceRange || (index % 3 === 0 ? '$$$' : index % 3 === 1 ? '$$' : '$'),
            vegOptions: data.vegOptions !== undefined ? data.vegOptions : true,
            openNow: data.status === 'active',
            image: data.coverImage || REST_MOCK_IMAGES[index % REST_MOCK_IMAGES.length],
            facilities: data.facilities || {
              outdoorSeating: index % 2 === 0,
              liveMusic: index % 3 === 0,
              petFriendly: index % 2 !== 0,
              wheelchairAccess: true
            }
          });
          index++;
        });

        // Mock items fallback if Firestore collections are unseeded
        if (list.length === 0) {
          setRestaurants([
            { id: 'l-ambroisie', name: "L'Ambroisie", cuisine: "French Haute Cuisine", rating: 4.9, distance: 0.6, priceRange: '$$$', vegOptions: true, openNow: true, image: REST_MOCK_IMAGES[0], facilities: { outdoorSeating: true, liveMusic: false, petFriendly: false, wheelchairAccess: true } },
            { id: 'shuko', name: "Shuko Sushi", cuisine: "Premium Japanese Omakase", rating: 4.8, distance: 1.2, priceRange: '$$$', vegOptions: false, openNow: true, image: REST_MOCK_IMAGES[3], facilities: { outdoorSeating: false, liveMusic: true, petFriendly: true, wheelchairAccess: true } },
            { id: 'osteria', name: "Osteria Francescana", cuisine: "Italian Fine Dining", rating: 4.9, distance: 2.0, priceRange: '$$', vegOptions: true, openNow: true, image: REST_MOCK_IMAGES[1], facilities: { outdoorSeating: true, liveMusic: true, petFriendly: false, wheelchairAccess: true } },
            { id: 'eleven-madison', name: "Eleven Madison", cuisine: "Contemporary American", rating: 4.7, distance: 1.5, priceRange: '$$$', vegOptions: true, openNow: false, image: REST_MOCK_IMAGES[2], facilities: { outdoorSeating: false, liveMusic: false, petFriendly: true, wheelchairAccess: true } }
          ]);
        } else {
          setRestaurants(list);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRestaurantsList();
  }, []);

  // Compute filtered & sorted lists in memory
  const filteredRestaurants = useMemo(() => {
    let result = [...restaurants];

    // 1. Text Search matching
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r => 
        r.name.toLowerCase().includes(q) || 
        r.cuisine.toLowerCase().includes(q)
      );
    }

    // 2. Cuisine filter
    if (activeCuisine !== 'All') {
      result = result.filter(r => r.cuisine.toLowerCase().includes(activeCuisine.toLowerCase()));
    }

    // 3. Price Range filter
    if (activePrice !== 'all') {
      result = result.filter(r => r.priceRange === activePrice);
    }

    // 4. Distance limit filter
    result = result.filter(r => r.distance <= activeDistance);

    // 5. Veg Options only
    if (showVegOnly) {
      result = result.filter(r => r.vegOptions);
    }

    // 6. Open Now only
    if (showOpenNow) {
      result = result.filter(r => r.openNow);
    }

    // 7. Facilities toggles
    Object.keys(facilities).forEach(key => {
      if (facilities[key]) {
        result = result.filter(r => r.facilities && r.facilities[key]);
      }
    });

    // 8. Sorting
    if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'distance') {
      result.sort((a, b) => a.distance - b.distance);
    }

    return result;
  }, [restaurants, searchQuery, activeCuisine, activePrice, activeDistance, sortBy, showVegOnly, showOpenNow, facilities]);

  return (
    <div className="space-y-6 text-left max-w-6xl mx-auto">
      
      {/* Search Header banner */}
      <div className="space-y-1">
        <h2 className="text-xl font-display font-extrabold text-white">Find Your Dining Space</h2>
        <p className="text-xs text-slate-400">Apply filters to find the perfect restaurant matching your occasion.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* LEFT COLUMN - FILTER BAR SHELF */}
        <div className="w-full lg:w-[260px] bg-slate-900/50 border border-slate-900/80 p-5 rounded-2xl space-y-5 backdrop-blur-md shrink-0">
          
          <div className="flex justify-between items-center pb-2 border-b border-slate-850">
            <span className="text-[10px] text-slate-450 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5" /> Advanced Filters
            </span>
            <button 
              onClick={() => {
                setActiveCuisine('All');
                setActivePrice('all');
                setActiveDistance(5);
                setShowVegOnly(false);
                setShowOpenNow(false);
                setFacilities({ outdoorSeating: false, liveMusic: false, petFriendly: false, wheelchairAccess: false });
              }}
              className="text-[9.5px] text-primary font-bold hover:underline cursor-pointer"
            >
              Reset
            </button>
          </div>

          {/* Cuisine Filters */}
          <div className="space-y-2">
            <label className="text-[10.5px] text-slate-400 font-bold block">Cuisine Category</label>
            <div className="flex flex-wrap gap-1.5">
              {['All', 'French', 'Japanese', 'Italian', 'American'].map((c) => (
                <button
                  key={c}
                  onClick={() => setActiveCuisine(c)}
                  className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold transition-all ${
                    activeCuisine === c
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-slate-950/40 border-slate-850 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Price Filters */}
          <div className="space-y-2">
            <label className="text-[10.5px] text-slate-400 font-bold block">Price range</label>
            <div className="grid grid-cols-4 gap-1.5">
              {['all', '$', '$$', '$$$'].map((pr) => (
                <button
                  key={pr}
                  onClick={() => setActivePrice(pr)}
                  className={`py-1.5 border text-[10px] font-extrabold rounded-xl transition-all text-center ${
                    activePrice === pr
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-slate-950/40 border-slate-850 text-slate-400'
                  }`}
                >
                  {pr.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Distance Filter Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10.5px] text-slate-450 font-bold">
              <span>Distance Radius</span>
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

          {/* Quick Dietary toggles */}
          <div className="space-y-2">
            <label className="text-[10.5px] text-slate-400 font-bold block">Dietary & Status</label>
            <div className="space-y-2 text-xs text-slate-350">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={showVegOnly} 
                  onChange={(e) => setShowVegOnly(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-850 text-primary" 
                />
                <span className="text-[10.5px]">Vegetarian Options</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={showOpenNow} 
                  onChange={(e) => setShowOpenNow(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-850 text-primary" 
                />
                <span className="text-[10.5px]">Open Now</span>
              </label>
            </div>
          </div>

          {/* Facilities filters */}
          <div className="space-y-2">
            <label className="text-[10.5px] text-slate-400 font-bold block">Amenities & Vibe</label>
            <div className="space-y-2 text-xs text-slate-350">
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
                    className="rounded bg-slate-950 border-slate-850 text-primary" 
                  />
                  <span className="text-[10.5px]">{f.label}</span>
                </label>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN - SEARCH BOX & RESTAURANTS GRID */}
        <div className="flex-1 space-y-5 w-full">
          
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search Input */}
            <div className="flex-1 w-full relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search restaurant names, cuisines, cities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10.5 pr-4 py-3 bg-slate-900/40 border border-slate-900/60 rounded-xl text-xs text-white focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all shadow-inner"
              />
            </div>
            
            {/* Sort Switcher */}
            <div className="flex items-center space-x-2 self-end md:self-auto">
              <span className="text-[10.5px] text-slate-500 font-bold uppercase whitespace-nowrap">Sort By</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-900 border border-slate-850 text-[10.5px] py-1.5 px-3 rounded-xl font-bold text-slate-300 focus:outline-none focus:border-primary/40 cursor-pointer"
              >
                <option value="rating">Top Rated ⭐</option>
                <option value="distance">Nearest 📍</option>
              </select>
            </div>
          </div>

          {/* Grid list results */}
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <LoadingSpinner label="Querying culinary registry..." />
            </div>
          ) : filteredRestaurants.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/20 border border-slate-900 rounded-2xl space-y-4">
              <ShieldAlert className="w-10 h-10 text-slate-700 mx-auto" />
              <div>
                <h4 className="text-sm font-extrabold text-slate-205">No Restaurants Match Filters</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">Try resetting some checkbox parameters or searching with a different cuisine tag.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRestaurants.map((r) => (
                <Card 
                  key={r.id} 
                  onClick={() => navigate(`/customer/restaurant/${r.id}`)}
                  className="group bg-slate-900/20 border-slate-850 hover:border-slate-850 rounded-2xl overflow-hidden cursor-pointer transition-all flex flex-col justify-between shadow-lg"
                >
                  <div className="h-36 w-full overflow-hidden relative">
                    <img src={r.image} alt={r.name} className="h-full w-full object-cover group-hover:scale-103 transition-all duration-300" />
                    <div className="absolute top-2.5 right-2.5 bg-slate-950/80 backdrop-blur-md px-2 py-0.5 rounded-lg border border-slate-800 text-[9px] text-slate-350 flex items-center gap-0.5 font-bold">
                      <Star className="w-2.5 h-2.5 text-primary fill-current" /> {r.rating}
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-extrabold text-white group-hover:text-primary transition-all truncate">{r.name}</h4>
                      <p className="text-[10px] text-slate-500 font-semibold">{r.cuisine}</p>
                    </div>
                    <div className="flex justify-between items-center text-[9px] text-slate-450 pt-2 border-t border-slate-900">
                      <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3 text-slate-500" /> {r.distance.toFixed(1)} mi</span>
                      <div className="flex space-x-1 items-center">
                        <span className="text-slate-450 uppercase font-extrabold text-[8px] bg-slate-950/40 py-0.5 px-1.5 rounded border border-slate-900">{r.priceRange}</span>
                        {r.openNow ? (
                          <Badge variant="success" className="text-[7.5px] uppercase font-bold py-0.5 px-1 border-0">Open</Badge>
                        ) : (
                          <Badge variant="muted" className="text-[7.5px] uppercase font-bold py-0.5 px-1 border-0">Closed</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default RestaurantDiscovery;
