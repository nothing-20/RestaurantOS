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
    if (new RegExp(`\\b${area.replace(/\s+/g, '\\s+')}\\b`, 'i').test(street)) {
      return area;
    }
  }
  const parts = street.split(',').map(p => p.trim()).filter(Boolean);
  if (parts.length > 1) {
    const candidate = parts[parts.length - 1];
    if (candidate.length < 35 && !/\d{5,6}/.test(candidate)) {
      return candidate;
    }
  }
  return fallbackCity;
}

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

  // Location Hub States (defaulting cleanly to Hyderabad, where onboarded dining venues exist)
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

    const saved = localStorage.getItem('diner_location');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Normalize saved location if city is missing or corrupted
        if (!parsed.city) {
          localStorage.setItem('diner_location', JSON.stringify(defaultHyd));
          return defaultHyd;
        }
        return parsed;
      } catch (_) {}
    }
    
    localStorage.setItem('diner_location', JSON.stringify(defaultHyd));
    return defaultHyd;
  });

  const [recentLocations, setRecentLocations] = useState<any[]>(() => {
    const saved = localStorage.getItem('recent_locations');
    return saved ? JSON.parse(saved) : [];
  });

  const [savedLocations] = useState<any[]>(() => [
    { name: 'Hyderabad Central', label: 'Hyderabad, Telangana', city: 'Hyderabad', area: 'All Areas', lat: 17.3850, lng: 78.4867 },
    { name: 'Hitech City', label: 'Hitech City, Hyderabad', city: 'Hyderabad', area: 'Hitech City', lat: 17.4435, lng: 78.3772 },
    { name: 'Jubilee Hills', label: 'Jubilee Hills, Hyderabad', city: 'Hyderabad', area: 'Jubilee Hills', lat: 17.4319, lng: 78.4073 }
  ]);

  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [areaSearchQuery, setAreaSearchQuery] = useState('');

  // Primary Data States
  const [restaurantsList, setRestaurantsList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
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

  // Listen to open_location_modal and diner_location_changed events dispatched by header/layout
  useEffect(() => {
    const handleOpenLocation = () => {
      setIsLocationModalOpen(true);
    };

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

    window.addEventListener('open_location_modal', handleOpenLocation);
    window.addEventListener('diner_location_changed', handleLocationChanged);
    window.addEventListener('storage', handleLocationChanged);

    return () => {
      window.removeEventListener('open_location_modal', handleOpenLocation);
      window.removeEventListener('diner_location_changed', handleLocationChanged);
      window.removeEventListener('storage', handleLocationChanged);
    };
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
    setIsLoading(true);
    setLoadError(null);

    const qTenants = query(collection(db, 'tenants'), limit(50));
    const unsubscribe = onSnapshot(qTenants, (snap) => {
      const list: any[] = [];
      snap.forEach(d => {
        const data = d.data();
        
        // Only include active restaurants
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
          supportsSeatPreference: Boolean(data.supportsSeatPreference),
          availableTables: typeof data.availableTables === 'number' ? data.availableTables : null,
          waitingTime: data.waitingTime || null,
          facilities: data.facilities || null
        });
      });

      setRestaurantsList(list);
      setIsLoading(false);
    }, (error) => {
      console.error('[CustomerHome] Failed to stream restaurants from Firestore:', error);
      setLoadError('Unable to load restaurants. Please check your network connection.');
      setRestaurantsList([]);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Detect GPS location with smart metro resolution
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
            const state = data.address.state || 'Telangana';
            
            const rawCity = data.address.city || data.address.town || data.address.village || data.address.county || data.address.state_district || '';
            const suburb = data.address.suburb || data.address.neighbourhood || data.address.road || '';
            const area = suburb || 'All Areas';
            const resolvedCity = rawCity || 'Hyderabad';
            
            const newLoc = {
              country,
              state,
              city: resolvedCity,
              area: 'All Areas', // Keep area as 'All Areas' by default so all city restaurants are visible
              latitude,
              longitude,
              label: `${area && area !== 'All Areas' ? area + ', ' : ''}${resolvedCity}`
            };
            setCurrentLocation(newLoc);
            localStorage.setItem('diner_location', JSON.stringify(newLoc));
            window.dispatchEvent(new Event('diner_location_changed'));
            addToRecentLocations(newLoc);
            toast.success(`Location set: ${newLoc.label}`);
          } else {
            const newLoc = {
              country: 'India',
              state: 'Telangana',
              city: 'Hyderabad',
              area: 'All Areas',
              latitude,
              longitude,
              label: 'Hyderabad, Telangana'
            };
            setCurrentLocation(newLoc);
            localStorage.setItem('diner_location', JSON.stringify(newLoc));
            window.dispatchEvent(new Event('diner_location_changed'));
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
    window.dispatchEvent(new Event('diner_location_changed'));
    addToRecentLocations(loc);
    setIsLocationModalOpen(false);
    toast.success(`Dining city set to ${loc.label}`);
  };

  const handleSelectCity = (cityName: string) => {
    const matchedCity = POPULAR_CITIES.find(c => c.name.toLowerCase() === cityName.toLowerCase());
    handleSelectLocation({
      country: 'India',
      state: cityName.toLowerCase() === 'hyderabad' ? 'Telangana' : '',
      city: cityName,
      area: 'All Areas',
      latitude: matchedCity ? matchedCity.lat : 17.3850,
      longitude: matchedCity ? matchedCity.lng : 78.4867,
      label: `${cityName}, India`
    });
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

  // Processed Restaurants (proximity distance if coordinates exist)
  const processedRestaurants = useMemo(() => {
    if (!currentLocation) return restaurantsList;
    return restaurantsList.map(r => {
      let distance: number | null = null;
      let travelTime: string | null = null;
      if (currentLocation.latitude && currentLocation.longitude && r.latitude && r.longitude) {
        distance = calculateDistance(
          currentLocation.latitude,
          currentLocation.longitude,
          r.latitude,
          r.longitude
        );
        const travelMins = Math.ceil(distance * 3.5 + 4);
        travelTime = travelMins > 60 
          ? `${Math.floor(travelMins/60)}h ${travelMins%60}m drive`
          : `${travelMins} mins drive`;
      }
      return { ...r, distance, travelTime };
    }).sort((a, b) => {
      if (a.distance !== null && b.distance !== null) return a.distance - b.distance;
      if (a.distance !== null && b.distance === null) return -1;
      if (a.distance === null && b.distance !== null) return 1;
      return 0;
    });
  }, [restaurantsList, currentLocation]);

  // Main universal filter list
  const filteredRestaurants = useMemo(() => {
    let result = [...processedRestaurants];

    // 1. Filter by Selected Location City/Area
    if (currentLocation && currentLocation.city && currentLocation.city !== 'All Cities') {
      const curCity = currentLocation.city.toLowerCase().trim();
      result = result.filter(r => {
        const rCity = (r.city || '').toLowerCase().trim();
        
        // Match city name
        const matchesCity = rCity === curCity || rCity.includes(curCity) || curCity.includes(rCity);
        if (!matchesCity) return false;

        // If a specific area within the city is selected (not 'All Areas' and not the city name)
        if (currentLocation.area && currentLocation.area !== 'All Areas' && currentLocation.area.toLowerCase() !== curCity) {
          const curArea = currentLocation.area.toLowerCase().trim();
          const rArea = (r.area || '').toLowerCase();
          const rStreet = (r.street || '').toLowerCase();
          return rArea.includes(curArea) || rStreet.includes(curArea);
        }

        return true;
      });
    }

    // 2. Search query matching (across name, cuisine, area, city, street, and description)
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

    // 3. Experience filter
    if (activeExperience !== 'All') {
      result = result.filter(r => {
        const cLower = (r.cuisine || '').toLowerCase();
        const nLower = (r.name || '').toLowerCase();
        const dLower = (r.description || '').toLowerCase();

        if (activeExperience === 'Fine Dining') {
          return cLower.includes('fine') || cLower.includes('haute') || cLower.includes('barbecue') || nLower.includes('barbecue') || Boolean(r.facilities?.fineDining);
        }
        if (activeExperience === 'Family') {
          return true; // All onboarded restaurants are family dining venues
        }
        if (activeExperience === 'Rooftop') {
          return Boolean(r.facilities?.rooftop || cLower.includes('rooftop') || dLower.includes('rooftop'));
        }
        if (activeExperience === 'Romantic') {
          return Boolean(r.facilities?.romantic || r.facilities?.outdoorSeating || cLower.includes('romantic') || dLower.includes('romantic'));
        }
        if (activeExperience === 'Buffet') {
          return Boolean(r.facilities?.buffet || cLower.includes('buffet') || nLower.includes('barbecue') || nLower.includes("ab's") || dLower.includes('buffet'));
        }
        if (activeExperience === 'Cafe') {
          return Boolean(cLower.includes('cafe') || cLower.includes('coffee') || cLower.includes('bakery') || nLower.includes('cafe'));
        }
        if (activeExperience === 'Live Music') {
          return Boolean(r.facilities?.liveMusic || dLower.includes('music'));
        }
        if (activeExperience === 'Pocket Friendly') {
          return r.priceRange === '$' || (r.priceRange && r.priceRange.length === 1) || cLower.includes('pocket');
        }
        if (activeExperience === 'Outdoor') {
          return Boolean(r.facilities?.outdoorSeating || dLower.includes('outdoor'));
        }
        return true;
      });
    }

    // 4. Advanced modal filters
    if (filterCuisine !== 'All') {
      result = result.filter(r => (r.cuisine || '').toLowerCase().includes(filterCuisine.toLowerCase()));
    }
    if (filterPrice !== 'All') {
      result = result.filter(r => r.priceRange === filterPrice);
    }
    if (filterOutdoor) {
      result = result.filter(r => Boolean(r.facilities?.outdoorSeating));
    }
    if (filterRooftop) {
      result = result.filter(r => Boolean(r.facilities?.rooftop));
    }
    if (filterLiveMusic) {
      result = result.filter(r => Boolean(r.facilities?.liveMusic));
    }

    // 5. Sticky Filter toggles
    if (showOpenNow) result = result.filter(r => r.openNow);
    if (showTopRated) result = result.filter(r => r.rating !== null && r.rating >= 4.0);
    if (showNearbyOnly) result = result.filter(r => r.distance !== null && r.distance <= 10.0);
    if (showVegOnly) result = result.filter(r => r.vegOptions);
    if (showNonVegOnly) result = result.filter(r => r.nonVegOptions);
    if (showOffersOnly) result = result.filter(r => r.hasOffer);

    return result;
  }, [
    processedRestaurants, currentLocation, searchQuery, activeExperience, 
    filterCuisine, filterPrice, filterOutdoor, filterRooftop, filterLiveMusic,
    showOpenNow, showTopRated, showNearbyOnly, showVegOnly, showNonVegOnly, showOffersOnly
  ]);

  // Aggregate dynamic onboarding areas from real restaurants
  const dynamicCitiesList = useMemo(() => {
    const citiesMap: Record<string, { name: string; lat: number; lng: number; areas: Set<string> }> = {};
    restaurantsList.forEach(r => {
      if (r.city) {
        const cityKey = r.city.toLowerCase();
        if (!citiesMap[cityKey]) {
          citiesMap[cityKey] = { name: r.city, lat: r.latitude || 17.3850, lng: r.longitude || 78.4867, areas: new Set<string>() };
        }
        if (r.area && r.area.toLowerCase() !== cityKey && r.area !== 'All Areas') {
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

  // Autocomplete Suggestions from real restaurant data
  const searchSuggestions = useMemo(() => {
    const val = localSearchVal.toLowerCase().trim();
    if (!val || val.length < 2) return [];

    const matches = new Set<string>();

    restaurantsList.forEach(r => {
      if ((r.name || '').toLowerCase().includes(val)) matches.add(r.name);
      if ((r.cuisine || '').toLowerCase().includes(val)) matches.add(r.cuisine);
      if ((r.area || '').toLowerCase().includes(val)) matches.add(r.area);
      if ((r.street || '').toLowerCase().includes(val)) {
        const parts = r.street.split(',').map((p: string) => p.trim());
        for (const p of parts) {
          if (p.toLowerCase().includes(val)) matches.add(p);
        }
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
    return [...filteredRestaurants]
      .filter(r => r.rating !== null && r.rating >= 4.0)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }, [filteredRestaurants]);

  const recommendedRestaurants = useMemo(() => {
    return [...filteredRestaurants].filter(r => r.isFeatured || favourites.includes(r.id));
  }, [filteredRestaurants, favourites]);

  const popularNearYouList = useMemo(() => {
    return [...filteredRestaurants].slice(0, 4);
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
      className="group bg-white border border-[#E5DCD5] hover:border-[#C85A3F]/50 rounded-2xl overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-md transition-all relative shrink-0 w-60 scroll-snap-align-start select-none"
    >
      <div className="h-28 w-full overflow-hidden relative bg-gradient-to-br from-[#202124] to-[#2B2D31] flex items-center justify-center">
        {r.image ? (
          <img src={r.image} alt={r.name} loading="lazy" className="h-full w-full object-cover group-hover:scale-103 transition-transform duration-300" />
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-2 select-none">
            <div className="w-9 h-9 rounded-xl bg-[#F3E8DF] border border-[#E5DCD5] flex items-center justify-center text-[#C85A3F] font-extrabold text-xs mb-1 shadow-sm">
              {r.name ? r.name.charAt(0).toUpperCase() : 'R'}
            </div>
            <span className="text-[10px] font-extrabold text-white truncate max-w-[140px]">{r.name}</span>
          </div>
        )}
        
        {/* Favorite Icon */}
        <button 
          onClick={(e) => toggleFavourite(r.id, e)}
          className="absolute top-2 left-2 p-1.5 bg-white/90 hover:bg-white border border-[#E5DCD5] rounded-full text-[#756B64] hover:text-[#C85A3F] transition-colors shadow-xs"
        >
          <Heart className={`w-3.5 h-3.5 ${favourites.includes(r.id) ? 'fill-[#C85A3F] text-[#C85A3F]' : ''}`} />
        </button>

        {/* Rating Badge */}
        {r.rating && (
          <span className="absolute top-2 right-2 bg-white/90 border border-[#E5DCD5] backdrop-blur-md px-2 py-0.5 rounded-full text-[9px] font-extrabold text-[#202124] flex items-center gap-0.5 shadow-xs">
            <Star className="w-2.5 h-2.5 text-[#E5A93C] fill-current" /> {r.rating}
          </span>
        )}
      </div>

      <div className="p-3.5 space-y-2 text-left">
        <div>
          <h4 
            onClick={() => navigate(`/customer/restaurant/${r.id}`)}
            className="text-xs font-extrabold text-[#202124] group-hover:text-[#C85A3F] transition-colors cursor-pointer truncate"
          >
            {r.name}
          </h4>
          
          <div className="flex items-center space-x-1.5 text-[9px] text-[#756B64] font-semibold mt-0.5 truncate">
            <span>{r.cuisine}</span>
            {r.area && (
              <>
                <span>•</span>
                <span>{r.area}</span>
              </>
            )}
          </div>
        </div>

        {/* Location / Area info */}
        <div className="flex justify-between items-center text-[9px] text-[#756B64] pt-1.5 border-t border-[#F3E8DF]">
          <span className="flex items-center gap-0.5 font-medium truncate max-w-[140px]" title={r.street || r.area}>
            <MapPin className="w-2.5 h-2.5 text-[#C85A3F] shrink-0" /> 
            {r.distance !== null && r.distance !== undefined ? `${r.distance.toFixed(1)} mi` : (r.area || r.city)}
          </span>
          <span className="text-[#2E8B57] font-bold">{r.currencySymbol}</span>
        </div>

        <div className="grid grid-cols-2 gap-1.5 mt-1">
          <button 
            onClick={() => navigate(`/customer/restaurant/${r.id}/menu`)}
            className="py-1.5 bg-[#F3E8DF]/60 border border-[#E5DCD5] hover:border-[#C85A3F]/50 text-[9.5px] font-extrabold text-[#202124] rounded-xl transition-all text-center cursor-pointer hover:bg-[#F3E8DF]"
          >
            Menu
          </button>
          <button 
            onClick={() => navigate(`/customer/booking?tenantId=${r.id}`)}
            className="py-1.5 bg-[#C85A3F] hover:bg-[#A94332] text-[9.5px] font-extrabold text-white rounded-xl transition-all text-center shadow-xs cursor-pointer"
          >
            Book Table
          </button>
        </div>
      </div>
    </Card>
  );

  // Skeleton loading card
  const SkeletonCard = () => (
    <div className="bg-white border border-[#E5DCD5] rounded-2xl overflow-hidden flex flex-col justify-between shadow-xs animate-pulse">
      <div className="h-36 w-full bg-[#F3E8DF]/70" />
      <div className="p-4 space-y-3">
        <div className="space-y-2">
          <div className="h-4 bg-[#F3E8DF] rounded w-3/4" />
          <div className="h-3 bg-[#F3E8DF]/60 rounded w-1/2" />
        </div>
        <div className="h-3 bg-[#F3E8DF]/40 rounded w-2/3" />
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#F3E8DF]">
          <div className="h-8 bg-[#F3E8DF]/60 rounded-xl" />
          <div className="h-8 bg-[#F3E8DF] rounded-xl" />
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-6 text-left pb-16 w-full select-none">
        {/* Compact Hero Skeleton */}
        <div className="min-h-[140px] md:min-h-[160px] rounded-3xl bg-[#F3E8DF]/50 border border-[#E5DCD5] animate-pulse p-6" />
        
        {/* Context bar skeleton */}
        <div className="h-11 bg-white border border-[#E5DCD5] rounded-2xl animate-pulse" />

        {/* Section title skeleton */}
        <div className="space-y-2 pt-2">
          <div className="h-5 bg-[#F3E8DF] rounded w-48 animate-pulse" />
          <div className="h-3 bg-[#F3E8DF]/60 rounded w-32 animate-pulse" />
        </div>

        {/* Cards Skeleton Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="py-20 text-center space-y-4">
        <p className="text-sm font-bold text-red-500">{loadError}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2.5 bg-[#C85A3F] hover:bg-[#A94332] text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const isGpsNearYou = Boolean(currentLocation?.latitude && currentLocation?.longitude && showNearbyOnly);
  const currentCity = currentLocation?.city || 'Hyderabad';
  const sectionTitle = isGpsNearYou ? "Restaurants Near You" : `Restaurants in ${currentCity}`;
  const sectionSubtitle = `Explore ${filteredRestaurants.length} onboarded dining venue${filteredRestaurants.length === 1 ? '' : 's'}`;

  return (
    <div className="space-y-6 text-left pb-16 w-full select-none">
      
      {/* 1. COMPACT ELEGANT HERO BANNER */}
      <div className="relative min-h-[150px] md:min-h-[175px] rounded-3xl overflow-hidden border border-[#E5DCD5] bg-gradient-to-r from-[#F3E8DF] via-[#FCFAF7] to-[#F3E8DF]/80 flex items-center p-6 md:p-8 shadow-xs">
        <div className="relative space-y-2 max-w-xl z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#F3E8DF] border border-[#E5DCD5] rounded-full text-[9px] font-extrabold text-[#C85A3F] tracking-wide uppercase">
            <span>🍴</span>
            <span>Dining Discovery</span>
          </div>
          <h2 className="text-xl md:text-3xl font-display font-extrabold text-[#202124] leading-tight tracking-tight">
            Discover your next <span className="text-[#C85A3F]">great meal.</span>
          </h2>
          <p className="text-xs md:text-sm text-[#756B64] font-medium leading-relaxed max-w-md">
            Explore restaurants and dining experiences around you.
          </p>
        </div>
      </div>

      {/* 2. CONTEXTUAL LOCATION BAR (Unified with Header) */}
      <div className="px-4 py-3 bg-white border border-[#E5DCD5] rounded-2xl flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="w-8 h-8 bg-[#F3E8DF] border border-[#E5DCD5] rounded-xl flex items-center justify-center text-[#C85A3F] shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
          <div className="truncate">
            <span className="text-xs font-extrabold text-[#202124] block truncate">
              Showing restaurants in <span className="text-[#C85A3F]">{currentCity}</span>
              {currentLocation?.area && currentLocation.area !== 'All Areas' ? ` • ${currentLocation.area}` : ''}
            </span>
            <span className="text-[10px] text-[#756B64] font-medium block">
              {filteredRestaurants.length} venue{filteredRestaurants.length === 1 ? '' : 's'} available
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-2 shrink-0">
          <button 
            type="button"
            onClick={() => setIsLocationModalOpen(true)}
            className="px-3 py-1.5 bg-[#F3E8DF] border border-[#E5DCD5] hover:border-[#C85A3F]/50 text-xs font-bold text-[#C85A3F] rounded-xl transition-all shadow-xs cursor-pointer"
          >
            Change
          </button>
          <button
            type="button"
            onClick={() => handleDetectLocation(false)}
            className="px-3 py-1.5 bg-white border border-[#E5DCD5] hover:border-[#C85A3F]/50 text-xs font-bold text-[#202124] rounded-xl transition-all shadow-xs shrink-0 flex items-center gap-1 cursor-pointer"
            title="Detect GPS location"
          >
            <Locate className="w-3.5 h-3.5 text-[#C85A3F]" />
            <span className="hidden sm:inline">GPS</span>
          </button>
        </div>
      </div>

      {/* 3. UNIVERSAL SEARCH + FILTER ROW */}
      <div className="flex gap-2 items-center" ref={suggestionsRef}>
        {/* Search Field */}
        <div className="flex-1 relative shadow-xs rounded-2xl bg-white border border-[#E5DCD5] focus-within:border-[#C85A3F]/60 transition-colors">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#756B64]" />
          <input 
            type="text" 
            value={localSearchVal}
            onChange={(e) => {
              setLocalSearchVal(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Search restaurants, cuisines or dishes..." 
            className="w-full pl-10 pr-8 py-3 bg-transparent text-xs text-[#202124] placeholder-[#756B64] focus:outline-none"
          />
          {localSearchVal && (
            <button 
              type="button"
              onClick={() => {
                setLocalSearchVal('');
                setSearchQuery('');
                setShowSuggestions(false);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-[#F3E8DF] rounded-full text-[#756B64] transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Autocomplete suggestions panel */}
          {showSuggestions && searchSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E5DCD5] rounded-2xl shadow-xl p-1.5 z-40 divide-y divide-[#F3E8DF]">
              {searchSuggestions.map((sug, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setLocalSearchVal(sug);
                    setSearchQuery(sug);
                    setShowSuggestions(false);
                  }}
                  className="w-full text-left px-3 py-2.5 text-xs font-bold text-[#202124] hover:bg-[#F3E8DF]/60 rounded-xl flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <Search className="w-3.5 h-3.5 text-[#C85A3F]" />
                    <span>{sug}</span>
                  </div>
                  <span className="text-[8px] bg-[#F3E8DF] border border-[#E5DCD5] px-1.5 py-0.5 rounded text-[#C85A3F] font-extrabold uppercase">Match</span>
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
              ? 'bg-[#C85A3F] border-[#C85A3F] text-white font-bold'
              : 'bg-white border-[#E5DCD5] hover:border-[#C85A3F]/50 text-[#202124]'
          }`}
          title="Filter restaurants"
        >
          <Filter className="w-4.5 h-4.5" />
        </button>
      </div>

      {/* 4. DINING CATEGORY CHIPS */}
      <div className="space-y-2 select-none">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#756B64]">Explore Categories</h3>
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
                    ? 'bg-[#C85A3F] border-[#C85A3F] text-white' 
                    : 'bg-[#F3E8DF] border-[#E5DCD5] text-[#202124] hover:border-[#C85A3F]/50 hover:bg-[#F3E8DF]/80'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-[#C85A3F]'}`} />
                <span>{exp.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. TOP RATED RESTAURANTS */}
      {topRatedNearYou.length > 0 && (
        <div className="space-y-3 select-none text-left">
          <div className="flex justify-between items-center pr-1">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#202124]">Top Rated ⭐</h3>
            <span onClick={() => navigate('/customer/explore')} className="text-xs text-[#C85A3F] font-extrabold hover:underline cursor-pointer">View All</span>
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
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#202124]">Recommended For You ✨</h3>
            <span onClick={() => navigate('/customer/explore')} className="text-xs text-[#C85A3F] font-extrabold hover:underline cursor-pointer">View All</span>
          </div>
          <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory">
            {recommendedRestaurants.slice(0, 4).map(r => (
              <MiniHorizontalCard key={r.id} r={r} />
            ))}
          </div>
        </div>
      )}

      {/* 7. ALL RESTAURANTS SECTION */}
      <div className="space-y-4 text-left select-none pt-1" id="all-dining-venues-header">
        <div className="flex justify-between items-center pr-1">
          <div>
            <h3 className="text-base font-extrabold uppercase tracking-wider text-[#202124]">{sectionTitle}</h3>
            <p className="text-xs text-[#756B64] font-semibold mt-0.5">{sectionSubtitle}</p>
          </div>
          {(filterCuisine !== 'All' || filterPrice !== 'All' || filterOutdoor || filterRooftop || filterLiveMusic || showOpenNow || showTopRated || showNearbyOnly || showVegOnly || showNonVegOnly || showOffersOnly || activeExperience !== 'All') && (
            <button 
              onClick={handleResetFilters}
              className="text-xs text-[#C85A3F] hover:underline font-extrabold cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>

        {filteredRestaurants.length === 0 ? (
          <div className="py-16 text-center border-2 border-dashed border-[#E5DCD5] rounded-3xl bg-white p-8 space-y-3 shadow-xs">
            <div className="w-12 h-12 bg-[#F3E8DF] border border-[#E5DCD5] rounded-2xl flex items-center justify-center text-[#C85A3F] mx-auto">
              <Utensils className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-extrabold text-[#202124]">
                No restaurants found
              </h4>
              <p className="text-xs text-[#756B64] max-w-sm mx-auto">
                Try changing your location or clearing your filters.
              </p>
            </div>
            <div className="flex justify-center items-center gap-2 pt-2">
              <button 
                onClick={handleResetFilters}
                className="px-4 py-2 bg-[#F3E8DF] border border-[#E5DCD5] hover:border-[#C85A3F]/50 text-xs font-bold text-[#C85A3F] rounded-xl transition-all cursor-pointer"
              >
                Clear Filters
              </button>
              <button 
                onClick={() => setIsLocationModalOpen(true)}
                className="px-4 py-2 bg-[#C85A3F] hover:bg-[#A94332] text-xs font-bold text-white rounded-xl transition-all cursor-pointer shadow-xs"
              >
                Change Location
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredRestaurants.map(r => (
              <Card 
                key={r.id}
                className="group bg-white border border-[#E5DCD5] hover:border-[#C85A3F]/50 rounded-2xl overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-md transition-all relative select-none"
              >
                <div className="h-36 w-full overflow-hidden relative bg-gradient-to-br from-[#202124] to-[#2B2D31] flex items-center justify-center">
                  {(r.image || r.coverImage || r.logo) ? (
                    <img 
                      src={r.image || r.coverImage || r.logo} 
                      alt={r.name} 
                      loading="lazy" 
                      className="h-full w-full object-cover group-hover:scale-103 transition-transform duration-300" 
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-3 select-none">
                      <div className="w-10 h-10 rounded-xl bg-[#F3E8DF] border border-[#E5DCD5] flex items-center justify-center text-[#C85A3F] font-extrabold text-sm mb-1 shadow-sm">
                        {r.name ? r.name.charAt(0).toUpperCase() : 'R'}
                      </div>
                      <span className="text-[11px] font-extrabold text-white truncate max-w-[150px]">{r.name}</span>
                    </div>
                  )}
                  
                  {/* Favourites Button */}
                  <button 
                    onClick={(e) => toggleFavourite(r.id, e)}
                    className="absolute top-2.5 left-2.5 p-1.5 bg-white/90 hover:bg-white border border-[#E5DCD5] rounded-full text-[#756B64] hover:text-[#C85A3F] transition-colors shadow-xs cursor-pointer"
                  >
                    <Heart className={`w-3.5 h-3.5 ${favourites.includes(r.id) ? 'fill-[#C85A3F] text-[#C85A3F]' : ''}`} />
                  </button>

                  {/* Rating Badge - only show if real rating exists */}
                  {r.rating !== null && r.rating !== undefined && r.rating > 0 && (
                    <span className="absolute top-2.5 right-2.5 bg-white/90 border border-[#E5DCD5] backdrop-blur-md px-2 py-0.5 rounded-full text-[9px] font-extrabold text-[#202124] flex items-center gap-0.5 shadow-xs">
                      <Star className="w-2.5 h-2.5 text-[#E5A93C] fill-current" /> {r.rating} {r.reviewsCount ? `(${r.reviewsCount})` : ''}
                    </span>
                  )}

                  {/* Operational Status */}
                  <span className="absolute bottom-2.5 left-2.5">
                    {r.openNow ? (
                      <Badge variant="success" className="text-[8px] uppercase tracking-wider py-0.5 px-2 border-0 font-extrabold bg-[#2E8B57] text-white shadow-xs">Open Now</Badge>
                    ) : (
                      <Badge variant="muted" className="text-[8px] uppercase tracking-wider py-0.5 px-2 border-0 font-extrabold bg-[#756B64] text-white">Closed</Badge>
                    )}
                  </span>
                </div>

                <div className="p-4 space-y-3">
                  <div className="space-y-1 text-left">
                    <div className="flex justify-between items-start gap-2">
                      <h4 
                        onClick={() => navigate(`/customer/restaurant/${r.id}`)}
                        className="text-sm font-extrabold text-[#202124] group-hover:text-[#C85A3F] transition-colors cursor-pointer truncate"
                      >
                        {r.name}
                      </h4>
                    </div>
                    
                    <div className="flex items-center space-x-1.5 text-xs text-[#756B64] font-semibold">
                      <span>{r.cuisine || 'Dining'}</span>
                      {r.priceRange && (
                        <>
                          <span>•</span>
                          <span>{r.priceRange}</span>
                        </>
                      )}
                      {(r.area || r.city) && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-[120px]">{r.area || r.city}</span>
                        </>
                      )}
                    </div>

                    {r.street && (
                      <p className="text-[11px] text-[#756B64]/80 truncate font-medium">
                        {r.street}
                      </p>
                    )}

                    {r.googleMapsUrl && (
                      <div className="pt-0.5">
                        <a 
                          href={r.googleMapsUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center text-[10px] text-[#756B64] hover:text-[#C85A3F] hover:underline font-bold transition-colors"
                        >
                          <MapPin className="w-3 h-3 mr-0.5 text-[#C85A3F]" /> View on Maps
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#F3E8DF]">
                    <button 
                      onClick={() => navigate(`/customer/restaurant/${r.id}`)}
                      className="py-2 bg-[#F3E8DF]/60 border border-[#E5DCD5] hover:border-[#C85A3F]/50 text-xs font-extrabold text-[#202124] rounded-xl transition-all text-center cursor-pointer hover:bg-[#F3E8DF]"
                    >
                      View Restaurant
                    </button>
                    <button 
                      onClick={() => navigate(`/customer/booking?tenantId=${r.id}`)}
                      className="py-2 bg-[#C85A3F] hover:bg-[#A94332] text-xs font-extrabold text-white rounded-xl transition-all text-center shadow-xs cursor-pointer"
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

      {/* FILTER DRAWER MODAL */}
      <Modal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        title="Refine Dining Choices"
        className="max-w-md bg-white border border-[#E5DCD5]"
      >
        <div className="space-y-4 text-left text-xs select-none">
          
          {/* Cuisine selection */}
          <div className="space-y-1">
            <label className="text-[9.5px] text-[#756B64] font-extrabold uppercase">Cuisine Type</label>
            <select 
              value={filterCuisine} 
              onChange={e => setFilterCuisine(e.target.value)}
              className="w-full bg-[#FCFAF7] border border-[#E5DCD5] text-[#202124] p-2.5 rounded-xl focus:outline-none"
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
            <label className="text-[9.5px] text-[#756B64] font-extrabold uppercase">Price Bracket</label>
            <div className="grid grid-cols-4 gap-1.5">
              {['All', '₹', '₹₹', '₹₹₹'].map(pr => (
                <button
                  key={pr}
                  type="button"
                  onClick={() => setFilterPrice(pr)}
                  className={`py-2 border rounded-xl font-bold transition-all ${
                    filterPrice === pr
                      ? 'bg-[#C85A3F] border-[#C85A3F] text-white font-extrabold'
                      : 'bg-[#FCFAF7] border-[#E5DCD5] text-[#756B64] hover:text-[#202124]'
                  }`}
                >
                  {pr === 'All' ? 'All Prices' : pr}
                </button>
              ))}
            </div>
          </div>

          {/* Facilities filters checklist */}
          <div className="space-y-2">
            <span className="text-[9.5px] text-[#756B64] font-extrabold uppercase">Ambience & Facility Tags</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setFilterOutdoor(!filterOutdoor)}
                className={`py-2 px-3 border rounded-xl font-bold flex items-center justify-between transition-all ${
                  filterOutdoor ? 'bg-[#F3E8DF] border-[#C85A3F] text-[#C85A3F] font-extrabold' : 'bg-[#FCFAF7] border-[#E5DCD5] text-[#756B64]'
                }`}
              >
                <span>Outdoor Seating</span>
                {filterOutdoor && <Check className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => setFilterRooftop(!filterRooftop)}
                className={`py-2 px-3 border rounded-xl font-bold flex items-center justify-between transition-all ${
                  filterRooftop ? 'bg-[#F3E8DF] border-[#C85A3F] text-[#C85A3F] font-extrabold' : 'bg-[#FCFAF7] border-[#E5DCD5] text-[#756B64]'
                }`}
              >
                <span>Rooftop Ambience</span>
                {filterRooftop && <Check className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => setFilterLiveMusic(!filterLiveMusic)}
                className={`py-2 px-3 border rounded-xl font-bold flex items-center justify-between transition-all ${
                  filterLiveMusic ? 'bg-[#F3E8DF] border-[#C85A3F] text-[#C85A3F] font-extrabold' : 'bg-[#FCFAF7] border-[#E5DCD5] text-[#756B64]'
                }`}
              >
                <span>Live Music Nights</span>
                {filterLiveMusic && <Check className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Toggles checklist */}
          <div className="space-y-2 pt-2 border-t border-[#F3E8DF]">
            <span className="text-[9.5px] text-[#756B64] font-extrabold uppercase">Quick Toggle Filters</span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { state: showOpenNow, setter: setShowOpenNow, label: 'Open Now' },
                { state: showTopRated, setter: setShowTopRated, label: 'Top Rated (4.0+)' },
                { state: showNearbyOnly, setter: setShowNearbyOnly, label: 'Nearby (GPS)' },
                { state: showVegOnly, setter: setShowVegOnly, label: 'Vegetarian' },
                { state: showNonVegOnly, setter: setShowNonVegOnly, label: 'Non-Vegetarian' },
                { state: showOffersOnly, setter: setShowOffersOnly, label: 'With Offers' }
              ].map((filt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => filt.setter(!filt.state)}
                  className={`py-2 px-3 border rounded-xl font-bold flex items-center justify-between transition-all ${
                    filt.state ? 'bg-[#F3E8DF] border-[#C85A3F] text-[#C85A3F] font-extrabold' : 'bg-[#FCFAF7] border-[#E5DCD5] text-[#756B64]'
                  }`}
                >
                  <span>{filt.label}</span>
                  {filt.state && <Check className="w-3.5 h-3.5 text-[#C85A3F]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-4 border-t border-[#F3E8DF]">
            <button
              type="button"
              onClick={handleResetFilters}
              className="flex-1 py-3 bg-[#FCFAF7] hover:bg-[#F3E8DF] border border-[#E5DCD5] text-[10px] text-[#756B64] font-bold rounded-xl transition-colors cursor-pointer"
            >
              Reset All
            </button>
            <button
              type="button"
              onClick={() => setIsFilterModalOpen(false)}
              className="flex-1 py-3 bg-[#C85A3F] hover:bg-[#A94332] text-white text-[10px] font-extrabold rounded-xl shadow-xs transition-colors cursor-pointer"
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
        className="max-w-md bg-white border border-[#E5DCD5]"
      >
        <div className="space-y-4 text-left text-xs select-none">
          
          <button
            onClick={() => {
              handleDetectLocation(false);
              setIsLocationModalOpen(false);
            }}
            className="w-full p-3 bg-[#F3E8DF] hover:bg-[#F3E8DF]/80 border border-[#E5DCD5] text-[#C85A3F] font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <Locate className="w-4 h-4" />
            <span>Detect My Current Location (GPS)</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[9px] text-[#756B64] font-extrabold uppercase">Search City</label>
              <div className="relative bg-[#FCFAF7] border border-[#E5DCD5] rounded-xl overflow-hidden">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#756B64]" />
                <input
                  type="text"
                  placeholder="Enter city..."
                  value={citySearchQuery}
                  onChange={(e) => setCitySearchQuery(e.target.value)}
                  className="w-full pl-8 pr-2 py-2.5 bg-transparent text-[#202124] placeholder-[#756B64] focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] text-[#756B64] font-extrabold uppercase">Search Area</label>
              <div className="relative bg-[#FCFAF7] border border-[#E5DCD5] rounded-xl overflow-hidden">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#756B64]" />
                <input
                  type="text"
                  placeholder="Enter area..."
                  value={areaSearchQuery}
                  onChange={(e) => setAreaSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-2 py-2.5 bg-transparent text-[#202124] placeholder-[#756B64] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {(recentLocations.length > 0 || savedLocations.length > 0) && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              {recentLocations.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[9px] text-[#756B64] font-extrabold uppercase">Recents</span>
                  <div className="space-y-1">
                    {recentLocations.map((loc, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectLocation(loc)}
                        className="w-full text-left p-2.5 bg-[#FCFAF7] hover:bg-[#F3E8DF] border border-[#E5DCD5] rounded-xl font-semibold text-[#202124] hover:text-[#C85A3F] transition-all flex items-center gap-1.5 truncate cursor-pointer"
                      >
                        <Clock className="w-3 h-3 text-[#756B64] shrink-0" />
                        <span className="truncate">{loc.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {savedLocations.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[9px] text-[#756B64] font-extrabold uppercase">Saved</span>
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
                        className="w-full text-left p-2.5 bg-[#FCFAF7] hover:bg-[#F3E8DF] border border-[#E5DCD5] rounded-xl font-semibold text-[#202124] hover:text-[#C85A3F] transition-all flex items-center gap-1.5 truncate cursor-pointer"
                      >
                        <Heart className="w-3 h-3 text-[#C85A3F] shrink-0" />
                        <span className="truncate">{loc.name}: {loc.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {dynamicCitiesList.length > 0 && (
            <div className="space-y-2 pt-1 border-t border-[#F3E8DF]">
              <span className="text-[9px] text-[#756B64] font-extrabold uppercase">Eatery Branches Locations</span>
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {dynamicCitiesList.map((cityObj) => (
                  <div key={cityObj.name} className="p-2.5 bg-[#FCFAF7] border border-[#E5DCD5] rounded-xl space-y-1.5">
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
                      className="text-xs font-bold text-[#202124] hover:text-[#C85A3F] transition-colors text-left cursor-pointer"
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
                            className={`py-0.5 px-2 border rounded-lg text-[9px] font-semibold transition-all cursor-pointer ${
                              currentLocation?.city.toLowerCase() === cityObj.name.toLowerCase() && currentLocation?.area.toLowerCase() === area.toLowerCase()
                                ? 'bg-[#F3E8DF] border-[#C85A3F] text-[#C85A3F] font-bold'
                                : 'bg-white border-[#E5DCD5] text-[#756B64] hover:text-[#202124]'
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

          <div className="space-y-2 pt-1 border-t border-[#F3E8DF]">
            <span className="text-[9px] text-[#756B64] font-extrabold uppercase">Popular Cities</span>
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
                  className={`py-2 border rounded-xl font-bold text-center transition-all truncate block cursor-pointer ${
                    currentLocation?.city.toLowerCase() === city.name.toLowerCase()
                      ? 'bg-[#F3E8DF] border-[#C85A3F] text-[#C85A3F] font-extrabold shadow-xs'
                      : 'bg-[#FCFAF7] border-[#E5DCD5] text-[#756B64] hover:text-[#202124]'
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
