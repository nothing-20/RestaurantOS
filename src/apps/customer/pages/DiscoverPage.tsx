import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { collection, onSnapshot, query, limit } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import Card from '../../../components/ui/Card/Card';
import Badge from '../../../components/ui/Badge/Badge';
import LoadingSpinner from '../../../components/ui/LoadingSpinner/LoadingSpinner';
import { 
  Star, MapPin, Filter, Search, X, RotateCcw, 
  ExternalLink, Utensils, Compass, ArrowUpDown, 
  Check, ChevronDown, SlidersHorizontal, AlertCircle, Heart
} from 'lucide-react';
import toast from 'react-hot-toast';

const HYDERABAD_AREAS = [
  'Jubilee Hills', 'Banjara Hills', 'Hitech City', 'Gachibowli', 'Madhapur', 
  'Tolichowki', 'RTC X Road', 'RTC X Roads', 'Chikkadpally', 'Secunderabad', 
  'Ramgopalpet', 'Madeenaguda', 'Kukatpally', 'Miyapur', 'Begumpet', 
  'Charminar', 'Nallakunta', 'Ameerpet', 'Kondapur', 'Dilsukhnagar',
  'Himayatnagar', 'Somajiguda', 'Abids', 'Mehdipatnam'
];

function extractAreaFromAddress(street: string, fallbackCity: string): string {
  if (!street) return fallbackCity;
  for (const area of HYDERABAD_AREAS) {
    if (new RegExp(`\\b${area.replace(/\\s+/g, '\\s+')}\\b`, 'i').test(street)) {
      return area;
    }
  }
  const parts = street.split(',').map(p => p.trim()).filter(Boolean);
  if (parts.length > 1) {
    const candidate = parts[parts.length - 1];
    if (candidate.length < 35 && !/\\d{5,6}/.test(candidate)) {
      return candidate;
    }
  }
  return fallbackCity;
}

