import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { collection, onSnapshot } from 'firebase/firestore';
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
    setIsLoading(true);
    const colRef = collection(db, 'tenants');
    const unsubscribe = onSnapshot(colRef, (snap) => {
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
          offerText: index % 2 === 0 ? 'Flat 20% OFF' : '',
          image: data.coverImage || REST_MOCK_IMAGES[index % REST_MOCK_IMAGES.length],
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
        // Fallback mockup
        const fallback = [
          { id: 'l-ambroisie', name: "L'Ambroisie", cuisine: "French Haute Cuisine & Fine Dining", rating: 4.9, reviewsCount: 384, priceRange: '$$$', vegOptions: true, nonVegOptions: true, openNow: true, isFeatured: true, isTrending: true, isNew: false, hasOffer: true, offerText: '20% OFF', image: REST_MOCK_IMAGES[0], city: 'Bengaluru', area: 'Indiranagar', latitude: 12.9716, longitude: 77.5946, supportsSeatPreference: true, availableTables: 3, waitingTime: 'Instant Seating', facilities: { outdoorSeating: true, liveMusic: false, rooftop: false, buffet: false } },
          { id: 'shuko', name: "Shuko Sushi", cuisine: "Premium Japanese Omakase & Sushi", rating: 4.8, reviewsCount: 220, priceRange: '$$$', vegOptions: false, nonVegOptions: true, openNow: true, isFeatured: false, isTrending: true, isNew: true, hasOffer: false, offerText: '', image: REST_MOCK_IMAGES[3], city: 'Hyderabad', area: 'Hitech City', latitude: 17.3850, longitude: 78.4867, supportsSeatPreference: true, availableTables: 2, waitingTime: '15-20 mins wait', facilities: { outdoorSeating: false, liveMusic: true, rooftop: true, buffet: false } },
          { id: 'osteria', name: "Osteria Francescana", cuisine: "Italian Fine Dining & Pasta", rating: 4.9, reviewsCount: 512, priceRange: '$$', vegOptions: true, nonVegOptions: true, openNow: true, isFeatured: true, isTrending: false, isNew: false, hasOffer: true, offerText: 'Free Dessert', image: REST_MOCK_IMAGES[1], city: 'Bengaluru', area: 'Koramangala', latitude: 12.9352, longitude: 77.6245, supportsSeatPreference: false, availableTables: 5, waitingTime: 'Instant Seating', facilities: { outdoorSeating: true, liveMusic: true, rooftop: false, buffet: true } }
        ];
        setRestaurantsList(fallback);
      } else {
        setRestaurantsList(list);
      }
    }, (error) => {
      console.error('Failed to stream restaurants:', error);
      const fallback = [
        { id: 'l-ambroisie', name: "L'Ambroisie", cuisine: "French Haute Cuisine & Fine Dining", rating: 4.9, reviewsCount: 384, priceRange: '$$$', vegOptions: true, nonVegOptions: true, openNow: true, isFeatured: true, isTrending: true, isNew: false, hasOffer: true, offerText: '20% OFF', image: REST_MOCK_IMAGES[0], city: 'Bengaluru', area: 'Indiranagar', latitude: 12.9716, longitude: 77.5946, supportsSeatPreference: true, availableTables: 3, waitingTime: 'Instant Seating', facilities: { outdoorSeating: true, liveMusic: false, rooftop: false, buffet: false } },
        { id: 'shuko', name: "Shuko Sushi", cuisine: "Premium Japanese Omakase & Sushi", rating: 4.8, reviewsCount: 220, priceRange: '$$$', vegOptions: false, nonVegOptions: true, openNow: true, isFeatured: false, isTrending: true, isNew: true, hasOffer: false, offerText: '', image: REST_MOCK_IMAGES[3], city: 'Hyderabad', area: 'Hitech City', latitude: 17.3850, longitude: 78.4867, supportsSeatPreference: true, availableTables: 2, waitingTime: '15-20 mins wait', facilities: { outdoorSeating: false, liveMusic: true, rooftop: true, buffet: false } },
        { id: 'osteria', name: "Osteria Francescana", cuisine: "Italian Fine Dining & Pasta", rating: 4.9, reviewsCount: 512, priceRange: '$$', vegOptions: true, nonVegOptions: true, openNow: true, isFeatured: true, isTrending: false, isNew: false, hasOffer: true, offerText: 'Free Dessert', image: REST_MOCK_IMAGES[1], city: 'Bengaluru', area: 'Koramangala', latitude: 12.9352, longitude: 77.6245, supportsSeatPreference: false, availableTables: 5, waitingTime: 'Instant Seating', facilities: { outdoorSeating: true, liveMusic: true, rooftop: false, buffet: true } }
      ];
      setRestaurantsList(fallback);
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
      className="group bg-slate-900/20 border-slate-900 hover:border-slate-850 rounded-2xl overflow-hidden flex flex-col justify-between shadow relative shrink-0 w-60 scroll-snap-align-start select-none"
    >
      <div className="h-28 w-full overflow-hidden relative">
        <img src={r.image} alt={r.name} loading="lazy" className="h-full w-full object-cover group-hover:scale-102 transition-transform duration-300" />
        
        {/* Favorite Icon */}
        <button 
          onClick={(e) => toggleFavourite(r.id, e)}
          className="absolute top-2 left-2 p-1 bg-slate-950/70 hover:bg-slate-950 border border-slate-900 rounded-lg text-slate-450 hover:text-white transition-colors"
        >
          <Heart className={`w-3 h-3 ${favourites.includes(r.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
        </button>

        {/* Rating Badge */}
        <span className="absolute top-2 right-2 bg-slate-950/80 border border-slate-800 backdrop-blur-md px-1.5 py-0.5 rounded text-[8.5px] font-bold text-slate-350 flex items-center gap-0.5 shadow-md">
          <Star className="w-2.5 h-2.5 text-primary fill-current" /> {r.rating}
        </span>
      </div>

      <div className="p-3 space-y-1.5 text-left">
        <div>
          <h4 
            onClick={() => navigate(`/customer/restaurant/${r.id}`)}
            className="text-[11.5px] font-extrabold text-white group-hover:text-primary transition-colors cursor-pointer truncate"
          >
            {r.name}
          </h4>
          
          <div className="flex items-center space-x-1.5 text-[8.5px] text-slate-500 font-bold">
            <span className="text-slate-400">{r.cuisine}</span>
            <span>•</span>
            <span className="text-slate-400">{r.priceRange}</span>
          </div>
        </div>

        {/* Dynamic Distance */}
        <div className="flex justify-between items-center text-[8.5px] text-slate-550 pt-1 border-t border-slate-900/60">
          <span className="flex items-center gap-0.5">
            <MapPin className="w-2.5 h-2.5" /> 
            {r.distance ? `${r.distance.toFixed(1)} mi` : '0.8 mi'}
          </span>
          <span className="text-primary font-bold">{r.availableTables} tables left</span>
        </div>

        <button 
          onClick={() => navigate(`/customer/booking?tenantId=${r.id}`)}
          className="w-full py-1.5 bg-primary hover:bg-amber-500 text-[9px] font-extrabold text-slate-950 rounded-lg transition-all text-center mt-1"
        >
          Book Table
        </button>
      </div>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="py-20 text-center">
        <LoadingSpinner label="Opening RestaurantOS registry ledger..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left pb-16 w-full select-none">
      
      {/* 1. HERO COVER BANNER */}
      <div className="relative h-32 md:h-44 rounded-2xl overflow-hidden border border-slate-900 bg-slate-900/30 flex items-center p-6 md:p-8">
        <div className="absolute inset-0 bg-cover bg-center opacity-10 pointer-events-none" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800&auto=format&fit=crop')` }} />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/60 to-transparent pointer-events-none" />
        <div className="relative space-y-1">
          <Badge variant="primary" className="text-[8px] py-0.5 font-extrabold tracking-widest uppercase">Premium Dining</Badge>
          <h2 className="text-sm md:text-lg font-display font-extrabold text-white leading-tight">Curate Your Culinary Experiences</h2>
          <p className="text-[10px] md:text-xs text-slate-500 font-semibold">Reserve exclusive dining table slots instantly.</p>
        </div>
      </div>

      {/* 2. CURRENT LOCATION SYSTEM */}
      <div className="bg-slate-900/40 border border-slate-900 p-3.5 rounded-2xl backdrop-blur-md flex items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center text-primary shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[8px] text-slate-500 font-extrabold uppercase tracking-wider block">Dining Location</span>
            <button 
              onClick={() => setIsLocationModalOpen(true)}
              className="text-[11px] font-bold text-white hover:text-primary flex items-center gap-0.5"
            >
              <span>{currentLocation ? currentLocation.label : 'Select City'}</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            </button>
          </div>
        </div>
        <button
          onClick={() => handleDetectLocation(false)}
          className="p-2 bg-slate-950 border border-slate-850 hover:border-slate-800 text-xs font-bold text-slate-300 rounded-xl transition-all shadow-sm shrink-0"
        >
          <Locate className="w-3.5 h-3.5 text-primary" />
        </button>
      </div>

      {/* 3. UNIVERSAL SEARCH + FILTER ROW */}
      <div className="flex gap-2 items-center" ref={suggestionsRef}>
        {/* Search Field */}
        <div className="flex-1 relative shadow rounded-xl bg-slate-900/50 border border-slate-850 backdrop-blur-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input 
            type="text" 
            value={localSearchVal}
            onChange={(e) => {
              setLocalSearchVal(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Search Name, Cuisine, Dish..." 
            className="w-full pl-8 pr-7 py-2.5 bg-transparent text-[11px] text-white placeholder-slate-550 focus:outline-none"
          />
          {localSearchVal && (
            <button 
              type="button"
              onClick={() => {
                setLocalSearchVal('');
                setSearchQuery('');
                setShowSuggestions(false);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-800 rounded text-slate-400"
            >
              <X className="w-3 h-3" />
            </button>
          )}

          {/* Autocomplete suggestions panel */}
          {showSuggestions && searchSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1 z-40 backdrop-blur-xl divide-y divide-slate-850/30">
              {searchSuggestions.map((sug, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setLocalSearchVal(sug);
                    setSearchQuery(sug);
                    setShowSuggestions(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-350 hover:text-white hover:bg-slate-950/60 rounded-lg flex items-center justify-between animate-fadeIn"
                >
                  <div className="flex items-center space-x-2">
                    <Search className="w-3 h-3 text-slate-500" />
                    <span>{sug}</span>
                  </div>
                  <span className="text-[7.5px] bg-slate-950 border border-slate-850 px-1 py-0.5 rounded text-slate-500 font-extrabold uppercase">Match</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Filter Button */}
        <button
          type="button"
          onClick={() => setIsFilterModalOpen(true)}
          className={`p-2.5 border rounded-xl transition-all shadow-sm ${
            filterCuisine !== 'All' || filterPrice !== 'All' || filterOutdoor || filterRooftop || filterLiveMusic || showOpenNow || showTopRated || showNearbyOnly || showVegOnly || showNonVegOnly || showOffersOnly
              ? 'bg-primary border-primary text-slate-950 font-bold'
              : 'bg-slate-900/50 border-slate-850 hover:border-slate-800 text-slate-450 hover:text-white'
          }`}
        >
          <Filter className="w-4 h-4" />
        </button>
      </div>

      {/* 4. DINING EXPERIENCE CHIPS */}
      <div className="space-y-2 select-none">
        <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-none">
          {DINING_EXPERIENCES.map((exp) => {
            const Icon = exp.icon;
            const isSelected = activeExperience === exp.filter;
            return (
              <button
                key={exp.id}
                onClick={() => {
                  setActiveExperience(prev => prev === exp.filter ? 'All' : exp.filter);
                }}
                className={`py-1.5 px-2.5 border rounded-xl text-[10px] font-bold flex items-center space-x-1 transition-all shrink-0 ${
                  isSelected 
                    ? 'bg-primary border-primary text-slate-950' 
                    : 'bg-slate-900/30 border-slate-900 text-slate-400'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{exp.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. TOP RATED RESTAURANTS NEAR YOU */}
      {topRatedNearYou.length > 0 && (
        <div className="space-y-2 select-none text-left">
          <div className="flex justify-between items-center pr-1">
            <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Top Rated Restaurants Near You</h3>
            <span className="text-[8px] text-slate-600 font-extrabold">View All</span>
          </div>
          <div className="flex space-x-3.5 overflow-x-auto pb-1 scrollbar-none snap-x snap-mandatory">
            {topRatedNearYou.slice(0, 4).map(r => (
              <MiniHorizontalCard key={r.id} r={r} />
            ))}
          </div>
        </div>
      )}

      {/* 6. RECOMMENDED RESTAURANTS */}
      {recommendedRestaurants.length > 0 && (
        <div className="space-y-2 select-none text-left">
          <div className="flex justify-between items-center pr-1">
            <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Recommended Restaurants</h3>
            <span className="text-[8px] text-slate-600 font-extrabold">View All</span>
          </div>
          <div className="flex space-x-3.5 overflow-x-auto pb-1 scrollbar-none snap-x snap-mandatory">
            {recommendedRestaurants.slice(0, 4).map(r => (
              <MiniHorizontalCard key={r.id} r={r} />
            ))}
          </div>
        </div>
      )}

      {/* 7. POPULAR NEARBY */}
      {popularNearYouList.length > 0 && (
        <div className="space-y-2 select-none text-left">
          <div className="flex justify-between items-center pr-1">
            <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-550">Popular Nearby</h3>
            <span className="text-[8px] text-slate-600 font-extrabold">View All</span>
          </div>
          <div className="flex space-x-3.5 overflow-x-auto pb-1 scrollbar-none snap-x snap-mandatory">
            {popularNearYouList.slice(0, 4).map(r => (
              <MiniHorizontalCard key={r.id} r={r} />
            ))}
          </div>
        </div>
      )}

      {/* 8. ALL RESTAURANTS */}
      <div className="space-y-3.5 text-left select-none pt-1" id="all-dining-venues-header">
        <div className="flex justify-between items-center pr-1">
          <div>
            <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-555">All Restaurants</h3>
            <p className="text-[9px] text-slate-600 font-semibold mt-0.5">Found {filteredRestaurants.length} premium collaborations</p>
          </div>
          {(filterCuisine !== 'All' || filterPrice !== 'All' || filterOutdoor || filterRooftop || filterLiveMusic || showOpenNow || showTopRated || showNearbyOnly || showVegOnly || showNonVegOnly || showOffersOnly) && (
            <button 
              onClick={handleResetFilters}
              className="text-[9.5px] text-primary hover:underline font-extrabold"
            >
              Clear Filters
            </button>
          )}
        </div>

        {filteredRestaurants.length === 0 ? (
          <div className="py-12 text-center border border-slate-900 border-dashed rounded-xl bg-slate-900/5 text-slate-500 text-xs">
            No restaurants found matching filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredRestaurants.map(r => (
              <Card 
                key={r.id}
                className="group bg-slate-900/20 border-slate-900 hover:border-slate-855 rounded-2xl overflow-hidden flex flex-col justify-between shadow relative select-none"
              >
                <div className="h-36 w-full overflow-hidden relative">
                  <img src={r.image} alt={r.name} loading="lazy" className="h-full w-full object-cover group-hover:scale-102 transition-transform duration-300" />
                  
                  {/* Favourites Button */}
                  <button 
                    onClick={(e) => toggleFavourite(r.id, e)}
                    className="absolute top-2.5 left-2.5 p-1 bg-slate-950/70 hover:bg-slate-950 border border-slate-900 rounded-lg text-slate-400 hover:text-white transition-colors"
                  >
                    <Heart className={`w-3.5 h-3.5 ${favourites.includes(r.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                  </button>

                  {/* Rating Badge */}
                  <span className="absolute top-2.5 right-2.5 bg-slate-950/80 border border-slate-800 backdrop-blur-md px-1.5 py-0.5 rounded text-[8.5px] font-bold text-slate-300 flex items-center gap-0.5 shadow-md">
                    <Star className="w-2.5 h-2.5 text-primary fill-current" /> {r.rating} ({r.reviewsCount})
                  </span>

                  {/* Operational Status */}
                  <span className="absolute bottom-2.5 left-2.5">
                    {r.openNow ? (
                      <Badge variant="success" className="text-[7.5px] uppercase tracking-wider py-0.5 px-1.5 border-0 font-extrabold bg-emerald-500/90 text-slate-950">Open Now</Badge>
                    ) : (
                      <Badge variant="muted" className="text-[7.5px] uppercase tracking-wider py-0.5 px-1.5 border-0 font-extrabold bg-slate-950 text-slate-450">Closed</Badge>
                    )}
                  </span>

                  {/* Table Availability */}
                  <span className="absolute bottom-2.5 right-2.5 bg-slate-950/85 backdrop-blur-sm px-2 py-0.5 rounded-lg text-[9px] font-bold text-primary border border-primary/20">
                    {r.availableTables} Tables Left
                  </span>
                </div>

                <div className="p-3.5 space-y-2.5">
                  <div className="space-y-0.5 text-left">
                    <div className="flex justify-between items-start gap-2">
                      <h4 
                        onClick={() => navigate(`/customer/restaurant/${r.id}`)}
                        className="text-xs font-extrabold text-white group-hover:text-primary transition-colors cursor-pointer truncate flex-1"
                      >
                        {r.name}
                      </h4>
                      <span className="text-[8px] bg-slate-900 border border-slate-850 text-slate-500 px-1.5 py-0.5 rounded font-extrabold uppercase shrink-0">{r.priceRange}</span>
                    </div>
                    <p className="text-[10px] text-slate-550 font-semibold truncate">{r.cuisine} • {r.waitingTime}</p>
                    <p className="text-[9.5px] text-slate-555 font-bold truncate flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {r.area}, {r.city}
                    </p>
                  </div>

                  {r.hasOffer && (
                    <div className="p-2 bg-primary/5 border border-primary/10 rounded-xl flex items-center space-x-2 text-[8.5px] text-primary font-bold">
                      <Percent className="w-3 h-3" />
                      <span>{r.offerText} available on booking</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-[9px] text-slate-550 pt-2 border-t border-slate-900/60">
                    <span className="flex items-center gap-0.5 font-semibold">
                      <Compass className="w-3 h-3" /> {r.distance ? `${r.distance.toFixed(1)} miles away` : '0.8 miles away'}
                    </span>
                    <span className="flex items-center gap-0.5 font-semibold">
                      <Clock className="w-3 h-3" /> {r.travelTime || '10 mins drive'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-900/40">
                    <button 
                      onClick={() => navigate(`/customer/restaurant/${r.id}`)}
                      className="w-full py-2 bg-slate-950 border border-slate-850 hover:border-slate-800 text-[9.5px] font-bold text-slate-300 hover:text-white rounded-lg transition-all"
                    >
                      View Details
                    </button>
                    <button 
                      onClick={() => navigate(`/customer/booking?tenantId=${r.id}`)}
                      className="w-full py-2 bg-primary hover:bg-amber-500 text-[9.5px] font-extrabold text-slate-950 rounded-lg transition-all shadow shadow-primary/5"
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
