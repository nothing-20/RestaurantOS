import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { collection, getDocs, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../context/AuthContext';
import Card from '../../../components/ui/Card/Card';
import Badge from '../../../components/ui/Badge/Badge';
import Button from '../../../components/ui/Button/Button';
import Input from '../../../components/ui/Input/Input';
import LoadingSpinner from '../../../components/ui/LoadingSpinner/LoadingSpinner';
import { 
  Calendar, User, Clock, CheckCircle2, ChevronLeft, MapPin, Sparkles, 
  Search, Compass, AlertCircle, Trash2, Edit2, Navigation
} from 'lucide-react';
import toast from 'react-hot-toast';

const REST_MOCK_CONFIGS: Record<string, { 
  supportsSeatPreference: boolean; 
  supportedSeatZones: string[]; 
  availableTimeSlots: string[]; 
  maxGuests: number;
}> = {
  'l-ambroisie': {
    supportsSeatPreference: true,
    supportedSeatZones: ['VIP Table', 'Window Seat', 'Private Dining Room', 'Corner Table'],
    availableTimeSlots: ['12:00 PM', '1:30 PM', '7:00 PM', '8:30 PM', '9:30 PM'],
    maxGuests: 8
  },
  'shuko': {
    supportsSeatPreference: true,
    supportedSeatZones: ['Corner Table', 'Near Live Music', 'VIP Table', 'Rooftop Bar'],
    availableTimeSlots: ['6:00 PM', '7:30 PM', '9:00 PM', '10:30 PM'],
    maxGuests: 4
  },
  'osteria': {
    supportsSeatPreference: false,
    supportedSeatZones: [],
    availableTimeSlots: ['1:00 PM', '2:30 PM', '8:00 PM', '9:30 PM'],
    maxGuests: 6
  }
};

const REST_MOCK_IMAGES = [
  'https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=600&auto=format&fit=crop'
];

export const TableBooking: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  const queryTenantId = searchParams.get('tenantId') || '';

  // Data Loading States
  const [allRestaurants, setAllRestaurants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selection Form States
  const [selectedRest, setSelectedRest] = useState<any | null>(null);
  const [guestsCount, setGuestsCount] = useState<number>(2);
  const [bookDate, setBookDate] = useState<string>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [seatingPreference, setSeatingPreference] = useState<string>('');
  const [specialNotes, setSpecialNotes] = useState<string>('');

  // Editing existing booking states
  const [isModifying, setIsModifying] = useState(false);
  const [modifyingBookingId, setModifyingBookingId] = useState<string>('');

  // Processing & Success states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState<any | null>(null);

  // Load restaurants
  useEffect(() => {
    const fetchRestaurants = async () => {
      setIsLoading(true);
      try {
        const snap = await getDocs(collection(db, 'tenants'));
        const list: any[] = [];
        let index = 0;
        snap.forEach(d => {
          const data = d.data();
          const tenantId = d.id;
          const config = REST_MOCK_CONFIGS[tenantId] || {
            supportsSeatPreference: index % 2 === 0,
            supportedSeatZones: ['VIP Table', 'Window Seat', 'Outdoor Terrace', 'Corner Table'],
            availableTimeSlots: ['6:00 PM', '7:30 PM', '9:00 PM', '10:00 PM'],
            maxGuests: 8
          };
          list.push({
            id: tenantId,
            name: data.restaurantName || data.name || 'Gourmet Bistro',
            cuisine: data.cuisine || 'Fine Dining',
            address: data.address || 'Gastronomy Hub, Gachibowli, Hyderabad',
            landmark: data.landmark || 'Hitech Junction',
            area: data.area || 'Hitech City',
            city: data.city || 'Hyderabad',
            latitude: data.latitude || 17.3850,
            longitude: data.longitude || 78.4867,
            image: data.coverImage || REST_MOCK_IMAGES[index % REST_MOCK_IMAGES.length],
            ...config
          });
          index++;
        });

        if (list.length === 0) {
          // Fallback mockup
          const fallback = [
            { id: 'l-ambroisie', name: "L'Ambroisie", cuisine: "French Haute Cuisine", address: "9 Place des Vosges, Paris", landmark: "Place des Vosges", area: "Marais", city: "Paris", latitude: 48.8550, longitude: 2.3660, image: REST_MOCK_IMAGES[0], ...REST_MOCK_CONFIGS['l-ambroisie'] },
            { id: 'shuko', name: "Shuko Sushi", cuisine: "Premium Japanese Omakase", address: "47 E 12th St, New York", landmark: "Union Square", area: "Manhattan", city: "New York", latitude: 40.7330, longitude: -73.9920, image: REST_MOCK_IMAGES[3], ...REST_MOCK_CONFIGS['shuko'] },
            { id: 'osteria', name: "Osteria Francescana", cuisine: "Italian Fine Dining", address: "Via Stella 22, Modena", landmark: "Duomo", area: "Centro", city: "Modena", latitude: 44.6460, longitude: 10.9250, image: REST_MOCK_IMAGES[1], ...REST_MOCK_CONFIGS['osteria'] }
          ];
          setAllRestaurants(fallback);
        } else {
          setAllRestaurants(list);
        }
      } catch (e) {
        console.error(e);
        toast.error('Failed to load restaurants.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchRestaurants();
  }, []);

  // Pre-select restaurant from URL parameter if available
  useEffect(() => {
    if (queryTenantId && allRestaurants.length > 0) {
      const matched = allRestaurants.find(r => r.id === queryTenantId);
      if (matched) {
        handleSelectRestaurant(matched);
      }
    }
  }, [queryTenantId, allRestaurants]);

  // Filter restaurants based on user search
  const filteredRestaurants = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return allRestaurants;
    return allRestaurants.filter(r => 
      r.name.toLowerCase().includes(q) ||
      r.cuisine.toLowerCase().includes(q) ||
      r.address.toLowerCase().includes(q) ||
      r.area.toLowerCase().includes(q) ||
      r.city.toLowerCase().includes(q)
    );
  }, [allRestaurants, searchQuery]);

  // Set default slot when restaurant selected
  const handleSelectRestaurant = (rest: any) => {
    setSelectedRest(rest);
    setGuestsCount(2);
    if (rest.availableTimeSlots && rest.availableTimeSlots.length > 0) {
      setSelectedTime(rest.availableTimeSlots[0]);
    } else {
      setSelectedTime('7:00 PM');
    }
    if (rest.supportsSeatPreference && rest.supportedSeatZones.length > 0) {
      setSeatingPreference(rest.supportedSeatZones[0]);
    } else {
      setSeatingPreference('');
    }
  };

  // Submit Reservation
  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRest) return;
    setIsSubmitting(true);
    try {
      const bookingId = isModifying ? modifyingBookingId : `RES-${Math.floor(100000 + Math.random() * 900000)}`;
      const notifId = `NOT-${Math.floor(100000 + Math.random() * 900000)}`;
      
      const bookingPayload = {
        id: bookingId,
        bookingId,
        customerId: user?.uid || 'guest-uid',
        customerName: user?.displayName || user?.email || 'Guest Diner',
        restaurantId: selectedRest.id,
        restaurantName: selectedRest.name,
        date: bookDate,
        time: selectedTime,
        guests: guestsCount,
        seatingPreference: selectedRest.supportsSeatPreference ? seatingPreference : '',
        specialNotes,
        status: isModifying ? 'Modified' : 'Pending',
        directions: `${selectedRest.landmark ? `Near ${selectedRest.landmark}, ` : ''}${selectedRest.address}`,
        lat: selectedRest.latitude || null,
        lng: selectedRest.longitude || null,
        createdAt: new Date().toISOString()
      };

      // 1. Write booking details to Customer Profile Reservations History
      if (user?.uid) {
        await setDoc(doc(db, 'users', user.uid, 'reservations', bookingId), bookingPayload);
      }
      
      // 2. Write booking details to Restaurant central reservations collection
      await setDoc(doc(db, 'restaurants', selectedRest.id, 'reservations', bookingId), bookingPayload);

      // 3. Generate Central Booking Notification for Dashboards
      const notificationPayload = {
        id: notifId,
        type: 'reservation',
        bookingId,
        customerName: user?.displayName || user?.email || 'Guest Diner',
        guests: guestsCount,
        date: bookDate,
        time: selectedTime,
        restaurantName: selectedRest.name,
        restaurantId: selectedRest.id,
        branchName: 'Main Branch',
        tableStatus: isModifying ? 'Modified' : 'Pending',
        specialNotes,
        bookingStatus: isModifying ? 'Modified' : 'Pending',
        notificationStatus: 'unread',
        timestamp: new Date().toISOString()
      };
      
      await setDoc(doc(db, 'restaurants', selectedRest.id, 'notifications', notifId), notificationPayload);

      setBookingConfirmed(bookingPayload);
      toast.success(isModifying ? 'Reservation successfully updated!' : 'Reservation successfully requested!');
      setIsModifying(false);
      setModifyingBookingId('');
    } catch (e) {
      console.error(e);
      toast.error('Failed to register reservation details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Modify reservation (prefills form and sets editing modes)
  const handleModifyBooking = () => {
    if (!bookingConfirmed) return;
    setIsModifying(true);
    setModifyingBookingId(bookingConfirmed.id);
    
    // Find restaurant coordinates
    const matched = allRestaurants.find(r => r.id === bookingConfirmed.restaurantId);
    if (matched) {
      setSelectedRest(matched);
    }
    setGuestsCount(bookingConfirmed.guests);
    setBookDate(bookingConfirmed.date);
    setSelectedTime(bookingConfirmed.time);
    setSeatingPreference(bookingConfirmed.seatingPreference || '');
    setSpecialNotes(bookingConfirmed.specialNotes || '');
    setBookingConfirmed(null);
    toast.success('Form loaded. Update your reservation details.');
  };

  // Cancel Reservation
  const handleCancelBooking = async () => {
    if (!bookingConfirmed) return;
    try {
      // Delete in both user and tenant collections
      if (user?.uid) {
        await deleteDoc(doc(db, 'users', user.uid, 'reservations', bookingConfirmed.id));
      }
      await deleteDoc(doc(db, 'restaurants', bookingConfirmed.restaurantId, 'reservations', bookingConfirmed.id));
      
      toast.success('Reservation booking cancelled.');
      setBookingConfirmed(null);
      setSelectedRest(null);
      setIsModifying(false);
    } catch (e) {
      console.error(e);
      toast.error('Failed to cancel reservation.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-955 bg-slate-950 flex items-center justify-center">
        <LoadingSpinner label="Accessing reservation catalog ledger..." />
      </div>
    );
  }

  // Booking Confirmation View
  if (bookingConfirmed) {
    return (
      <div className="max-w-md mx-auto p-6 space-y-6 text-center select-none bg-slate-900/30 border border-slate-900 rounded-3xl mt-8 backdrop-blur-md">
        <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/5">
          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
        </div>
        
        <div className="space-y-1.5">
          <h2 className="text-xl font-display font-extrabold text-white">Booking Confirmed!</h2>
          <p className="text-xs text-slate-450 leading-relaxed">
            Your dining table reservation has been requested and sent to the restaurant dashboard.
          </p>
        </div>

        <div className="p-4.5 bg-slate-950/80 border border-slate-900 rounded-2xl space-y-3.5 text-left text-xs text-slate-400">
          <div className="flex justify-between font-bold border-b border-slate-900 pb-2 text-white">
            <span>Reservation ID</span>
            <span className="text-primary">{bookingConfirmed.id}</span>
          </div>
          <div className="flex justify-between">
            <span>Restaurant Name</span>
            <span className="font-semibold text-white">{bookingConfirmed.restaurantName}</span>
          </div>
          <div className="flex justify-between">
            <span>Diners count</span>
            <span className="font-semibold text-white">{bookingConfirmed.guests} Guests</span>
          </div>
          <div className="flex justify-between">
            <span>Booking Date</span>
            <span className="font-semibold text-white">{bookingConfirmed.date}</span>
          </div>
          <div className="flex justify-between">
            <span>Selected Time</span>
            <span className="font-semibold text-white">{bookingConfirmed.time}</span>
          </div>
          {bookingConfirmed.seatingPreference && (
            <div className="flex justify-between">
              <span>Seating Preference</span>
              <span className="font-semibold text-white">{bookingConfirmed.seatingPreference}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Booking Status</span>
            <Badge variant="warning" className="text-[8px] py-0.5 uppercase font-extrabold bg-amber-400/10 text-primary border-0">{bookingConfirmed.status}</Badge>
          </div>

          {/* Directions / Landmark section */}
          {bookingConfirmed.directions && (
            <div className="flex flex-col gap-1 border-t border-slate-900 pt-2.5 text-[10.5px]">
              <span className="text-slate-500 font-extrabold uppercase tracking-wider block">Directions & Address</span>
              <div className="flex items-start gap-1.5 text-slate-350">
                <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <p className="font-medium text-slate-300">{bookingConfirmed.directions}</p>
                  {bookingConfirmed.lat && bookingConfirmed.lng && (
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${bookingConfirmed.lat},${bookingConfirmed.lng}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-[9.5px] font-bold flex items-center gap-1 mt-1 bg-primary/5 border border-primary/15 py-1 px-2.5 rounded-lg w-fit"
                    >
                      <Navigation className="w-3 h-3 text-primary" />
                      <span>Open Google Maps</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={handleModifyBooking}
              className="py-3 bg-slate-900 hover:bg-slate-850 border border-slate-850 hover:border-slate-800 text-slate-300 hover:text-white font-extrabold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Modify</span>
            </button>
            <button 
              onClick={handleCancelBooking}
              className="py-3 bg-red-500/15 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 text-red-400 font-extrabold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
          </div>
          <Button 
            onClick={() => {
              setBookingConfirmed(null);
              setSelectedRest(null);
            }}
            className="w-full bg-primary text-slate-950 font-extrabold py-3.5 rounded-xl text-xs"
          >
            Find Another Restaurant
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5 text-left select-none pb-12 px-4 sm:px-6">
      
      <div className="flex items-center space-x-1 text-slate-500 hover:text-slate-350 cursor-pointer" onClick={() => navigate('/customer/home')}>
        <ChevronLeft className="w-4 h-4" />
        <span className="text-xs font-bold">Back to Discovery</span>
      </div>

      <div className="space-y-0.5">
        <h2 className="text-base font-display font-extrabold text-white flex items-center gap-1.5">
          Reserve Exclusive Table {isModifying && <Badge variant="primary" className="text-[8px] py-0.5">Modifying</Badge>}
        </h2>
        <p className="text-[11px] text-slate-500">Select your preferred venue and secure your dining window.</p>
      </div>

      {/* PHASE 1: SEARCH & CHOOSE RESTAURANT */}
      {!selectedRest ? (
        <div className="space-y-3.5">
          <div className="relative shadow bg-slate-900/40 border border-slate-900 rounded-xl">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-550" />
            <input 
              type="text" 
              placeholder="Search restaurant by name, cuisine, area, city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-3 bg-transparent text-xs text-white focus:outline-none placeholder-slate-550"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRestaurants.map(rest => (
              <Card 
                key={rest.id}
                onClick={() => handleSelectRestaurant(rest)}
                className="p-3.5 bg-slate-900/20 border-slate-900 hover:border-slate-850 rounded-2xl cursor-pointer transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="h-28 w-full overflow-hidden rounded-xl border border-slate-900 bg-slate-900">
                    <img src={rest.image} alt={rest.name} className="h-full w-full object-cover" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-white truncate">{rest.name}</h4>
                    <p className="text-[10px] text-slate-500 font-semibold truncate">{rest.cuisine}</p>
                    <div className="flex items-center space-x-1 text-[10px] text-slate-500 font-bold mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span className="truncate">{rest.area}, {rest.city}</span>
                    </div>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-950 mt-2 flex justify-between items-center text-[10px]">
                  <span className="text-slate-500 font-medium">Max party: {rest.maxGuests} guests</span>
                  <span className="text-primary font-extrabold">Select Restaurant</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        /* PHASE 2: BOOKING FORM */
        <form onSubmit={handleSubmitBooking} className="flex flex-col gap-4.5 bg-slate-900/30 border border-slate-900 p-5 rounded-2xl backdrop-blur-md">
          
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-950">
            <div className="overflow-hidden">
              <span className="text-[8.5px] text-slate-550 font-extrabold uppercase block tracking-wider">Restaurant selected</span>
              <h4 className="text-xs font-extrabold text-white truncate">{selectedRest.name}</h4>
            </div>
            <button 
              type="button" 
              onClick={() => {
                setSelectedRest(null);
                setIsModifying(false);
              }}
              className="text-[10px] text-slate-500 hover:text-primary font-extrabold transition-colors shrink-0"
            >
              Change
            </button>
          </div>

          {/* Guests Count Selector */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[9.5px] text-slate-500 font-extrabold uppercase tracking-wider">
              <span>Party Size</span>
              <span className="text-primary">{selectedRest.maxGuests} Max</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-900 rounded-xl">
              <div className="flex items-center space-x-2 text-slate-350">
                <User className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-bold text-white">{guestsCount} Diners</span>
              </div>
              <div className="flex space-x-1.5">
                <button 
                  type="button" 
                  onClick={() => setGuestsCount(g => Math.max(1, g - 1))}
                  className="w-7.5 h-7.5 bg-slate-900 border border-slate-850 hover:border-slate-800 rounded-lg flex items-center justify-center text-slate-350 font-bold"
                >
                  -
                </button>
                <button 
                  type="button" 
                  onClick={() => setGuestsCount(g => Math.min(selectedRest.maxGuests, g + 1))}
                  className="w-7.5 h-7.5 bg-slate-900 border border-slate-850 hover:border-slate-800 rounded-lg flex items-center justify-center text-slate-350 font-bold"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Date Picker input */}
          <Input 
            label="Booking Date"
            type="date"
            value={bookDate}
            onChange={(e) => setBookDate(e.target.value)}
            className="bg-slate-950 border-slate-900 text-white rounded-xl focus:border-primary/45 py-2.5 text-xs"
          />

          {/* Dynamic Available Time slots selector */}
          <div className="space-y-1.5">
            <label className="text-[9.5px] text-slate-500 font-extrabold uppercase tracking-wider block">Select Time Slot</label>
            <div className="grid grid-cols-3 gap-2">
              {selectedRest.availableTimeSlots?.map((t: string) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSelectedTime(t)}
                  className={`py-2 text-[10px] font-bold rounded-xl border text-center transition-all ${
                    selectedTime === t 
                      ? 'bg-primary/10 border-primary text-primary font-extrabold shadow' 
                      : 'bg-slate-950 border-slate-900 text-slate-450 hover:text-slate-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Seating preference (Only display if supportsSeatPreference is true) */}
          {selectedRest.supportsSeatPreference && selectedRest.supportedSeatZones?.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-[9.5px] text-slate-500 font-extrabold uppercase tracking-wider block">Preferred Seating Zone</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {selectedRest.supportedSeatZones.map((zone: string) => (
                  <button
                    key={zone}
                    type="button"
                    onClick={() => setSeatingPreference(zone)}
                    className={`py-2.5 px-3 border rounded-xl font-bold text-center transition-all ${
                      seatingPreference === zone
                        ? 'bg-primary/10 border-primary text-primary font-extrabold'
                        : 'bg-slate-950 border-slate-900 text-slate-450 hover:text-slate-300'
                    }`}
                  >
                    {zone}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Special requests/Instructions */}
          <div className="space-y-1.5">
            <label className="text-[9.5px] text-slate-500 font-extrabold uppercase tracking-wider block">Special requests notes</label>
            <textarea
              value={specialNotes}
              onChange={(e) => setSpecialNotes(e.target.value)}
              placeholder="E.g. Table near window, baby chair..."
              className="w-full p-3 bg-slate-950 border border-slate-900 focus:border-primary/40 rounded-xl text-xs text-white focus:outline-none h-20 resize-none"
            />
          </div>

          <Button 
            type="submit"
            disabled={isSubmitting || !selectedTime}
            className="w-full bg-primary text-slate-950 font-bold py-3.5 rounded-xl flex items-center justify-center gap-1.5 text-xs shadow-lg shadow-primary/5 mt-2"
          >
            <Calendar className="w-4 h-4 text-slate-950" />
            <span>{isSubmitting ? 'Requesting Table...' : isModifying ? 'Update Booking Slot' : 'Confirm Booking Slot'}</span>
          </Button>

        </form>
      )}

    </div>
  );
};

export default TableBooking;