export const DiscoverPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL parameters
  const initialSearch = searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') || 'All';
  const initialArea = searchParams.get('area') || 'All Areas';

  // Location Hub State (Unified single source of truth from localStorage)
  const [currentLocation, setCurrentLocation] = useState<{
    country: string;
    state: string;
    city: string;
    area: string;
    latitude: number;
    longitude: number;
    label: string;
  }>(() => {
    const defaultHyd = {
      country: 'India',
      state: 'Telangana',
      city: 'Hyderabad',
      area: 'All Areas',
      latitude: 17.3850,
      longitude: 78.4867,
      label: 'Hyderabad, Telangana'
    };
    try {
      const saved = localStorage.getItem('diner_location');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.city) return parsed;
      }
    } catch (_) {}
    return defaultHyd;
  });

  // Primary Data States
  const [restaurantsList, setRestaurantsList] = useState<any[]>(() => {
    return (window as any).__cachedTenants || [];
  });
  const [isLoading, setIsLoading] = useState<boolean>(!(window as any).__cachedTenants?.length);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCuisine, setSelectedCuisine] = useState(initialCategory);
  const [selectedArea, setSelectedArea] = useState(initialArea);
  const [selectedPrice, setSelectedPrice] = useState<string>('all');
  const [showVegOnly, setShowVegOnly] = useState(false);
  const [showOpenNow, setShowOpenNow] = useState(false);
  const [showTopRated, setShowTopRated] = useState(false);
  const [sortBy, setSortBy] = useState<'featured' | 'rating' | 'name' | 'reviews'>('featured');

  // Filter Drawer State
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Favourites list stored in localStorage
  const [favourites, setFavourites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('diner_favourites');
      return saved ? JSON.parse(saved) : [];
    } catch (_) {
      return [];
    }
  });

  // Synchronize location changes from custom window events and storage
  useEffect(() => {
    const handleLocationChanged = () => {
      try {
        const saved = localStorage.getItem('diner_location');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.city) {
            setCurrentLocation(parsed);
          }
        }
      } catch (_) {}
    };

    window.addEventListener('diner_location_changed', handleLocationChanged);
    window.addEventListener('storage', handleLocationChanged);

    return () => {
      window.removeEventListener('diner_location_changed', handleLocationChanged);
      window.removeEventListener('storage', handleLocationChanged);
    };
  }, []);

  // Update internal search query when URL param changes
  useEffect(() => {
    const s = searchParams.get('search');
    if (s !== null && s !== searchQuery) {
      setSearchQuery(s);
    }
  }, [searchParams]);

  // Stream real Firestore tenants in real-time
  const loadTenants = () => {
    setIsLoading(true);
    setLoadError(null);

    const qTenants = query(collection(db, 'tenants'), limit(50));
    const unsubscribe = onSnapshot(qTenants, (snap) => {
      const list: any[] = [];
      snap.forEach(d => {
        const data = d.data();
        
        // Exclude suspended / inactive accounts
        const status = data.status || 'active';
        if (status === 'suspended' || status === 'inactive') {
          return;
        }

        const city = data.address?.city || data.city || 'Hyderabad';
        const state = data.address?.state || data.state || 'Telangana';
        const country = data.address?.country || data.country || 'India';
        const street = data.address?.street || data.street || '';
        const area = data.area || data.address?.area || extractAreaFromAddress(street, city);

        const currency = data.currency || data.settings?.currency || 'INR';
        const currencySymbol = data.currencySymbol || data.settings?.currencySymbol || (currency === 'INR' || city === 'Hyderabad' ? '₹' : '$');

        list.push({
          id: d.id,
          name: data.restaurantName || data.name || 'Restaurant',
          cuisine: data.cuisine || 'Multi-Cuisine',
          rating: typeof data.rating === 'number' ? data.rating : null,
          reviewsCount: typeof data.reviewsCount === 'number' ? data.reviewsCount : null,
          priceRange: data.priceRange || '₹₹',
          vegOptions: data.vegOptions !== undefined ? data.vegOptions : true,
          nonVegOptions: data.nonVegOptions !== undefined ? data.nonVegOptions : true,
          openNow: data.status === 'active' || data.openNow !== false,
          isFeatured: Boolean(data.isFeatured),
          isTrending: Boolean(data.isTrending),
          isNew: Boolean(data.isNew),
          hasOffer: Boolean(data.hasOffer),
          image: data.coverImageUrl || data.coverImage || null,
          logoUrl: data.logoUrl || data.logo || null,
          city,
          state,
          country,
          area,
          street,
          address: data.address || null,
          googleMapsUrl: data.googleMapsUrl || null,
          description: data.description || '',
          currency,
          currencySymbol,
          latitude: typeof data.latitude === 'number' ? data.latitude : null,
          longitude: typeof data.longitude === 'number' ? data.longitude : null,
          facilities: data.facilities || null
        });
      });

      setRestaurantsList(list);
      (window as any).__cachedTenants = list;
      setIsLoading(false);
    }, (error) => {
      console.error('[DiscoverPage] Failed to fetch restaurants from Firestore:', error);
      setLoadError('Unable to load restaurants. Please check your network connection.');
      setIsLoading(false);
    });

    return unsubscribe;
  };

  useEffect(() => {
    const unsub = loadTenants();
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  const toggleFavourite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavourites(prev => {
      const updated = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id];
      try {
        localStorage.setItem('diner_favourites', JSON.stringify(updated));
      } catch (_) {}
      toast.success(prev.includes(id) ? 'Removed from favorites' : 'Added to favorites', { icon: '❤️' });
      return updated;
    });
  };

  // Trigger global location modal
  const openLocationModal = () => {
    window.dispatchEvent(new Event('open_location_modal'));
  };

  // Dynamic list of cuisines extracted from current city's restaurants
  const availableCuisines = useMemo(() => {
    const set = new Set<string>();
    const currentCity = (currentLocation?.city || 'Hyderabad').toLowerCase();
    
    restaurantsList.forEach(r => {
      const rCity = (r.city || '').toLowerCase();
      if (rCity.includes(currentCity) || currentCity.includes(rCity)) {
        if (r.cuisine) {
          r.cuisine.split(',').forEach((c: string) => {
            const clean = c.trim();
            if (clean.length > 2 && clean.length < 24) {
              set.add(clean);
            }
          });
        }
      }
    });

    return ['All', ...Array.from(set).sort()];
  }, [restaurantsList, currentLocation]);

  // Dynamic list of areas extracted from current city's restaurants
  const availableAreas = useMemo(() => {
    const set = new Set<string>();
    const currentCity = (currentLocation?.city || 'Hyderabad').toLowerCase();

    restaurantsList.forEach(r => {
      const rCity = (r.city || '').toLowerCase();
      if (rCity.includes(currentCity) || currentCity.includes(rCity)) {
        if (r.area && r.area !== 'All Areas' && r.area.toLowerCase() !== currentCity) {
          set.add(r.area);
        }
      }
    });

    return ['All Areas', ...Array.from(set).sort()];
  }, [restaurantsList, currentLocation]);

  // Universal Filtered & Sorted Restaurant Set
  const filteredRestaurants = useMemo(() => {
    let result = [...restaurantsList];

    // 1. City Filter (Matches selected location)
    if (currentLocation && currentLocation.city && currentLocation.city !== 'All Cities') {
      const curCity = currentLocation.city.toLowerCase().trim();
      result = result.filter(r => {
        const rCity = (r.city || '').toLowerCase().trim();
        return rCity === curCity || rCity.includes(curCity) || curCity.includes(rCity);
      });
    }

    // 2. Area Filter (selectedArea or currentLocation.area)
    const activeAreaFilter = selectedArea !== 'All Areas' 
      ? selectedArea 
      : (currentLocation?.area && currentLocation.area !== 'All Areas' ? currentLocation.area : 'All Areas');

    if (activeAreaFilter !== 'All Areas') {
      const targetArea = activeAreaFilter.toLowerCase().trim();
      result = result.filter(r => {
        const rArea = (r.area || '').toLowerCase();
        const rStreet = (r.street || '').toLowerCase();
        return rArea.includes(targetArea) || rStreet.includes(targetArea);
      });
    }

    // 3. Search Query matching
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(r => {
        const matchesName = (r.name || '').toLowerCase().includes(q);
        const matchesCuisine = (r.cuisine || '').toLowerCase().includes(q);
        const matchesArea = (r.area || '').toLowerCase().includes(q);
        const matchesCity = (r.city || '').toLowerCase().includes(q);
        const matchesStreet = (r.street || '').toLowerCase().includes(q);
        const matchesDescription = (r.description || '').toLowerCase().includes(q);
        return matchesName || matchesCuisine || matchesArea || matchesCity || matchesStreet || matchesDescription;
      });
    }

    // 4. Cuisine Filter
    if (selectedCuisine !== 'All') {
      const cLower = selectedCuisine.toLowerCase().trim();
      result = result.filter(r => (r.cuisine || '').toLowerCase().includes(cLower));
    }

    // 5. Price Filter
    if (selectedPrice !== 'all') {
      result = result.filter(r => r.priceRange === selectedPrice);
    }

    // 6. Quick Toggles
    if (showVegOnly) {
      result = result.filter(r => r.vegOptions === true || (r.cuisine || '').toLowerCase().includes('vegetarian'));
    }
    if (showOpenNow) {
      result = result.filter(r => r.openNow === true);
    }
    if (showTopRated) {
      result = result.filter(r => r.rating !== null && r.rating >= 4.0);
    }

    // 7. Sorting
    if (sortBy === 'rating') {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'name') {
      result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (sortBy === 'reviews') {
      result.sort((a, b) => (b.reviewsCount || 0) - (a.reviewsCount || 0));
    }

    return result;
  }, [
    restaurantsList, 
    currentLocation, 
    selectedArea, 
    searchQuery, 
    selectedCuisine, 
    selectedPrice, 
    showVegOnly, 
    showOpenNow, 
    showTopRated, 
    sortBy
  ]);

  // Count of active filters for drawer badge
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCuisine !== 'All') count++;
    if (selectedArea !== 'All Areas') count++;
    if (selectedPrice !== 'all') count++;
    if (showVegOnly) count++;
    if (showOpenNow) count++;
    if (showTopRated) count++;
    if (sortBy !== 'featured') count++;
    return count;
  }, [selectedCuisine, selectedArea, selectedPrice, showVegOnly, showOpenNow, showTopRated, sortBy]);

  const clearAllFilters = () => {
    setSelectedCuisine('All');
    setSelectedArea('All Areas');
    setSelectedPrice('all');
    setShowVegOnly(false);
    setShowOpenNow(false);
    setShowTopRated(false);
    setSortBy('featured');
    setSearchQuery('');
    setSearchParams({});
    toast.success('All filters reset');
  };

  const currentCityName = currentLocation?.city || 'Hyderabad';

  return (
    <div className="space-y-6 text-left max-w-6xl mx-auto pb-20 select-none">
      
      {/* 1. Header Bar: Title, Contextual Location Badge & Search Bar */}
      <div className="bg-white border border-[#F3E8DF] rounded-3xl p-6 md:p-8 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-2xl bg-[#F3E8DF] text-[#C85A3F]">
                <Compass className="w-5 h-5" />
              </span>
              <h1 className="text-2xl md:text-3xl font-extrabold text-[#202124] tracking-tight font-display">
                Explore Restaurants
              </h1>
            </div>
            <p className="text-xs md:text-sm text-[#756B64] font-medium pl-0.5">
              Discover verified dining venues and gourmet cuisines across <span className="font-bold text-[#202124]">{currentCityName}</span>.
            </p>
          </div>

          {/* Unified Location Indicator */}
          <button
            onClick={openLocationModal}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#FCFAF7] border border-[#F3E8DF] hover:border-[#C85A3F]/50 rounded-2xl transition-all group shadow-2xs cursor-pointer"
            title="Change Dining City or Area"
          >
            <MapPin className="w-4 h-4 text-[#C85A3F] shrink-0" />
            <span className="text-xs font-bold text-[#202124] group-hover:text-[#C85A3F] transition-colors">
              {currentLocation?.label || currentCityName}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-[#756B64] group-hover:text-[#C85A3F] transition-colors" />
          </button>
        </div>

        {/* Search Bar & Filter Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C85A3F]" />
            <input 
              type="text" 
              placeholder="Search by restaurant name, cuisine, dish or area..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value) {
                  setSearchParams({ search: e.target.value });
                } else {
                  const p = new URLSearchParams(searchParams);
                  p.delete('search');
                  setSearchParams(p);
                }
              }}
              className="w-full pl-11 pr-10 py-3 bg-[#FCFAF7] border border-[#F3E8DF] focus:border-[#C85A3F] focus:bg-white rounded-2xl text-xs md:text-sm text-[#202124] placeholder-[#756B64] transition-all outline-none shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  const p = new URLSearchParams(searchParams);
                  p.delete('search');
                  setSearchParams(p);
                }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-[#756B64] hover:text-[#202124] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Quick Area Dropdown */}
            {availableAreas.length > 1 && (
              <div className="relative flex-1 sm:flex-initial">
                <select
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  className="w-full sm:w-44 px-3.5 py-3 bg-[#FCFAF7] border border-[#F3E8DF] hover:border-[#C85A3F]/50 rounded-2xl text-xs font-bold text-[#202124] outline-none cursor-pointer appearance-none pr-8 transition-colors shadow-2xs"
                >
                  {availableAreas.map(area => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#756B64] pointer-events-none" />
              </div>
            )}

            {/* Filter Drawer Button */}
            <button
              onClick={() => setIsFilterDrawerOpen(true)}
              className="px-4 py-3 bg-[#FCFAF7] border border-[#F3E8DF] hover:border-[#C85A3F]/50 text-xs font-bold text-[#202124] rounded-2xl transition-all flex items-center gap-2 shadow-2xs cursor-pointer relative shrink-0"
            >
              <SlidersHorizontal className="w-4 h-4 text-[#C85A3F]" />
              <span className="hidden sm:inline">Filters</span>
              {activeFiltersCount > 0 && (
                <span className="w-5 h-5 bg-[#C85A3F] text-white text-[10px] font-extrabold rounded-full flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* 2. Horizontal Cuisine Chips */}
        <div className="space-y-2 pt-2 border-t border-[#F3E8DF]">
          <div className="flex items-center justify-between text-xs">
            <span className="font-extrabold uppercase tracking-wider text-[#756B64] text-[11px]">
              Cuisines
            </span>
            {selectedCuisine !== 'All' && (
              <button 
                onClick={() => setSelectedCuisine('All')}
                className="text-[#C85A3F] font-bold hover:underline cursor-pointer text-[11px]"
              >
                Reset Cuisine
              </button>
            )}
          </div>
          <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-none">
            {availableCuisines.map((c) => {
              const isSelected = selectedCuisine.toLowerCase() === c.toLowerCase();
              return (
                <button
                  key={c}
                  onClick={() => setSelectedCuisine(c)}
                  className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-[#C85A3F] border-[#C85A3F] text-white shadow-xs'
                      : 'bg-[#F3E8DF] border-[#F3E8DF] text-[#202124] hover:bg-[#EBDDD2]'
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Quick Feature Toggles Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            onClick={() => setShowOpenNow(prev => !prev)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
              showOpenNow 
                ? 'bg-[#2E8B57]/10 border-[#2E8B57] text-[#2E8B57]' 
                : 'bg-[#FCFAF7] border-[#F3E8DF] text-[#756B64] hover:border-[#C85A3F]/40 hover:text-[#202124]'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${showOpenNow ? 'bg-[#2E8B57]' : 'bg-[#756B64]'}`} />
            Open Now
          </button>

          <button
            onClick={() => setShowTopRated(prev => !prev)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
              showTopRated 
                ? 'bg-[#C85A3F]/10 border-[#C85A3F] text-[#C85A3F]' 
                : 'bg-[#FCFAF7] border-[#F3E8DF] text-[#756B64] hover:border-[#C85A3F]/40 hover:text-[#202124]'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${showTopRated ? 'text-[#C85A3F] fill-current' : 'text-[#756B64]'}`} />
            Top Rated (4.0+)
          </button>

          <button
            onClick={() => setShowVegOnly(prev => !prev)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
              showVegOnly 
                ? 'bg-[#2E8B57]/10 border-[#2E8B57] text-[#2E8B57]' 
                : 'bg-[#FCFAF7] border-[#F3E8DF] text-[#756B64] hover:border-[#C85A3F]/40 hover:text-[#202124]'
            }`}
          >
            🌱 Vegetarian
          </button>

          {activeFiltersCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-[#C85A3F] hover:bg-[#F3E8DF] transition-all flex items-center gap-1 cursor-pointer ml-auto"
            >
              <RotateCcw className="w-3 h-3" /> Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* 4. Results Header: Count & Sort */}
      <div className="flex justify-between items-center px-1">
        <div>
          <h2 className="text-sm md:text-base font-extrabold text-[#202124] tracking-tight">
            Restaurants in {currentCityName}
          </h2>
          <p className="text-xs text-[#756B64] font-medium">
            {isLoading 
              ? 'Loading restaurants...' 
              : `Showing ${filteredRestaurants.length} dining venue${filteredRestaurants.length === 1 ? '' : 's'}`
            }
          </p>
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-1.5">
          <ArrowUpDown className="w-3.5 h-3.5 text-[#756B64]" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-white border border-[#F3E8DF] text-xs font-bold text-[#202124] rounded-xl px-2.5 py-1.5 outline-none cursor-pointer hover:border-[#C85A3F]/50 transition-colors shadow-2xs"
          >
            <option value="featured">Featured First</option>
            <option value="rating">Top Rated</option>
            <option value="name">Name (A-Z)</option>
            <option value="reviews">Most Reviewed</option>
          </select>
        </div>
      </div>

      {/* 5. Main Content: Loading, Error, Empty State, or Restaurant Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="bg-white border border-[#E5DCD5] rounded-3xl overflow-hidden p-4 space-y-4 animate-pulse">
              <div className="h-44 bg-[#F3E8DF] rounded-2xl w-full" />
              <div className="space-y-2">
                <div className="h-4 bg-[#F3E8DF] rounded-md w-3/4" />
                <div className="h-3 bg-[#F3E8DF] rounded-md w-1/2" />
              </div>
              <div className="h-8 bg-[#F3E8DF] rounded-xl w-full" />
            </div>
          ))}
        </div>
      ) : loadError ? (
        <div className="bg-white border border-[#F3E8DF] rounded-3xl p-12 text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-[#A94332]/10 text-[#A94332] flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-[#202124]">Unable to load restaurants</h3>
            <p className="text-xs text-[#756B64] max-w-md mx-auto">{loadError}</p>
          </div>
          <button
            onClick={() => loadTenants()}
            className="px-6 py-2.5 bg-[#C85A3F] hover:bg-[#A94332] text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-xs"
          >
            Retry Connection
          </button>
        </div>
      ) : filteredRestaurants.length === 0 ? (
        <div className="bg-white border border-[#F3E8DF] rounded-3xl p-12 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-full bg-[#F3E8DF] text-[#C85A3F] flex items-center justify-center mx-auto">
            <Utensils className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-[#202124]">No restaurants found</h3>
            <p className="text-xs text-[#756B64] max-w-md mx-auto">
              Try adjusting your search terms, switching to another cuisine, or clearing your active filters.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={clearAllFilters}
              className="px-5 py-2.5 bg-[#C85A3F] hover:bg-[#A94332] text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-xs"
            >
              Clear All Filters
            </button>
            <button
              onClick={openLocationModal}
              className="px-5 py-2.5 bg-[#FCFAF7] border border-[#F3E8DF] hover:border-[#C85A3F]/50 text-[#202124] rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-2xs"
            >
              Change Location
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRestaurants.map((r) => {
            const isFav = favourites.includes(r.id);
            return (
              <Card
                key={r.id}
                onClick={() => navigate(`/customer/restaurant/${r.id}`)}
                className="group bg-white border border-[#E5DCD5] hover:border-[#C85A3F]/60 rounded-3xl overflow-hidden cursor-pointer transition-all duration-200 flex flex-col justify-between shadow-2xs hover:shadow-md hover:-translate-y-0.5"
              >
                {/* Visual Cover / Fallback Initial Badge */}
                <div className="h-44 w-full overflow-hidden relative bg-[#F3E8DF] flex items-center justify-center">
                  {r.image ? (
                    <img 
                      src={r.image} 
                      alt={r.name} 
                      className="h-full w-full object-cover group-hover:scale-103 transition-transform duration-300" 
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-4 select-none">
                      <div className="w-12 h-12 rounded-2xl bg-white border border-[#E5DCD5] flex items-center justify-center text-[#C85A3F] font-extrabold text-base mb-1 shadow-inner">
                        {r.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-extrabold text-[#202124] truncate max-w-[180px]">
                        {r.name}
                      </span>
                    </div>
                  )}

                  {/* Top Badges: Rating & Favorite */}
                  <div className="absolute top-3 left-3 right-3 flex justify-between items-center">
                    {r.rating !== null ? (
                      <div className="bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-full border border-[#E5DCD5] text-[10.5px] text-[#202124] flex items-center gap-1 font-extrabold shadow-xs">
                        <Star className="w-3.5 h-3.5 text-[#F4B942] fill-current" />
                        <span>{r.rating.toFixed(1)}</span>
                        {r.reviewsCount && (
                          <span className="text-[#756B64] font-medium text-[9.5px]">({r.reviewsCount})</span>
                        )}
                      </div>
                    ) : (
                      <span />
                    )}

                    <button
                      type="button"
                      onClick={(e) => toggleFavourite(r.id, e)}
                      className="w-8 h-8 rounded-full bg-white/95 backdrop-blur-xs border border-[#E5DCD5] flex items-center justify-center text-[#756B64] hover:text-[#C85A3F] transition-colors shadow-xs cursor-pointer"
                      title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Heart className={`w-4 h-4 ${isFav ? 'text-[#C85A3F] fill-current' : ''}`} />
                    </button>
                  </div>

                  {/* Status Badge: Open Now */}
                  <div className="absolute bottom-3 left-3">
                    {r.openNow ? (
                      <Badge className="bg-[#2E8B57] text-white border-0 text-[9.5px] font-extrabold px-2 py-0.5 shadow-xs">
                        Open Now
                      </Badge>
                    ) : (
                      <Badge className="bg-[#756B64] text-white border-0 text-[9.5px] font-extrabold px-2 py-0.5 shadow-xs">
                        Closed
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Card Information */}
                <div className="p-5 space-y-3">
                  <div>
                    <h3 className="text-base font-extrabold text-[#202124] group-hover:text-[#C85A3F] transition-colors truncate">
                      {r.name}
                    </h3>
                    <p className="text-xs text-[#756B64] font-semibold mt-0.5 truncate">
                      {r.cuisine}
                    </p>
                  </div>

                  {/* Locality & Pricing */}
                  <div className="flex items-center justify-between text-xs text-[#756B64] pt-2 border-t border-[#F3E8DF]">
                    <div className="flex items-center gap-1 truncate max-w-[170px]" title={`${r.area || ''}, ${r.city}`}>
                      <MapPin className="w-3.5 h-3.5 text-[#C85A3F] shrink-0" />
                      <span className="truncate font-medium">{r.area || r.city}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {r.priceRange && (
                        <span className="text-[10px] font-extrabold bg-[#F3E8DF] text-[#202124] px-2 py-0.5 rounded-md">
                          {r.priceRange}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Google Maps link if present */}
                  {r.googleMapsUrl && (
                    <div className="pt-0.5">
                      <a
                        href={r.googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center text-[10.5px] text-[#C85A3F] hover:underline font-bold"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" /> View on Maps
                      </a>
                    </div>
                  )}

                  {/* Primary CTA */}
                  <div className="pt-1">
                    <button
                      onClick={() => navigate(`/customer/restaurant/${r.id}`)}
                      className="w-full py-2.5 bg-[#C85A3F] hover:bg-[#A94332] text-white font-extrabold text-xs rounded-2xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      View Restaurant
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* 6. Filter Drawer (Advanced Filters) */}
      {isFilterDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div 
            className="absolute inset-0 bg-[#202124]/40 backdrop-blur-xs transition-opacity" 
            onClick={() => setIsFilterDrawerOpen(false)} 
          />
          <div className="relative w-84 max-w-full bg-white border-l border-[#F3E8DF] h-full p-6 flex flex-col justify-between shadow-2xl z-10 text-xs overflow-y-auto">
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-3 border-b border-[#F3E8DF]">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-[#C85A3F]" />
                  <span className="text-xs text-[#202124] font-extrabold uppercase tracking-wider">
                    Filter Options
                  </span>
                </div>
                <button 
                  onClick={() => setIsFilterDrawerOpen(false)} 
                  className="p-1 hover:bg-[#F3E8DF] rounded-xl text-[#756B64] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Price Range */}
              <div className="space-y-2">
                <label className="text-[11px] text-[#756B64] font-extrabold uppercase block">
                  Price Range
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {['all', '₹', '₹₹', '₹₹₹'].map((pr) => (
                    <button
                      key={pr}
                      type="button"
                      onClick={() => setSelectedPrice(pr)}
                      className={`py-2 border text-[11px] font-extrabold rounded-xl transition-all text-center uppercase cursor-pointer ${
                        selectedPrice === pr 
                          ? 'bg-[#C85A3F] border-[#C85A3F] text-white shadow-xs' 
                          : 'bg-[#FCFAF7] border-[#F3E8DF] text-[#202124] hover:border-[#C85A3F]/50'
                      }`}
                    >
                      {pr === 'all' ? 'All' : pr}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dietary Selection */}
              <div className="space-y-2">
                <label className="text-[11px] text-[#756B64] font-extrabold uppercase block">
                  Dietary & Operating Status
                </label>
                <div className="space-y-2.5 font-bold text-[#202124]">
                  <label className="flex items-center justify-between p-2.5 bg-[#FCFAF7] border border-[#F3E8DF] rounded-xl cursor-pointer">
                    <span className="text-xs">Vegetarian Options</span>
                    <input 
                      type="checkbox" 
                      checked={showVegOnly} 
                      onChange={(e) => setShowVegOnly(e.target.checked)}
                      className="rounded accent-[#C85A3F] w-4 h-4 cursor-pointer" 
                    />
                  </label>
                  <label className="flex items-center justify-between p-2.5 bg-[#FCFAF7] border border-[#F3E8DF] rounded-xl cursor-pointer">
                    <span className="text-xs">Open Now Only</span>
                    <input 
                      type="checkbox" 
                      checked={showOpenNow} 
                      onChange={(e) => setShowOpenNow(e.target.checked)}
                      className="rounded accent-[#C85A3F] w-4 h-4 cursor-pointer" 
                    />
                  </label>
                  <label className="flex items-center justify-between p-2.5 bg-[#FCFAF7] border border-[#F3E8DF] rounded-xl cursor-pointer">
                    <span className="text-xs">Top Rated (4.0+ Stars)</span>
                    <input 
                      type="checkbox" 
                      checked={showTopRated} 
                      onChange={(e) => setShowTopRated(e.target.checked)}
                      className="rounded accent-[#C85A3F] w-4 h-4 cursor-pointer" 
                    />
                  </label>
                </div>
              </div>

              {/* Area selector in drawer */}
              {availableAreas.length > 1 && (
                <div className="space-y-2">
                  <label className="text-[11px] text-[#756B64] font-extrabold uppercase block">
                    Area / Locality ({currentCityName})
                  </label>
                  <select
                    value={selectedArea}
                    onChange={(e) => setSelectedArea(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#FCFAF7] border border-[#F3E8DF] rounded-xl text-xs font-bold text-[#202124] outline-none cursor-pointer"
                  >
                    {availableAreas.map(area => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Bottom Drawer Actions */}
            <div className="pt-6 border-t border-[#F3E8DF] space-y-2">
              <button
                onClick={() => setIsFilterDrawerOpen(false)}
                className="w-full bg-[#C85A3F] hover:bg-[#A94332] text-white font-extrabold py-3 rounded-2xl text-xs transition-all shadow-xs cursor-pointer"
              >
                Apply Filters ({filteredRestaurants.length} Venues)
              </button>
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="w-full bg-[#FCFAF7] hover:bg-[#F3E8DF] text-[#756B64] font-bold py-2.5 rounded-2xl text-xs transition-all cursor-pointer"
                >
                  Reset All Filters
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DiscoverPage;
