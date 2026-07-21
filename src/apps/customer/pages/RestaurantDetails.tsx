import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { ITenant } from '../../../types';
import Card from '../../../components/ui/Card/Card';
import Button from '../../../components/ui/Button/Button';
import Badge from '../../../components/ui/Badge/Badge';
import LoadingSpinner from '../../../components/ui/LoadingSpinner/LoadingSpinner';
import { 
  Star, MapPin, Clock, Table, ArrowLeft, Heart, Sparkles, Check, 
  Map, MessageSquare, ShieldCheck, HelpCircle, Phone, Compass
} from 'lucide-react';
import toast from 'react-hot-toast';

const REST_MOCK_IMAGES = [
  'https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=600&auto=format&fit=crop'
];

const DISH_PREVIEWS = [
  { id: 'fd1', name: 'Truffle Tagliolini', price: '$34.00', desc: 'Handcrafted pasta tossed in white truffle butter and parmigiano.', image: 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?q=80&w=150&auto=format&fit=crop', chefSpecial: true },
  { id: 'fd2', name: 'Hamachi Crudo', price: '$28.00', desc: 'Slices of yellowtail, serrano chili, yuzu vinaigrette.', image: 'https://images.unsplash.com/photo-1534482421-64566f976cfa?q=80&w=150&auto=format&fit=crop', chefSpecial: false },
  { id: 'fd4', name: 'A5 Wagyu Ribeye', price: '$95.00', desc: '150g authentic Japanese Miyazaki Wagyu steak.', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=150&auto=format&fit=crop', chefSpecial: true }
];

const REVIEWS_MOCK = [
  { author: 'Sarah Jenkins', rating: 5, date: 'June 24, 2026', comment: 'The Truffle Tagliolini was absolutely out of this world. Spotless service!' },
  { author: 'David Chen', rating: 4, date: 'June 18, 2026', comment: 'Incredible steak and ambiance. Service was busy but very attentive.' }
];

export const RestaurantDetails: React.FC = () => {
  const { tenantId } = useParams<{ tenantId: string }>();
  const navigate = useNavigate();

  const [restaurant, setRestaurant] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'menu' | 'reviews'>('info');

  useEffect(() => {
    const fetchRestaurantDetails = async () => {
      if (!tenantId) return;
      setIsLoading(true);
      try {
        const tenantRef = doc(db, 'tenants', tenantId);
        const tenantSnap = await getDoc(tenantRef);
        if (tenantSnap.exists()) {
          const data = tenantSnap.data();
          setRestaurant({
            id: tenantSnap.id,
            name: data.restaurantName || data.name || 'Gourmet Bistro',
            cuisine: data.cuisine || 'Fine Dining',
            rating: data.rating || 4.9,
            address: data.address || '9 Place des Vosges, 75004 Paris',
            hours: data.hours || '12:00 PM - 11:00 PM',
            coverImage: data.coverImage || REST_MOCK_IMAGES[0],
            logoUrl: data.logoUrl || 'https://picsum.photos/100/100?random=logo',
            description: data.description || 'Welcome to a premium dining environment where every ingredient tells a unique culinary story of passion and craftsmanship.',
            phone: data.phone || '+1 (555) 942-0192',
            facilities: data.facilities || ['Free Valet Parking', 'Outdoor Terrace', 'Pet Friendly', 'Live Music Jazz', 'Wheelchair Accessible', 'Wine Cellar']
          });
        } else {
          // Fallback mockup
          setRestaurant({
            id: 'l-ambroisie',
            name: "L'Ambroisie",
            cuisine: "French Haute Cuisine",
            rating: 4.9,
            address: '9 Place des Vosges, 75004 Paris',
            hours: '12:00 PM - 11:00 PM',
            coverImage: REST_MOCK_IMAGES[0],
            logoUrl: 'https://picsum.photos/100/100?random=logo',
            description: 'Experience pure culinary delight. Established in 1986, L\'Ambroisie delivers next-level gastronomy using strictly authentic heritage techniques.',
            phone: '+1 (555) 942-0192',
            facilities: ['Free Valet Parking', 'Outdoor Terrace', 'Pet Friendly', 'Live Music Jazz', 'Wheelchair Accessible', 'Wine Cellar']
          });
        }
      } catch (e) {
        console.error(e);
        toast.error('Failed to load restaurant profile.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchRestaurantDetails();
  }, [tenantId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <LoadingSpinner label="Accessing restaurant file..." />
      </div>
    );
  }

  if (!restaurant) return null;

  return (
    <div className="space-y-6 text-left max-w-4xl mx-auto">
      
      {/* 1. Hero Cover Banner */}
      <div className="h-64 md:h-80 w-full relative rounded-3xl overflow-hidden shadow-2xl border border-slate-900">
        <img src={restaurant.coverImage} alt={restaurant.name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
        
        <button 
          onClick={() => navigate('/customer/discover')}
          className="absolute top-4 left-4 w-9 h-9 bg-slate-950/75 border border-slate-800 hover:border-slate-700 backdrop-blur-md rounded-xl flex items-center justify-center text-slate-350 hover:text-white transition-all shadow"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Restaurant Basic Info Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 p-6 bg-slate-900/30 border border-slate-900 rounded-3xl backdrop-blur-md relative -mt-16 mx-4 z-10">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-slate-950 border border-slate-850 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center">
            <img src={restaurant.logoUrl} alt={restaurant.name} className="h-full w-full object-cover" />
          </div>
          <div>
            <h2 className="text-xl font-display font-extrabold text-white">{restaurant.name}</h2>
            <div className="flex items-center space-x-2 text-[10.5px] text-slate-450 font-semibold uppercase mt-0.5">
              <span>{restaurant.cuisine}</span>
              <span>•</span>
              <span className="text-primary flex items-center gap-0.5">
                <Star className="w-3.5 h-3.5 fill-current" /> {restaurant.rating} (142 Reviews)
              </span>
            </div>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <Button 
            onClick={() => navigate(`/customer/booking?tenantId=${restaurant.id}`)}
            className="flex-1 sm:flex-initial px-5 py-3 bg-slate-900 border border-slate-800 text-xs font-extrabold rounded-2xl flex items-center justify-center gap-1.5 hover:text-primary transition-all"
          >
            <Calendar className="w-4 h-4 text-slate-400" /> Book Table
          </Button>
          <Button 
            onClick={() => navigate(`/customer/restaurant/${restaurant.id}/menu`)}
            className="flex-1 sm:flex-initial px-5 py-3 bg-primary hover:bg-orange-500 text-slate-950 font-extrabold rounded-2xl flex items-center justify-center gap-1.5 transition-all text-xs"
          >
            <Coffee className="w-4 h-4" /> Order Now
          </Button>
        </div>
      </div>

      {/* 3. Details tab navigation */}
      <div className="flex space-x-2 border-b border-slate-900 pb-1">
        {[
          { key: 'info', label: 'Info & Facilities', icon: Compass },
          { key: 'menu', label: 'Menu Teasers', icon: Coffee },
          { key: 'reviews', label: 'Reviews', icon: MessageSquare }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2.5 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === tab.key 
                ? 'border-primary text-primary' 
                : 'border-transparent text-slate-500 hover:text-slate-350'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 4. Tab Contents Panel */}
      <div className="bg-slate-900/10 border border-slate-900/60 p-6 rounded-3xl min-h-48 backdrop-blur-md">
        
        {/* TAB 1: INFO & FACILITIES */}
        {activeTab === 'info' && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold uppercase text-slate-450 tracking-wider">About the Restaurant</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">{restaurant.description}</p>
            </div>
            
            <hr className="border-slate-900" />
            
            {/* Quick Contact & Details grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-400">
              <div className="flex items-center space-x-3.5">
                <Clock className="w-5 h-5 text-primary" />
                <span>Operating hours: {restaurant.hours}</span>
              </div>
              <div className="flex items-center space-x-3.5">
                <MapPin className="w-5 h-5 text-primary" />
                <span>{restaurant.address}</span>
              </div>
              <div className="flex items-center space-x-3.5">
                <Phone className="w-5 h-5 text-primary" />
                <span>Tel: {restaurant.phone}</span>
              </div>
            </div>

            <hr className="border-slate-900" />

            {/* Facilities lists */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold uppercase text-slate-455 tracking-wider">Amenities & Features</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {restaurant.facilities.map((fac: string, i: number) => (
                  <div key={i} className="flex items-center space-x-2 text-xs text-slate-400 font-semibold bg-slate-950/20 border border-slate-900 p-2.5 rounded-xl">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    <span>{fac}</span>
                  </div>
                ))}
              </div>
            </div>

            <hr className="border-slate-900" />

            {/* Mock location map placeholder */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold uppercase text-slate-455 tracking-wider">Location Directions</h4>
              <div className="p-4 bg-slate-950 border border-slate-900 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <Map className="w-9 h-9 text-primary shrink-0 bg-primary/10 border border-primary/20 p-2 rounded-xl" />
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase font-extrabold">Geographic location coords</span>
                    <span className="text-xs font-bold text-slate-350 block mt-0.5">LAT 48.8550° N / LON 2.3662° E</span>
                  </div>
                </div>
                <Badge variant="muted" className="text-primary font-bold text-[9px] border border-primary/20 bg-primary/5 uppercase">VALET AVAILABLE</Badge>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MENU PREVIEWS */}
        {activeTab === 'menu' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center pb-2 border-b border-slate-900">
              <h4 className="text-xs font-extrabold uppercase text-slate-450 tracking-wider">Chef Suggestions & Previews</h4>
              <button 
                onClick={() => navigate(`/customer/restaurant/${restaurant.id}/menu`)}
                className="text-xs text-primary font-bold hover:underline"
              >
                Open Full Catalog
              </button>
            </div>

            <div className="space-y-4">
              {DISH_PREVIEWS.map((dish) => (
                <div key={dish.id} className="p-4 bg-slate-950/40 border border-slate-900 rounded-2xl flex space-x-4">
                  <div className="w-16 h-16 bg-slate-800 rounded-xl overflow-hidden shrink-0">
                    <img src={dish.image} alt={dish.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="space-y-0.5">
                      <div className="flex justify-between items-start">
                        <h5 className="text-xs font-extrabold text-slate-200">{dish.name}</h5>
                        <span className="text-xs font-extrabold text-primary">{dish.price}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">{dish.desc}</p>
                    </div>
                    {dish.chefSpecial && (
                      <Badge variant="warning" className="text-[7.5px] uppercase font-bold self-start mt-1.5 py-0.5 border-0">Chef Special</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: CUSTOMER REVIEWS */}
        {activeTab === 'reviews' && (
          <div className="space-y-6">
            <h4 className="text-xs font-extrabold uppercase text-slate-450 tracking-wider pb-2 border-b border-slate-900">Reviews & Ratings Ledger</h4>
            
            <div className="space-y-4">
              {REVIEWS_MOCK.map((rev, i) => (
                <div key={i} className="p-4 bg-slate-950/40 border border-slate-900 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <h5 className="text-xs font-bold text-slate-205">{rev.author}</h5>
                      <span className="text-[9.5px] text-slate-500 font-semibold">{rev.date}</span>
                    </div>
                    <div className="flex items-center space-x-0.5">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star key={star} className={`w-3.5 h-3.5 ${star <= rev.rating ? 'text-primary fill-current' : 'text-slate-850'}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed italic">"{rev.comment}"</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

    </div>
  );
};

export default RestaurantDetails;
