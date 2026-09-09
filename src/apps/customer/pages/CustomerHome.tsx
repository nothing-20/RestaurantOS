import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { collection, onSnapshot, query, limit } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../context/AuthContext';
import Card from '../../../components/ui/Card/Card';
import Badge from '../../../components/ui/Badge/Badge';
import LoadingSpinner from '../../../components/ui/LoadingSpinner/LoadingSpinner';
import Modal from '../../../components/ui/Modal/Modal';
import { 
  Sparkles, Coffee, Compass, Star, MapPin, Search, Award, Flame, 
  Clock, ArrowRight, Percent, Calendar, Heart, ChevronRight, X,
  Users, Utensils, Music, DollarSign, Locate, Filter,
  Check
} from 'lucide-react';
import toast from 'react-hot-toast';

const REST_MOCK_IMAGES = [
  'https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=600&auto=format&fit=crop'
];

const POPULAR_CITIES = [
  { name: 'Hyderabad', lat: 17.3850, lng: 78.4867 },
  { name: 'Bengaluru', lat: 12.9716, lng: 77.5946 },
  { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
  { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
  { name: 'Delhi', lat: 28.6139, lng: 77.2090 },
  { name: 'Kolkata', lat: 22.5726, lng: 88.3639 },
  { name: 'Pune', lat: 18.5204, lng: 73.8567 },
  { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
  { name: 'Jaipur', lat: 26.9124, lng: 75.7873 },
  { name: 'Lucknow', lat: 26.8467, lng: 80.9462 },
  { name: 'Goa', lat: 15.2993, lng: 74.1240 }
];

const CUISINE_DISHES: Record<string, string[]> = {
  'italian': ['pizza', 'pasta', 'lasagna', 'truffle risotto', 'ravioli'],
  'japanese': ['sushi', 'sashimi', 'ramen bowl', 'tempura box', 'omakase'],
  'french': ['croissant', 'foie gras', 'duck confit', 'escargots'],
  'indian': ['biryani', 'butter chicken', 'paneer tikka', 'dosa', 'naan'],
  'mexican': ['tacos', 'burritos', 'quesadilla', 'guacamole', 'nachos'],
  'healthy': ['avocado salad', 'quinoa bowl', 'smoothie', 'vegan wrap']
};

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return (R * c) * 0.621371; // convert to miles
}

export const CustomerHome: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Location Hub States
  const [currentLocation, setCurrentLocation] = useState<{
    country: string;
    state: string;
    city: string;
    area: string;
    latitude: number;
    longitude: number;
    label: string;
  } | null>(() => {
    const saved = localStorage.getItem('diner_location');
    return saved ? JSON.parse(saved) : {
      country: 'India',
      state: 'Karnataka',
      city: 'Bengaluru',
      area: 'Indiranagar',
      latitude: 12.9716,
      longitude: 77.5946,
      label: 'Indiranagar, Bengaluru'
    };
  });

  const [recentLocations, setRecentLocations] = useState<any[]>(() => {
    const saved = localStorage.getItem('recent_locations');
    return saved ? JSON.parse(saved) : [];
  });

  const [savedLocations] = useState<any[]>([
    { name: 'Home', label: 'Indiranagar, Bengaluru', city: 'Bengaluru', area: 'Indiranagar', lat: 12.9716, lng: 77.5946 },
    { name: 'Office', label: 'Hitech City, Hyderabad', city: 'Hyderabad', area: 'Hitech City', lat: 17.3850, lng: 78.4867 }
  ]);

  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [areaSearchQuery, setAreaSearchQuery] = useState('');

  // Primary Data States
  const [restaurantsList, setRestaurantsList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('search') || '');
  const [localSearchVal, setLocalSearchVal] = useState(() => searchParams.get('search') || '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  // Filter Modal / Toggles States
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [activeExperience, setActiveExperience] = useState<string>('All');
  
  const [showOpenNow, setShowOpenNow] = useState(false);
  const [showTopRated, setShowTopRated] = useState(false);
  const [showNearbyOnly, setShowNearbyOnly] = useState(false);
  const [showVegOnly, setShowVegOnly] = useState(false);
  const [showNonVegOnly, setShowNonVegOnly] = useState(false);
  const [showOffersOnly, setShowOffersOnly] = useState(false);

  // Advanced filters inside Modal
  const [filterCuisine, setFilterCuisine] = useState<string>('All');
  const [filterPrice, setFilterPrice] = useState<string>('All');
  const [filterOutdoor, setFilterOutdoor] = useState(false);
  const [filterRooftop, setFilterRooftop] = useState(false);
  const [filterLiveMusic, setFilterLiveMusic] = useState(false);

  // Favourites list stored in localStorage
  const [favourites, setFavourites] = useState<string[]>(() => {
    const saved = localStorage.getItem('diner_favourites');
    return saved ? JSON.parse(saved) : [];
  });

  // Debounced search trigger
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchQuery(localSearchVal);
      if (localSearchVal) {
        setSearchParams({ search: localSearchVal });
      } else {
        const copy = new URLSearchParams(searchParams);
        copy.delete('search');
        setSearchParams(copy);
      }
    }, 250);
    return () => clearTimeout(handler);
  }, [localSearchVal, setSearchParams, searchParams]);

  // Handle outside clicks to close the suggestions dropdown
  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', clickOutside);
    return () => document.removeEventListener('mousedown', clickOutside);
  }, []);

  // Update search state if URL query parameter changes
  useEffect(() => {
    const searchVal = searchParams.get('search');
    if (searchVal !== null && searchVal !== localSearchVal) {
      setLocalSearchVal(searchVal);
      setSearchQuery(searchVal);
    }
  }, [searchParams]);

  // Stream onboarded restaurants branches from Firestore in real-time
  useEffect(() => {
    console.log('[CustomerHome] Registry initialization started');
    console.log('[CustomerHome] Registry query started');
    setIsLoading(true);

    const qTenants = query(collection(db, 'tenants'), limit(12));
    const unsubscribe = onSnapshot(qTenants, (snap) => {
      const list: any[] = [];
      let index = 0;
      snap.forEach(d => {
        const data = d.data();
        const mockCity = POPULAR_CITIES[index % POPULAR_CITIES.length].name;
        const mockArea = `${mockCity} Central`;
        const city = data.city || mockCity;
        const area = data.area || mockArea;
        
        list.push({
          id: d.id,
          name: data.restaurantName || data.name || 'Premium Bistro',
          cuisine: data.cuisine || 'Fine Dining',
          rating: data.rating || parseFloat((4.3 + (index % 7) * 0.1).toFixed(1)),
          reviewsCount: data.reviewsCount || (120 + (index * 45)),
          priceRange: data.priceRange || (index % 3 === 0 ? '$$$' : index % 3 === 1 ? '$$' : '$'),
          vegOptions: data.vegOptions !== undefined ? data.vegOptions : true,
          nonVegOptions: data.nonVegOptions !== undefined ? data.nonVegOptions : true,
          openNow: data.openNow !== undefined ? data.openNow : true,
          isFeatured: data.isFeatured !== undefined ? data.isFeatured : index % 2 === 0,
          isTrending: index % 3 === 0,
          isNew: index % 4 === 0,
          hasOffer: index % 2 === 0,
          image: data.coverImageUrl || data.coverImage || null,
          logoUrl: data.logoUrl || data.logo || null,
          city,
          area,
          latitude: data.latitude || POPULAR_CITIES[index % POPULAR_CITIES.length].lat,
          longitude: data.longitude || POPULAR_CITIES[index % POPULAR_CITIES.length].lng,
          supportsSeatPreference: data.supportsSeatPreference !== undefined ? data.supportsSeatPreference : index % 2 === 0,
          availableTables: data.availableTables || (2 + (index % 4)),
          waitingTime: index % 2 === 0 ? 'Instant Seating' : '15-20 mins wait',
          facilities: {
            outdoorSeating: index % 2 === 0,
            liveMusic: index % 3 === 0,
            rooftop: index % 4 === 0,
            buffet: index % 5 === 0
          }
        });
        index++;
      });

      if (list.length === 0) {
        setRestaurantsList([]);
      } else {
        setRestaurantsList(list);
      }
      setIsLoading(false);
    }, (error) => {
      console.error('[CustomerHome] Failed to stream restaurants:', error);
      setRestaurantsList([]);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Detect GPS location
  const handleDetectLocation = (isAuto = false) => {
    if (!navigator.geolocation) {
      if (!isAuto) toast.error("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=en`);
          const data = await res.json();
          if (data && data.address) {
            const country = data.address.country || 'India';
            const state = data.address.state || '';
            const city = data.address.city || data.address.town || data.address.village || 'Bengaluru';
            const area = data.address.suburb || data.address.neighbourhood || data.address.road || 'Downtown';
            
            const newLoc = {
              country,
              state,
              city,
              area,
              latitude,
              longitude,
              label: `${area}, ${city}`
            };
            setCurrentLocation(newLoc);
            localStorage.setItem('diner_location', JSON.stringify(newLoc));
            addToRecentLocations(newLoc);
            toast.success(`Location set: ${newLoc.label}`);
          } else {
            const newLoc = {
              country: 'India',
              state: 'Karnataka',
              city: 'Bengaluru',
              area: 'Central',
              latitude,
              longitude,
              label: `${latitude.toFixed(3)}°N, ${longitude.toFixed(3)}°E`
            };
            setCurrentLocation(newLoc);
            localStorage.setItem('diner_location', JSON.stringify(newLoc));
            toast.success("Location set from GPS coordinates.");
          }
        } catch (err) {
          console.error(err);
          if (!isAuto) toast.error("Failed to resolve coordinate address.");
        }
      },
      (error) => {
        console.warn("Geolocation permission error", error);
        if (!isAuto) {
          toast.error("Location permission denied. Select manually.");
          setIsLocationModalOpen(true);
        }
      },
      { timeout: 8000 }
    );
  };

  const addToRecentLocations = (loc: any) => {
    setRecentLocations(prev => {
      const filtered = prev.filter(p => p.label !== loc.label);
      const updated = [loc, ...filtered].slice(0, 3);
      localStorage.setItem('recent_locations', JSON.stringify(updated));
      return updated;
    });
  };

  const handleSelectLocation = (loc: any) => {
    setCurrentLocation(loc);
    localStorage.setItem('diner_location', JSON.stringify(loc));
    addToRecentLocations(loc);
    setIsLocationModalOpen(false);
    toast.success(`Dining city set to ${loc.label}`);
  };

  const toggleFavourite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavourites(prev => {
      const updated = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id];
      localStorage.setItem('diner_favourites', JSON.stringify(updated));
      toast.success(prev.includes(id) ? 'Removed from favorites' : 'Added to favorites', { icon: '❤️' });
      return updated;
    });
  };

  // Processed Restaurants (sorted by proximity distance)
  const processedRestaurants = useMemo(() => {
    if (!currentLocation) return restaurantsList;
    return restaurantsList.map(r => {
      const distance = calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        r.latitude,
        r.longitude
      );
      const travelMins = Math.ceil(distance * 3.5 + 4);
      const travelTime = travelMins > 60 
        ? `${Math.floor(travelMins/60)}h ${travelMins%60}m drive`
        : `${travelMins} mins drive`;
      return { ...r, distance, travelTime };
    }).sort((a, b) => a.distance - b.distance);
  }, [restaurantsList, currentLocation]);

  // Main universal filter list
  const filteredRestaurants = useMemo(() => {
    let result = [...processedRestaurants];

    // Filter by Selected Location City/Area
    if (currentLocation) {
      result = result.filter(r => {
        const sameCity = r.city.toLowerCase() === currentLocation.city.toLowerCase();
        if (!sameCity) return false;
        if (currentLocation.area && currentLocation.area !== 'All Areas') {
          return r.area.toLowerCase() === currentLocation.area.toLowerCase();
        }
        return true;
      });
    }

    // Search query matching
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(r => {
        const matchesName = r.name.toLowerCase().includes(q);
        const matchesCuisine = r.cuisine.toLowerCase().includes(q);
        const matchesArea = r.area.toLowerCase().includes(q);
        const matchesCity = r.city.toLowerCase().includes(q);
        
        const matchCuisineKey = Object.keys(CUISINE_DISHES).find(key => r.cuisine.toLowerCase().includes(key));
        const matchesDish = matchCuisineKey 
          ? CUISINE_DISHES[matchCuisineKey].some(dish => dish.includes(q))
          : false;

        return matchesName || matchesCuisine || matchesArea || matchesCity || matchesDish;
      });
    }

    // Experience filter
    if (activeExperience !== 'All') {
      result = result.filter(r => {
        if (activeExperience === 'Fine Dining') return r.cuisine.toLowerCase().includes('fine') || r.cuisine.toLowerCase().includes('haute');
        if (activeExperience === 'Family') return r.isFeatured || r.vegOptions;
        if (activeExperience === 'Rooftop') return r.facilities?.rooftop;
        if (activeExperience === 'Romantic') return r.facilities?.outdoorSeating || r.cuisine.toLowerCase().includes('french');
        if (activeExperience === 'Buffet') return r.facilities?.buffet;
        if (activeExperience === 'Cafe') return r.cuisine.toLowerCase().includes('cafe') || r.cuisine.toLowerCase().includes('coffee');
        if (activeExperience === 'Live Music') return r.facilities?.liveMusic;
        if (activeExperience === 'Pocket Friendly') return r.priceRange === '$';
        if (activeExperience === 'Outdoor') return r.facilities?.outdoorSeating;
        return true;
      });
    }

    // Advanced modal filters
    if (filterCuisine !== 'All') {
      result = result.filter(r => r.cuisine.toLowerCase().includes(filterCuisine.toLowerCase()));
    }
    if (filterPrice !== 'All') {
      result = result.filter(r => r.priceRange === filterPrice);
    }
    if (filterOutdoor) {
      result = result.filter(r => r.facilities?.outdoorSeating);
    }
    if (filterRooftop) {
      result = result.filter(r => r.facilities?.rooftop);
    }
    if (filterLiveMusic) {
      result = result.filter(r => r.facilities?.liveMusic);
    }

    // Sticky Filter toggles
    if (showOpenNow) result = result.filter(r => r.openNow);
    if (showTopRated) result = result.filter(r => r.rating >= 4.7);
    if (showNearbyOnly) result = result.filter(r => r.distance <= 2.0);
    if (showVegOnly) result = result.filter(r => r.vegOptions);
    if (showNonVegOnly) result = result.filter(r => r.nonVegOptions);
    if (showOffersOnly) result = result.filter(r => r.hasOffer);

    return result;
  }, [
    processedRestaurants, currentLocation, searchQuery, activeExperience, 
    filterCuisine, filterPrice, filterOutdoor, filterRooftop, filterLiveMusic,
    showOpenNow, showTopRated, showNearbyOnly, showVegOnly, showNonVegOnly, showOffersOnly
  ]);

  // Aggregate dynamic onboarding areas
  const dynamicCitiesList = useMemo(() => {
    const citiesMap: Record<string, { name: string; lat: number; lng: number; areas: Set<string> }> = {};
    restaurantsList.forEach(r => {
      if (r.city) {
        const cityKey = r.city.toLowerCase();
        if (!citiesMap[cityKey]) {
          citiesMap[cityKey] = { name: r.city, lat: r.latitude, lng: r.longitude, areas: new Set<string>() };
        }
        if (r.area) {
          citiesMap[cityKey].areas.add(r.area);
        }
      }
    });

    return Object.values(citiesMap).map(c => ({
      ...c,
      areas: Array.from(c.areas)
    }));
  }, [restaurantsList]);

  // Filter city results in Modal
  const filteredPopularCities = useMemo(() => {
    const q = citySearchQuery.toLowerCase().trim();
    if (!q) return POPULAR_CITIES;
    return POPULAR_CITIES.filter(c => c.name.toLowerCase().includes(q));
  }, [citySearchQuery]);

  // Autocomplete Suggestions
  const searchSuggestions = useMemo(() => {
    const val = localSearchVal.toLowerCase().trim();
    if (!val || val.length < 2) return [];

    const matches = new Set<string>();

    restaurantsList.forEach(r => {
      if (r.name.toLowerCase().includes(val)) matches.add(r.name);
      if (r.cuisine.toLowerCase().includes(val)) matches.add(r.cuisine);
      if (r.area.toLowerCase().includes(val)) matches.add(r.area);
      
      const matchCuisineKey = Object.keys(CUISINE_DISHES).find(key => r.cuisine.toLowerCase().includes(key));
      if (matchCuisineKey) {
        CUISINE_DISHES[matchCuisineKey].forEach(dish => {
          if (dish.toLowerCase().includes(val)) {
            matches.add(dish);
          }
        });
      }
    });

    return Array.from(matches).slice(0, 5);
  }, [localSearchVal, restaurantsList]);

  // Experiences categories horizontal scroll list
  const DINING_EXPERIENCES = [
    { id: 'fine-dining', name: 'Fine Dining', icon: Award, filter: 'Fine Dining' },
    { id: 'family-dining', name: 'Family Dining', icon: Users, filter: 'Family' },
    { id: 'rooftop-dining', name: 'Rooftop Dining', icon: Compass, filter: 'Rooftop' },
    { id: 'romantic-dining', name: 'Romantic Dining', icon: Heart, filter: 'Romantic' },
    { id: 'buffet', name: 'Buffet Feast', icon: Utensils, filter: 'Buffet' },
    { id: 'cafe', name: 'Cafe & Bakery', icon: Coffee, filter: 'Cafe' },
    { id: 'live-music', name: 'Live Music', icon: Music, filter: 'Live Music' },
    { id: 'pocket-friendly', name: 'Pocket Friendly', icon: DollarSign, filter: 'Pocket Friendly' },
    { id: 'outdoor', name: 'Outdoor Seating', icon: MapPin, filter: 'Outdoor' }
  ];

  // Specific filtered lists for home components
  const topRatedNearYou = useMemo(() => {
    // Proximity + Highest Rating + Popularity (review count) + Nearest distance
    return [...filteredRestaurants]
      .filter(r => r.rating >= 4.5)
      .sort((a, b) => {
        if (b.rating !== a.rating) return b.rating - a.rating;
        if (b.reviewsCount !== a.reviewsCount) return b.reviewsCount - a.reviewsCount;
        return a.distance - b.distance;
      });
  }, [filteredRestaurants]);

  const recommendedRestaurants = useMemo(() => {
    // Recommendation based on location (same city) + favorites + featured status
    return [...filteredRestaurants].filter(r => r.isFeatured || favourites.includes(r.id));
  }, [filteredRestaurants, favourites]);

  const popularNearYouList = useMemo(() => {
    // Trending based on reviews count >= 150
    return [...filteredRestaurants].filter(r => r.reviewsCount >= 150);
  }, [filteredRestaurants]);

  // Reset all filters helper
  const handleResetFilters = () => {
    setFilterCuisine('All');
    setFilterPrice('All');
    setFilterOutdoor(false);
    setFilterRooftop(false);
    setFilterLiveMusic(false);
    setShowOpenNow(false);
    setShowTopRated(false);
    setShowNearbyOnly(false);
    setShowVegOnly(false);
    setShowNonVegOnly(false);
    setShowOffersOnly(false);
    setActiveExperience('All');
    toast.success('Filters cleared.');
  };

  // Reusable mini horizontal card component
  const MiniHorizontalCard = ({ r }: { r: any }) => (
    <Card 
      key={r.id} 
      className="group bg-white border border-[#EEE7E1] hover:border-[#E85D3F]/40 rounded-2xl overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-md transition-all relative shrink-0 w-60 scroll-snap-align-start select-none"
    >
      <div className="h-28 w-full overflow-hidden relative">
        <img src={r.image} alt={r.name} loading="lazy" className="h-full w-full object-cover group-hover:scale-103 transition-transform duration-300" />
        
        {/* Favorite Icon */}
        <button 
          onClick={(e) => toggleFavourite(r.id, e)}
          className="absolute top-2 left-2 p-1.5 bg-white/90 hover:bg-white border border-[#EEE7E1] rounded-full text-[#6B6B6B] hover:text-[#E85D3F] transition-colors shadow-xs"
        >
          <Heart className={`w-3.5 h-3.5 ${favourites.includes(r.id) ? 'fill-[#E85D3F] text-[#E85D3F]' : ''}`} />
        </button>

        {/* Rating Badge */}
        <span className="absolute top-2 right-2 bg-white/90 border border-[#EEE7E1] backdrop-blur-md px-2 py-0.5 rounded-full text-[9px] font-extrabold text-[#242424] flex items-center gap-0.5 shadow-xs">
          <Star className="w-2.5 h-2.5 text-[#F4B942] fill-current" /> {r.rating}
        </span>
      </div>

      <div className="p-3.5 space-y-2 text-left">
        <div>
          <h4 
            onClick={() => navigate(`/customer/restaurant/${r.id}`)}
            className="text-xs font-extrabold text-[#242424] group-hover:text-[#E85D3F] transition-colors cursor-pointer truncate"
          >
            {r.name}
          </h4>
          
          <div className="flex items-center space-x-1.5 text-[9px] text-[#6B6B6B] font-semibold mt-0.5">
            <span className="text-[#6B6B6B]">{r.cuisine}</span>
            <span>•</span>
            <span className="text-[#6B6B6B]">{r.priceRange}</span>
          </div>
        </div>

        {/* Dynamic Distance */}
        <div className="flex justify-between items-center text-[9px] text-[#6B6B6B] pt-1.5 border-t border-[#EEE7E1]">
          <span className="flex items-center gap-0.5 font-medium">
            <MapPin className="w-2.5 h-2.5 text-[#E85D3F]" /> 
            {r.distance ? `${r.distance.toFixed(1)} mi` : '0.8 mi'}
          </span>
          <span className="text-[#22A06B] font-bold">{r.availableTables} tables left</span>
        </div>

        <div className="grid grid-cols-2 gap-1.5 mt-1">
          <button 
            onClick={() => navigate(`/customer/restaurant/${r.id}/menu`)}
            className="py-1.5 bg-[#FFF8F2] border border-[#EEE7E1] hover:border-[#E85D3F]/40 text-[9.5px] font-extrabold text-[#242424] rounded-xl transition-all text-center cursor-pointer"
          >
            Menu
          </button>
          <button 
            onClick={() => navigate(`/customer/booking?tenantId=${r.id}`)}
            className="py-1.5 bg-[#E85D3F] hover:bg-[#D04B2F] text-[9.5px] font-extrabold text-white rounded-xl transition-all text-center shadow-xs cursor-pointer"
          >
            Book Table
          </button>
        </div>
      </div>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="py-20 text-center">
        <LoadingSpinner label="Discovering top dining venues near you..." />
      </div>
    );
  }

  return (
    <div className="space-y-8 text-left pb-16 w-full select-none">
      
      {/* 1. HERO COVER BANNER */}
      <div className="relative min-h-[220px] md:min-h-[260px] rounded-3xl overflow-hidden border border-[#EEE7E1] bg-gradient-to-br from-[#FFF8F2] via-[#FFFCF9] to-[#FFF3EB] flex items-center p-6 md:p-10 shadow-sm">
        <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-cover bg-center opacity-40 pointer-events-none rounded-r-3xl" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1200&auto=format&fit=crop')` }} />
        <div className="absolute inset-0 bg-gradient-to-r from-[#FFFCF9] via-[#FFFCF9]/90 to-transparent pointer-events-none" />
        <div className="relative space-y-3 max-w-xl z-10">
          <Badge variant="primary" className="text-[9px] py-1 px-3 bg-[#E85D3F] text-white font-extrabold tracking-widest uppercase rounded-full shadow-xs border-0">
            🍴 Premium Culinary Platform
          </Badge>
          <h2 className="text-2xl md:text-4xl font-display font-extrabold text-[#242424] leading-tight tracking-tight">
            Good food. <br />
            <span className="text-[#E85D3F]">Good mood. 🍴</span>
          </h2>
          <p className="text-xs md:text-sm text-[#6B6B6B] font-medium leading-relaxed">
            Discover great restaurants around you, explore gourmet menus, and reserve tables seamlessly.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={() => navigate('/customer/explore')}
              className="px-5 py-2.5 bg-[#E85D3F] hover:bg-[#D04B2F] text-white font-extrabold text-xs rounded-xl shadow-md shadow-[#E85D3F]/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Explore Restaurants</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => navigate('/customer/booking')}
              className="px-5 py-2.5 bg-white border border-[#EEE7E1] hover:border-[#E85D3F]/40 text-[#242424] font-extrabold text-xs rounded-xl transition-all shadow-xs cursor-pointer"
            >
              Book a Table
            </button>
          </div>
        </div>
      </div>

      {/* 2. LOCATION PICKER BAR */}
      <div className="p-3 bg-[#FFF8F2] border border-[#EEE7E1] rounded-2xl flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-[#E85D3F]/10 border border-[#E85D3F]/20 rounded-xl flex items-center justify-center text-[#E85D3F] shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[8.5px] text-[#6B6B6B] font-extrabold uppercase tracking-wider block">Dining Location</span>
            <button 
              onClick={() => setIsLocationModalOpen(true)}
              className="text-xs font-bold text-[#242424] hover:text-[#E85D3F] flex items-center gap-0.5 cursor-pointer"
            >
              <span>{currentLocation ? currentLocation.label : 'Select City'}</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#6B6B6B]" />
            </button>
          </div>
        </div>
        <button
          onClick={() => handleDetectLocation(false)}
          className="px-3 py-1.5 bg-white border border-[#EEE7E1] hover:border-[#E85D3F]/40 text-xs font-bold text-[#242424] rounded-xl transition-all shadow-xs shrink-0 flex items-center gap-1 cursor-pointer"
        >
          <Locate className="w-3.5 h-3.5 text-[#E85D3F]" />
          <span className="hidden sm:inline">Detect</span>
        </button>
      </div>

      {/* 3. UNIVERSAL SEARCH + FILTER ROW */}
      <div className="flex gap-2 items-center" ref={suggestionsRef}>
        {/* Search Field */}
        <div className="flex-1 relative shadow-xs rounded-2xl bg-white border border-[#EEE7E1]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B6B]" />
          <input 
            type="text" 
            value={localSearchVal}
            onChange={(e) => {
              setLocalSearchVal(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Search for restaurants, cuisines or dishes..." 
            className="w-full pl-10 pr-8 py-3 bg-transparent text-xs text-[#242424] placeholder-[#6B6B6B] focus:outline-none"
          />
          {localSearchVal && (
            <button 
              type="button"
              onClick={() => {
                setLocalSearchVal('');
                setSearchQuery('');
                setShowSuggestions(false);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-[#FFF8F2] rounded-full text-[#6B6B6B]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Autocomplete suggestions panel */}
          {showSuggestions && searchSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#EEE7E1] rounded-2xl shadow-xl p-1.5 z-40 divide-y divide-[#EEE7E1]">
              {searchSuggestions.map((sug, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setLocalSearchVal(sug);
                    setSearchQuery(sug);
                    setShowSuggestions(false);
                  }}
                  className="w-full text-left px-3 py-2.5 text-xs font-bold text-[#242424] hover:bg-[#FFF8F2] rounded-xl flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <Search className="w-3.5 h-3.5 text-[#E85D3F]" />
                    <span>{sug}</span>
                  </div>
                  <span className="text-[8px] bg-[#FFF8F2] border border-[#EEE7E1] px-1.5 py-0.5 rounded text-[#E85D3F] font-extrabold uppercase">Match</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Filter Button */}
        <button
          type="button"
          onClick={() => setIsFilterModalOpen(true)}
          className={`p-3 border rounded-2xl transition-all shadow-xs cursor-pointer ${
            filterCuisine !== 'All' || filterPrice !== 'All' || filterOutdoor || filterRooftop || filterLiveMusic || showOpenNow || showTopRated || showNearbyOnly || showVegOnly || showNonVegOnly || showOffersOnly
              ? 'bg-[#E85D3F] border-[#E85D3F] text-white font-bold'
              : 'bg-white border-[#EEE7E1] hover:border-[#E85D3F]/40 text-[#242424]'
          }`}
        >
          <Filter className="w-4.5 h-4.5" />
        </button>
      </div>

      {/* 4. DINING CATEGORY CHIPS */}
      <div className="space-y-2 select-none">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#6B6B6B]">Explore Categories</h3>
        <div className="flex space-x-2.5 overflow-x-auto pb-1.5 scrollbar-none">
          {DINING_EXPERIENCES.map((exp) => {
            const Icon = exp.icon;
            const isSelected = activeExperience === exp.filter;
            return (
              <button
                key={exp.id}
                onClick={() => {
                  setActiveExperience(prev => prev === exp.filter ? 'All' : exp.filter);
                }}
                className={`py-2 px-3.5 border rounded-full text-xs font-extrabold flex items-center space-x-1.5 transition-all shrink-0 cursor-pointer shadow-xs ${
                  isSelected 
                    ? 'bg-[#E85D3F] border-[#E85D3F] text-white' 
                    : 'bg-[#FFF8F2] border-[#EEE7E1] text-[#242424] hover:border-[#E85D3F]/40'
                }`}
              >
                <Icon className="w-3.5 h-3.5 text-[#E85D3F]" />
                <span>{exp.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. TOP RATED RESTAURANTS NEAR YOU */}
      {topRatedNearYou.length > 0 && (
        <div className="space-y-3 select-none text-left">
          <div className="flex justify-between items-center pr-1">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#242424]">Top Rated Near You ⭐</h3>
            <span onClick={() => navigate('/customer/explore')} className="text-xs text-[#E85D3F] font-extrabold hover:underline cursor-pointer">View All</span>
          </div>
          <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory">
            {topRatedNearYou.slice(0, 4).map(r => (
              <MiniHorizontalCard key={r.id} r={r} />
            ))}
          </div>
        </div>
      )}

      {/* 6. RECOMMENDED RESTAURANTS */}
      {recommendedRestaurants.length > 0 && (
        <div className="space-y-3 select-none text-left">
          <div className="flex justify-between items-center pr-1">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#242424]">Recommended For You ✨</h3>
            <span onClick={() => navigate('/customer/explore')} className="text-xs text-[#E85D3F] font-extrabold hover:underline cursor-pointer">View All</span>
          </div>
          <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory">
            {recommendedRestaurants.slice(0, 4).map(r => (
              <MiniHorizontalCard key={r.id} r={r} />
            ))}
          </div>
        </div>
      )}

      {/* 7. POPULAR NEARBY */}
      {popularNearYouList.length > 0 && (
        <div className="space-y-3 select-none text-left">
          <div className="flex justify-between items-center pr-1">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#242424]">Popular Nearby 🏷️</h3>
            <span onClick={() => navigate('/customer/explore')} className="text-xs text-[#E85D3F] font-extrabold hover:underline cursor-pointer">View All</span>
          </div>
          <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory">
            {popularNearYouList.slice(0, 4).map(r => (
              <MiniHorizontalCard key={r.id} r={r} />
            ))}
          </div>
        </div>
      )}

      {/* 8. ALL RESTAURANTS */}
      <div className="space-y-4 text-left select-none pt-2" id="all-dining-venues-header">
        <div className="flex justify-between items-center pr-1">
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#242424]">Restaurants Near You</h3>
            <p className="text-xs text-[#6B6B6B] font-semibold mt-0.5">Explore {filteredRestaurants.length} onboarded dining venues</p>
          </div>
          {(filterCuisine !== 'All' || filterPrice !== 'All' || filterOutdoor || filterRooftop || filterLiveMusic || showOpenNow || showTopRated || showNearbyOnly || showVegOnly || showNonVegOnly || showOffersOnly) && (
            <button 
              onClick={handleResetFilters}
              className="text-xs text-[#E85D3F] hover:underline font-extrabold cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>

        {filteredRestaurants.length === 0 ? (
          <div className="py-16 text-center border-2 border-dashed border-[#EEE7E1] rounded-3xl bg-white p-8 space-y-3 shadow-xs">
            <div className="w-12 h-12 bg-[#FFF8F2] border border-[#EEE7E1] rounded-2xl flex items-center justify-center text-[#E85D3F] mx-auto">
              <Utensils className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-extrabold text-[#242424]">Nothing delicious nearby yet.</h4>
              <p className="text-xs text-[#6B6B6B] max-w-sm mx-auto">Check back soon or clear search filters to discover restaurants in other areas!</p>
            </div>
            <button 
              onClick={handleResetFilters}
              className="px-4 py-2 bg-[#FFF8F2] border border-[#EEE7E1] hover:border-[#E85D3F]/40 text-xs font-bold text-[#E85D3F] rounded-xl transition-all cursor-pointer"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredRestaurants.map(r => (
              <Card 
                key={r.id}
                className="group bg-white border border-[#EEE7E1] hover:border-[#E85D3F]/40 rounded-2xl overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-md transition-all relative select-none"
              >
                <div className="h-36 w-full overflow-hidden relative bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 flex items-center justify-center">
                  {r.image ? (
                    <img src={r.image} alt={r.name} loading="lazy" className="h-full w-full object-cover group-hover:scale-103 transition-transform duration-300" />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-3 select-none">
                      <div className="w-10 h-10 rounded-xl bg-[#E85D3F]/15 border border-[#E85D3F]/30 flex items-center justify-center text-[#E85D3F] font-extrabold text-sm mb-1 shadow-inner">
                        {r.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-[11px] font-extrabold text-white truncate max-w-[150px]">{r.name}</span>
                    </div>
                  )}
                  
                  {/* Favourites Button */}
                  <button 
                    onClick={(e) => toggleFavourite(r.id, e)}
                    className="absolute top-2.5 left-2.5 p-1.5 bg-white/90 hover:bg-white border border-[#EEE7E1] rounded-full text-[#6B6B6B] hover:text-[#E85D3F] transition-colors shadow-xs"
                  >
                    <Heart className={`w-3.5 h-3.5 ${favourites.includes(r.id) ? 'fill-[#E85D3F] text-[#E85D3F]' : ''}`} />
                  </button>

                  {/* Rating Badge */}
                  <span className="absolute top-2.5 right-2.5 bg-white/90 border border-[#EEE7E1] backdrop-blur-md px-2 py-0.5 rounded-full text-[9px] font-extrabold text-[#242424] flex items-center gap-0.5 shadow-xs">
                    <Star className="w-2.5 h-2.5 text-[#F4B942] fill-current" /> {r.rating} ({r.reviewsCount})
                  </span>

                  {/* Operational Status */}
                  <span className="absolute bottom-2.5 left-2.5">
                    {r.openNow ? (
                      <Badge variant="success" className="text-[8px] uppercase tracking-wider py-0.5 px-2 border-0 font-extrabold bg-[#22A06B] text-white shadow-xs">Open Now</Badge>
                    ) : (
                      <Badge variant="muted" className="text-[8px] uppercase tracking-wider py-0.5 px-2 border-0 font-extrabold bg-[#6B6B6B] text-white">Closed</Badge>
                    )}
                  </span>

                  {/* Table Availability */}
                  <span className="absolute bottom-2.5 right-2.5 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full text-[9px] font-extrabold text-[#E85D3F] border border-[#EEE7E1] shadow-xs">
                    {r.availableTables} Tables Left
                  </span>
                </div>

                <div className="p-4 space-y-3">
                  <div className="space-y-1 text-left">
                    <div className="flex justify-between items-start gap-2">
                      <h4 
                        onClick={() => navigate(`/customer/restaurant/${r.id}`)}
                        className="text-sm font-extrabold text-[#242424] group-hover:text-[#E85D3F] transition-colors cursor-pointer truncate"
                      >
                        {r.name}
                      </h4>
                    </div>
                    
                    <div className="flex items-center space-x-1.5 text-xs text-[#6B6B6B] font-semibold">
                      <span>{r.cuisine}</span>
                      <span>•</span>
                      <span>{r.priceRange}</span>
                      <span>•</span>
                      <span>{r.area}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#EEE7E1]">
                    <button 
                      onClick={() => navigate(`/customer/restaurant/${r.id}/menu`)}
                      className="py-2 bg-[#FFF8F2] border border-[#EEE7E1] hover:border-[#E85D3F]/40 text-xs font-extrabold text-[#242424] rounded-xl transition-all text-center cursor-pointer"
                    >
                      View Menu
                    </button>
                    <button 
                      onClick={() => navigate(`/customer/booking?tenantId=${r.id}`)}
                      className="py-2 bg-[#E85D3F] hover:bg-[#D04B2F] text-xs font-extrabold text-white rounded-xl transition-all text-center shadow-xs cursor-pointer"
                    >
                      Book Table
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* FILTER DRAWER SLIDE-OVER OVERLAY MODAL */}
      <Modal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        title="Refine Dining Choices"
        className="max-w-md"
      >
        <div className="space-y-4 text-left text-xs select-none">
          
          {/* Cuisine selection */}
          <div className="space-y-1">
            <label className="text-[9.5px] text-slate-500 font-extrabold uppercase">Cuisine Type</label>
            <select 
              value={filterCuisine} 
              onChange={e => setFilterCuisine(e.target.value)}
              className="w-full bg-slate-950 border border-slate-900 text-white p-2.5 rounded-xl focus:outline-none"
            >
              <option value="All">All Cuisines</option>
              <option value="Italian">Italian Fine Dining</option>
              <option value="Japanese">Japanese Omakase</option>
              <option value="French">French Haute Cuisine</option>
              <option value="Indian">Traditional Indian</option>
              <option value="Mexican">Authentic Mexican</option>
            </select>
          </div>

          {/* Pricing level selector */}
          <div className="space-y-1">
            <label className="text-[9.5px] text-slate-500 font-extrabold uppercase">Price Bracket</label>
            <div className="grid grid-cols-4 gap-1.5">
              {['All', '$', '$$', '$$$'].map(pr => (
                <button
                  key={pr}
                  type="button"
                  onClick={() => setFilterPrice(pr)}
                  className={`py-2 border rounded-xl font-bold transition-all ${
                    filterPrice === pr
                      ? 'bg-primary/10 border-primary text-primary font-extrabold'
                      : 'bg-slate-950 border-slate-900 text-slate-450 hover:text-slate-200'
                  }`}
                >
                  {pr === 'All' ? 'All Prices' : pr}
                </button>
              ))}
            </div>
          </div>

          {/* Facilities filters checklist */}
          <div className="space-y-2">
            <span className="text-[9.5px] text-slate-500 font-extrabold uppercase">Ambience & Facility Tags</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setFilterOutdoor(!filterOutdoor)}
                className={`py-2 px-3 border rounded-xl font-bold flex items-center justify-between transition-all ${
                  filterOutdoor ? 'bg-primary/10 border-primary text-primary font-extrabold' : 'bg-slate-950 border-slate-900 text-slate-450'
                }`}
              >
                <span>Outdoor Seating</span>
                {filterOutdoor && <Check className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => setFilterRooftop(!filterRooftop)}
                className={`py-2 px-3 border rounded-xl font-bold flex items-center justify-between transition-all ${
                  filterRooftop ? 'bg-primary/10 border-primary text-primary font-extrabold' : 'bg-slate-950 border-slate-900 text-slate-450'
                }`}
              >
                <span>Rooftop Ambience</span>
                {filterRooftop && <Check className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => setFilterLiveMusic(!filterLiveMusic)}
                className={`py-2 px-3 border rounded-xl font-bold flex items-center justify-between transition-all ${
                  filterLiveMusic ? 'bg-primary/10 border-primary text-primary font-extrabold' : 'bg-slate-950 border-slate-900 text-slate-450'
                }`}
              >
                <span>Live Music Nights</span>
                {filterLiveMusic && <Check className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Toggles checklist */}
          <div className="space-y-2 pt-2 border-t border-slate-900">
            <span className="text-[9.5px] text-slate-500 font-extrabold uppercase">Quick Toggle Filters</span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { state: showOpenNow, setter: setShowOpenNow, label: 'Open Now' },
                { state: showTopRated, setter: setShowTopRated, label: 'Top Rated (4.7+)' },
                { state: showNearbyOnly, setter: setShowNearbyOnly, label: 'Nearby (< 2 mi)' },
                { state: showVegOnly, setter: setShowVegOnly, label: 'Vegetarian' },
                { state: showNonVegOnly, setter: setShowNonVegOnly, label: 'Non-Vegetarian' },
                { state: showOffersOnly, setter: setShowOffersOnly, label: 'With Offers' }
              ].map((filt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => filt.setter(!filt.state)}
                  className={`py-2 px-3 border rounded-xl font-bold flex items-center justify-between transition-all ${
                    filt.state ? 'bg-primary/10 border-primary text-primary font-extrabold' : 'bg-slate-950 border-slate-900 text-slate-450'
                  }`}
                >
                  <span>{filt.label}</span>
                  {filt.state && <Check className="w-3.5 h-3.5 text-primary" />}
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={handleResetFilters}
              className="flex-1 py-3 bg-slate-950 hover:bg-slate-900 border border-slate-850 text-[10px] text-slate-350 font-bold rounded-xl"
            >
              Reset All
            </button>
            <button
              type="button"
              onClick={() => setIsFilterModalOpen(false)}
              className="flex-1 py-3 bg-primary hover:bg-amber-500 text-slate-950 text-[10px] font-extrabold rounded-xl shadow shadow-primary/10 text-center"
            >
              Apply Filters
            </button>
          </div>

        </div>
      </Modal>

      {/* LOCATION SELECTION MODAL */}
      <Modal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        title="Choose Dining Location"
        className="max-w-md"
      >
        <div className="space-y-4 text-left text-xs select-none">
          
          <button
            onClick={() => {
              handleDetectLocation(false);
              setIsLocationModalOpen(false);
            }}
            className="w-full p-3 bg-primary/10 hover:bg-primary/15 border border-primary/20 hover:border-primary/30 text-primary font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
          >
            <Locate className="w-4 h-4" />
            <span>Detect My Current Location (GPS)</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[9px] text-slate-500 font-extrabold uppercase">Search City</label>
              <div className="relative bg-slate-950 border border-slate-850 rounded-xl overflow-hidden">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Enter city..."
                  value={citySearchQuery}
                  onChange={(e) => setCitySearchQuery(e.target.value)}
                  className="w-full pl-8 pr-2 py-2.5 bg-transparent text-white placeholder-slate-550 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] text-slate-500 font-extrabold uppercase">Search Area</label>
              <div className="relative bg-slate-950 border border-slate-850 rounded-xl overflow-hidden">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Enter area..."
                  value={areaSearchQuery}
                  onChange={(e) => setAreaSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-2 py-2.5 bg-transparent text-white placeholder-slate-550 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {(recentLocations.length > 0 || savedLocations.length > 0) && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              {recentLocations.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[9px] text-slate-500 font-extrabold uppercase">Recents</span>
                  <div className="space-y-1">
                    {recentLocations.map((loc, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectLocation(loc)}
                        className="w-full text-left p-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-850 rounded-xl font-semibold text-slate-350 hover:text-white transition-all flex items-center gap-1.5 truncate"
                      >
                        <Clock className="w-3 h-3 text-slate-550 shrink-0" />
                        <span className="truncate">{loc.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {savedLocations.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[9px] text-slate-500 font-extrabold uppercase">Saved</span>
                  <div className="space-y-1">
                    {savedLocations.map((loc, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          const selected = {
                            country: 'India',
                            state: '',
                            city: loc.city,
                            area: loc.area,
                            latitude: loc.lat,
                            longitude: loc.lng,
                            label: loc.label
                          };
                          handleSelectLocation(selected);
                        }}
                        className="w-full text-left p-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-850 rounded-xl font-semibold text-slate-350 hover:text-white transition-all flex items-center gap-1.5 truncate"
                      >
                        <Heart className="w-3 h-3 text-primary shrink-0" />
                        <span className="truncate">{loc.name}: {loc.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {dynamicCitiesList.length > 0 && (
            <div className="space-y-2 pt-1 border-t border-slate-900">
              <span className="text-[9px] text-slate-555 font-extrabold uppercase">Eatery Branches Locations</span>
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {dynamicCitiesList.map((cityObj) => (
                  <div key={cityObj.name} className="p-2.5 bg-slate-950 border border-slate-900 rounded-xl space-y-1.5">
                    <button
                      onClick={() => {
                        const selected = {
                          country: 'India',
                          state: '',
                          city: cityObj.name,
                          area: 'All Areas',
                          latitude: cityObj.lat,
                          longitude: cityObj.lng,
                          label: cityObj.name
                        };
                        handleSelectLocation(selected);
                      }}
                      className="text-xs font-bold text-white hover:text-primary transition-colors text-left"
                    >
                      {cityObj.name} (All Areas)
                    </button>
                    {cityObj.areas.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {cityObj.areas.map(area => (
                          <button
                            key={area}
                            onClick={() => {
                              const selected = {
                                country: 'India',
                                state: '',
                                city: cityObj.name,
                                area: area,
                                latitude: cityObj.lat,
                                longitude: cityObj.lng,
                                label: `${area}, ${cityObj.name}`
                              };
                              handleSelectLocation(selected);
                            }}
                            className={`py-0.5 px-2 border rounded-lg text-[9px] font-semibold transition-all ${
                              currentLocation?.city.toLowerCase() === cityObj.name.toLowerCase() && currentLocation?.area.toLowerCase() === area.toLowerCase()
                                ? 'bg-primary/10 border-primary text-primary font-bold'
                                : 'bg-slate-900 border-slate-850 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {area}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2 pt-1 border-t border-slate-900">
            <span className="text-[9px] text-slate-500 font-extrabold uppercase">Popular Cities</span>
            <div className="grid grid-cols-3 gap-1.5">
              {filteredPopularCities.map((city) => (
                <button
                  key={city.name}
                  onClick={() => {
                    const selected = {
                      country: 'India',
                      state: '',
                      city: city.name,
                      area: 'All Areas',
                      latitude: city.lat,
                      longitude: city.lng,
                      label: city.name
                    };
                    handleSelectLocation(selected);
                  }}
                  className={`py-2 border rounded-xl font-bold text-center transition-all truncate block ${
                    currentLocation?.city.toLowerCase() === city.name.toLowerCase()
                      ? 'bg-primary/10 border-primary text-primary font-extrabold shadow-sm'
                      : 'bg-slate-950 border-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {city.name}
                </button>
              ))}
            </div>
          </div>

        </div>
      </Modal>

    </div>
  );
};

export default CustomerHome;
