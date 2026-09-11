import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import Card from '../../../components/ui/Card/Card';
import Badge from '../../../components/ui/Badge/Badge';
import Button from '../../../components/ui/Button/Button';
import LoadingSpinner from '../../../components/ui/LoadingSpinner/LoadingSpinner';
import { 
  Star, MapPin, Clock, Compass, Filter, Grid, Flame, 
  Sparkles, CheckCircle2, ChevronDown, Check, X, ShieldAlert, Search
} from 'lucide-react';

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
  const [activeDistance, setActiveDistance] = useState<number>(10);
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
        const snap = await getDocs(query(collection(db, 'tenants'), limit(50)));
        const list: any[] = [];
        snap.forEach(d => {
          const data = d.data();
          list.push({
            id: d.id,
            name: data.restaurantName || data.name || 'Restaurant',
            cuisine: data.cuisine || 'Multi-Cuisine',
            rating: typeof data.rating === 'number' ? data.rating : null,
            reviewsCount: typeof data.reviewsCount === 'number' ? data.reviewsCount : null,
            distance: typeof data.distanceNum === 'number' ? data.distanceNum : null,
            priceRange: data.priceRange || null,
            vegOptions: data.vegOptions !== undefined ? data.vegOptions : true,
            openNow: data.status === 'active',
            image: data.coverImageUrl || data.coverImage || data.logoUrl || data.logo || null,
            logoUrl: data.logoUrl || data.logo || null,
            city: data.address?.city || data.city || '',
            state: data.address?.state || data.state || '',
            street: data.address?.street || data.street || '',
            googleMapsUrl: data.googleMapsUrl || '',
            currencySymbol: data.currencySymbol || '₹',
            isFeatured: !!data.isFeatured,
            isTrending: !!data.isTrending,
            facilities: data.facilities || {}
          });
        });

        setRestaurantsList(list);
      } catch (e) {
        console.error('Error fetching restaurants for DiscoverPage:', e);
        setRestaurantsList([]);
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
    return ['All', 'Biryani', 'Fine Dining', 'Family Dining', 'Buffet', 'Cafe'];
  }, []);

  const cuisineFilters = useMemo(() => {
    const defaultCuisines = ['All', 'Biryani', 'Indian', 'Barbecue', 'Mughlai', 'Chinese'];
    const dynamicCuisines = new Set<string>();
    restaurants.forEach(r => {
      if (r.cuisine) {
        r.cuisine.split(',').forEach((c: string) => {
          const trimmed = c.trim();
          if (trimmed.length > 2 && trimmed.length < 18) dynamicCuisines.add(trimmed);
        });
      }
    });
    return Array.from(new Set([...defaultCuisines, ...Array.from(dynamicCuisines).slice(0, 4)]));
  }, [restaurants]);

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
        r.cuisine.toLowerCase().includes(q) ||
        (r.city && r.city.toLowerCase().includes(q)) ||
        (r.street && r.street.toLowerCase().includes(q))
      );
    }

    // Price range
    if (activePrice !== 'all') {
      result = result.filter(r => r.priceRange === activePrice);
    }

    // Distance - only filter if distance is measured
    if (activeDistance < 10) {
      result = result.filter(r => r.distance === null || r.distance <= activeDistance);
    }

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
          <h2 className="text-2xl font-display font-extrabold text-[#242424] flex items-center gap-2">
            Explore Restaurants <Sparkles className="w-5 h-5 text-[#E85D3F]" />
          </h2>
          <p className="text-xs text-[#6B6B6B] font-medium">Discover culinary masters, gourmet menus, and verified table availability.</p>
        </div>

        {/* Search & Filter Trigger bar */}
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B6B]" />
            <input 
              type="text" 
              placeholder="Search by restaurant, cuisine or dish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#EEE7E1] rounded-2xl text-xs text-[#242424] placeholder-[#6B6B6B] focus:outline-none focus:border-[#E85D3F]/40 shadow-xs"
            />
          </div>

          <button
            onClick={() => setIsFilterDrawerOpen(true)}
            className="px-4 py-2.5 bg-white border border-[#EEE7E1] hover:border-[#E85D3F]/40 text-xs font-bold text-[#242424] rounded-2xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Filter className="w-4 h-4 text-[#E85D3F]" /> Filter
          </button>
        </div>
      </div>

      {/* 2. Restaurant Categories (Horizontal scroll) */}
      <div className="space-y-3">
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#6B6B6B]">Categories</h3>
        <div className="flex space-x-2.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-extrabold whitespace-nowrap transition-all border shrink-0 cursor-pointer shadow-xs ${
                activeCategory === cat
                  ? 'bg-[#E85D3F] border-[#E85D3F] text-white'
                  : 'bg-[#FFF8F2] border-[#EEE7E1] text-[#242424] hover:border-[#E85D3F]/40'
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
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#6B6B6B] flex items-center gap-1">
            <Sparkles className="w-4 h-4 text-[#E85D3F]" /> Featured Culinary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredRestaurants.slice(0, 3).map(r => (
              <Card 
                key={r.id}
                onClick={() => navigate(`/customer/restaurant/${r.id}`)}
                className="group bg-white border border-[#EEE7E1] hover:border-[#E85D3F]/40 rounded-2xl overflow-hidden cursor-pointer transition-all flex flex-col justify-between shadow-xs hover:shadow-md"
              >
                <div className="h-36 w-full overflow-hidden relative">
                  <img src={r.image} alt={r.name} className="h-full w-full object-cover group-hover:scale-103 transition-transform" />
                  <span className="absolute top-2.5 right-2.5 bg-[#E85D3F] text-white text-[8.5px] uppercase font-extrabold py-0.5 px-2 rounded-full shadow-xs">Featured</span>
                </div>
                <div className="p-4 space-y-2">
                  <h4 className="text-sm font-extrabold text-[#242424] group-hover:text-[#E85D3F] transition-colors">{r.name}</h4>
                  <div className="flex justify-between items-center text-xs text-[#6B6B6B] pt-2 border-t border-[#EEE7E1]">
                    <span>{r.cuisine}</span>
                    <span className="flex items-center gap-0.5 font-bold text-[#242424]"><Star className="w-3.5 h-3.5 text-[#F4B942] fill-current" /> {r.rating}</span>
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
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#6B6B6B] flex items-center gap-1">
            <MapPin className="w-4 h-4 text-[#E85D3F]" /> Nearby Venues
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {nearbyRestaurants.slice(0, 3).map(r => (
              <Card 
                key={r.id}
                onClick={() => navigate(`/customer/restaurant/${r.id}`)}
                className="group bg-white border border-[#EEE7E1] hover:border-[#E85D3F]/40 rounded-2xl overflow-hidden cursor-pointer transition-all flex flex-col justify-between shadow-xs hover:shadow-md"
              >
                <div className="h-36 w-full overflow-hidden relative">
                  <img src={r.image} alt={r.name} className="h-full w-full object-cover group-hover:scale-103 transition-transform" />
                </div>
                <div className="p-4 space-y-2">
                  <h4 className="text-sm font-extrabold text-[#242424] group-hover:text-[#E85D3F] transition-colors">{r.name}</h4>
                  <div className="flex justify-between items-center text-xs text-[#6B6B6B] pt-2 border-t border-[#EEE7E1]">
                    <span>{r.distance.toFixed(1)} mi away</span>
                    <span className="flex items-center gap-0.5 font-bold text-[#242424]"><Star className="w-3.5 h-3.5 text-[#F4B942] fill-current" /> {r.rating}</span>
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
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#6B6B6B] flex items-center gap-1">
            <Flame className="w-4 h-4 text-[#E85D3F] animate-pulse" /> Trending Now
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {trendingRestaurants.slice(0, 3).map(r => (
              <Card 
                key={r.id} 
                onClick={() => navigate(`/customer/restaurant/${r.id}`)}
                className="group bg-white border border-[#EEE7E1] hover:border-[#E85D3F]/40 rounded-2xl overflow-hidden cursor-pointer transition-all flex flex-col justify-between shadow-xs hover:shadow-md"
              >
                <div className="h-36 w-full overflow-hidden relative bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 flex items-center justify-center">
                  {r.image ? (
                    <img src={r.image} alt={r.name} className="h-full w-full object-cover group-hover:scale-103 transition-transform" />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-3 select-none">
                      <div className="w-10 h-10 rounded-xl bg-[#E85D3F]/15 border border-[#E85D3F]/30 flex items-center justify-center text-[#E85D3F] font-extrabold text-sm mb-1 shadow-inner">
                        {r.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-[11px] font-extrabold text-white truncate max-w-[150px]">{r.name}</span>
                    </div>
                  )}
                </div>
                <div className="p-4 space-y-2">
                  <h4 className="text-sm font-extrabold text-[#242424] group-hover:text-[#E85D3F] transition-colors">{r.name}</h4>
                  <div className="flex justify-between items-center text-xs text-[#6B6B6B] pt-2 border-t border-[#EEE7E1]">
                    <span>{r.cuisine}</span>
                    {r.rating !== null && (
                      <span className="flex items-center gap-0.5 font-bold text-[#242424]"><Star className="w-3.5 h-3.5 text-[#F4B942] fill-current" /> {r.rating}</span>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 6. Cuisine Filters */}
      <div className="space-y-3">
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#6B6B6B]">Cuisine Filters</h3>
        <div className="flex flex-wrap gap-2">
          {cuisineFilters.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCuisine(c)}
              className={`px-4 py-1.5 rounded-full border text-xs font-extrabold transition-all cursor-pointer shadow-xs ${
                activeCuisine === c
                  ? 'bg-[#E85D3F] border-[#E85D3F] text-white'
                  : 'bg-[#FFF8F2] border-[#EEE7E1] text-[#242424] hover:border-[#E85D3F]/40'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* 7. Core Restaurants Grid Results */}
      <div className="space-y-4">
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#6B6B6B]">All Restaurants</h3>
        
        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <LoadingSpinner label="Opening restaurant registry..." />
          </div>
        ) : processedRestaurants.length === 0 ? (
          <div className="p-12 text-center bg-white border border-[#EEE7E1] rounded-3xl space-y-3 shadow-xs">
            <ShieldAlert className="w-10 h-10 text-[#6B6B6B] mx-auto" />
            <div>
              <h4 className="text-sm font-extrabold text-[#242424]">No Matching Restaurants Found</h4>
              <p className="text-xs text-[#6B6B6B] mt-1">Try resetting filter drawer parameters.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {processedRestaurants.slice(0, visibleCount).map((r) => (
              <Card 
                key={r.id} 
                onClick={() => navigate(`/customer/restaurant/${r.id}`)}
                className="group bg-white border border-[#EEE7E1] hover:border-[#E85D3F]/40 rounded-2xl overflow-hidden cursor-pointer transition-all flex flex-col justify-between shadow-xs hover:shadow-md"
              >
                <div className="h-40 w-full overflow-hidden relative bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 flex items-center justify-center">
                  {r.image ? (
                    <img src={r.image} alt={r.name} className="h-full w-full object-cover group-hover:scale-103 transition-transform" />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-3 select-none">
                      <div className="w-10 h-10 rounded-xl bg-[#E85D3F]/15 border border-[#E85D3F]/30 flex items-center justify-center text-[#E85D3F] font-extrabold text-sm mb-1 shadow-inner">
                        {r.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-[11px] font-extrabold text-white truncate max-w-[150px]">{r.name}</span>
                    </div>
                  )}
                  {r.rating !== null && (
                    <div className="absolute top-2.5 right-2.5 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-full border border-[#EEE7E1] text-[9.5px] text-[#242424] flex items-center gap-0.5 font-extrabold shadow-xs">
                      <Star className="w-3 h-3 text-[#F4B942] fill-current" /> {r.rating}
                    </div>
                  )}
                </div>
                <div className="p-4 space-y-3">
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-extrabold text-[#242424] group-hover:text-[#E85D3F] transition-colors truncate">{r.name}</h4>
                    <p className="text-xs text-[#6B6B6B] font-semibold">{r.cuisine}</p>
                    {r.street && <p className="text-[10px] text-[#888888] truncate">{r.street}</p>}
                  </div>
                  <div className="flex justify-between items-center text-xs text-[#6B6B6B] pt-2 border-t border-[#EEE7E1]">
                    <span className="flex items-center gap-0.5 truncate max-w-[130px]" title={r.street || r.city}>
                      <MapPin className="w-3.5 h-3.5 text-[#E85D3F] shrink-0" />
                      {r.distance !== null ? `${r.distance.toFixed(1)} mi` : (r.street || r.city || 'Hyderabad')}
                    </span>
                    <div className="flex items-center space-x-2">
                      {r.priceRange && (
                        <span className="text-[9px] bg-[#FFF8F2] px-2 py-0.5 border border-[#EEE7E1] rounded-full font-bold text-[#242424]">{r.priceRange}</span>
                      )}
                      {r.openNow ? (
                        <Badge variant="success" className="text-[8px] uppercase py-0.5 px-2 font-bold border-0 bg-[#22A06B] text-white">Open</Badge>
                      ) : (
                        <Badge variant="muted" className="text-[8px] uppercase py-0.5 px-2 font-bold border-0 bg-[#6B6B6B] text-white">Closed</Badge>
                      )}
                    </div>
                  </div>
                  {r.googleMapsUrl && (
                    <div className="pt-0.5">
                      <a
                        href={r.googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center text-[10px] text-[#E85D3F] hover:underline font-bold"
                      >
                        <MapPin className="w-3 h-3 mr-0.5" /> View on Maps
                      </a>
                    </div>
                  )}
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
              className="px-6 py-3 bg-[#FFF8F2] border border-[#EEE7E1] hover:border-[#E85D3F]/40 text-xs font-bold text-[#242424] rounded-2xl transition-all shadow-xs cursor-pointer"
            >
              Load More Restaurants
            </button>
          </div>
        )}
      </div>

      {/* 9. SORT & FILTER SIDEBAR DRAWER OVERLAY */}
      {isFilterDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-[#242424]/40 backdrop-blur-xs" onClick={() => setIsFilterDrawerOpen(false)} />
          <div className="relative w-80 max-w-full bg-white border-l border-[#EEE7E1] h-full p-6 flex flex-col justify-between shadow-2xl z-10 text-xs">
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-2 border-b border-[#EEE7E1]">
                <span className="text-xs text-[#242424] font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                  <Filter className="w-4 h-4 text-[#E85D3F]" /> Filter Options
                </span>
                <button onClick={() => setIsFilterDrawerOpen(false)} className="p-1 hover:bg-[#FFF8F2] rounded-lg text-[#6B6B6B]">
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
