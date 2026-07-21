import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, query, onSnapshot, where } from 'firebase/firestore';
import { db } from '../../../shared/firebase/config';
import { getMenuItemPath, getMenuCategoryPath } from '../../../shared/firebase/collections';
import { IMenuItem, IOrderItem } from '../../../shared/types';
import { useCart } from '../../../shared/services/CartContext';
import { formatPrice } from '../../../shared/utils/format';
import { customerService } from '../../../shared/services/customerService';
import { recommendationEngine, IRecommendationGroup } from '../../../shared/services/recommendationEngine';
import { generateUniqueOrderId } from '../../../shared/utils/orderUtils';

// UI Kit components
import Card from '../../../shared/ui/cards/Card';
import Button from '../../../shared/ui/buttons/Button';
import Badge from '../../../shared/ui/badges/Badge';
import Modal from '../../../shared/ui/dialogs/Modal';
import LoadingSpinner from '../../../shared/ui/loading/LoadingSpinner';

// Icons
import {
  Star,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  ArrowLeft,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  Flame,
  ThumbsUp,
  Heart,
  ChevronRight,
  Sparkles,
  Info,
  Calendar,
  Layers,
  Award,
  CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';

export const CustomerMenu: React.FC = () => {
  const { tenantId } = useParams<{ tenantId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Cart operations
  const {
    cartItems,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    cartSubtotal,
  } = useCart();

  // Session State
  const [session, setSession] = useState<any>(null);
  const [tableNumber, setTableNumber] = useState('3'); // Default fallback table

  // Database / Settings States
  const [menuItems, setMenuItems] = useState<IMenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [restaurantName, setRestaurantName] = useState('Gourmet Bistro');
  const [coverImage, setCoverImage] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [brandingColors, setBrandingColors] = useState<{ primary?: string; secondary?: string }>({});

  // Filtering & Search & Sorting States
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [showVegOnly, setShowVegOnly] = useState(false);
  const [showNonVegOnly, setShowNonVegOnly] = useState(false);
  const [showBestSellerOnly, setShowBestSellerOnly] = useState(false);
  const [showChefSpecialOnly, setShowChefSpecialOnly] = useState(false);
  const [showSpicyOnly, setShowSpicyOnly] = useState(false);
  const [showLowSpiceOnly, setShowLowSpiceOnly] = useState(false);
  const [showQuickPrepOnly, setShowQuickPrepOnly] = useState(false);
  const [sortBy, setSortBy] = useState('popularity'); // popularity, price-asc, price-desc, rating, prep-time

  // Checkout Input States
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isOrderSuccess, setIsOrderSuccess] = useState(false);
  const [successOrderId, setSuccessOrderId] = useState('');
  const [successOrderPrepTime, setSuccessOrderPrepTime] = useState('15-20 mins');
  const [activeOrders, setActiveOrders] = useState<any[]>([]);

  // Details Customization Modal State
  const [selectedItem, setSelectedItem] = useState<IMenuItem | null>(null);
  const [addItemCount, setAddItemCount] = useState(1);
  const [itemNotes, setItemNotes] = useState('');

  // Customization choices
  const [selectedVariant, setSelectedVariant] = useState('Regular');
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);

  // Recommendation State (Refreshed when selectedItem changes)
  const [recommendations, setRecommendations] = useState<IRecommendationGroup>({ alsoOrdered: [], completeMeal: null });

  // UI Drawers Toggle
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Category Emoji Mapping
  const categoryEmojis: Record<string, string> = {
    'starters': '🥗',
    'starter': '🥗',
    'appetizers': '🥗',
    'main course': '🍛',
    'mains': '🍛',
    'pizza': '🍕',
    'pizzas': '🍕',
    'burgers': '🍔',
    'burger': '🍔',
    'beverages': '🥤',
    'drinks': '🥤',
    'desserts': '🍰',
    'dessert': '🍰',
    'rice': '🍚',
    'chinese': '🍜',
    'ice cream': '🍨',
    'combos': '🍱'
  };

  const getCategoryEmoji = (cat: string) => {
    const key = cat.toLowerCase();
    return categoryEmojis[key] || '🍽️';
  };

  // 1. Fetch Branding Details & Subscribe to Menu & Active Session on Mount
  useEffect(() => {
    if (!tenantId) return;
    setIsLoading(true);

    // Load tableParam from URL
    const tableParam = searchParams.get('table') || searchParams.get('tableId') || searchParams.get('t');
    if (tableParam) {
      setTableNumber(tableParam);
    }

    // Load session
    const savedSessionStr = localStorage.getItem('restaurantos_dining_session');
    if (savedSessionStr) {
      try {
        const activeSession = JSON.parse(savedSessionStr);
        if (activeSession.restaurantId === tenantId) {
          const cachedTableNum = activeSession.tableId.replace('TBL-', '');
          if (!tableParam || cachedTableNum === tableParam) {
            setSession(activeSession);
            setTableNumber(cachedTableNum);
          } else {
            localStorage.removeItem('restaurantos_dining_session');
          }
        }
      } catch (e) {
        console.error('Failed to parse cached session', e);
      }
    }

    // Fetch Tenant Info
    const fetchTenantInfo = async () => {
      try {
        const tenantRef = doc(db, 'tenants', tenantId);
        const tenantSnap = await getDoc(tenantRef);
        if (tenantSnap.exists()) {
          const tenantData = tenantSnap.data();
          setRestaurantName(tenantData.restaurantName || tenantData.name || 'Gourmet Bistro');
          setCoverImage(tenantData.coverImage || '');
          setLogoUrl(tenantData.logoUrl || '');
          setBrandingColors({
            primary: tenantData.primaryColor,
            secondary: tenantData.secondaryColor
          });
          if (tenantData.primaryColor) {
            document.documentElement.style.setProperty('--color-primary', tenantData.primaryColor);
          }
          if (tenantData.secondaryColor) {
            document.documentElement.style.setProperty('--color-secondary', tenantData.secondaryColor);
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchTenantInfo();

    // Stream Categories in real-time
    const catColRef = collection(db, getMenuCategoryPath(tenantId));
    const unsubCats = onSnapshot(query(catColRef), (catSnap) => {
      const catList: { name: string; displayOrder: number; isActive: boolean }[] = [];
      catSnap.forEach((doc) => {
        const data = doc.data();
        catList.push({
          name: data.name || '',
          displayOrder: data.displayOrder || 99,
          isActive: data.isActive !== false
        });
      });
      catList.sort((a, b) => a.displayOrder - b.displayOrder);
      const activeCatNames = catList.filter(c => c.isActive).map(c => c.name);
      setCategories(activeCatNames.length > 0 ? activeCatNames : ['Starters', 'Main Course', 'Pizza', 'Burgers', 'Beverages', 'Desserts']);
    });

    // Stream Menu Items in real-time
    const colRef = collection(db, getMenuItemPath(tenantId));
    const unsubItems = onSnapshot(query(colRef), (querySnap) => {
      const items: IMenuItem[] = [];
      querySnap.forEach((docSnap) => {
        const item = { id: docSnap.id, ...docSnap.data() } as IMenuItem;
        items.push(item);
      });
      setMenuItems(items);
      setIsLoading(false);
    }, (e) => {
      console.error(e);
      setIsLoading(false);
    });

    // Audit Viewed Event log
    customerService.logCustomerEvent(tenantId, 'Menu Viewed', `Customer opened exploring menu on table ${tableNumber}`, {
      tenantId,
      tableNumber,
      deviceId: localStorage.getItem('restaurantos_device_id') || 'unknown'
    }).catch(err => console.warn(err));

    return () => {
      unsubCats();
      unsubItems();
    };
  }, [tenantId, tableNumber, searchParams]);

  // 2. Fetch and apply recommendations when item details is opened
  useEffect(() => {
    if (selectedItem) {
      const recs = recommendationEngine.getRecommendations(selectedItem, menuItems);
      setRecommendations(recs);

      // Audit Item View Event
      if (tenantId) {
        customerService.logCustomerEvent(tenantId, 'Item Viewed', `Customer viewed detailed page of ${selectedItem.name}`, {
          itemId: selectedItem.id,
          itemName: selectedItem.name,
          category: selectedItem.category,
          tableNumber
        });
        if (recs.alsoOrdered.length > 0 || recs.completeMeal) {
          customerService.logCustomerEvent(tenantId, 'Recommendation Viewed', `Up-selling recommendation panel loaded for ${selectedItem.name}`, {
            viewedItemId: selectedItem.id,
            recommendedItems: recs.alsoOrdered.map(r => r.name)
          });
        }
      }
    }
  }, [selectedItem, menuItems, tenantId]);

  // 2.b. Real-time listener for active orders in this session (Change 2 & Change 5)
  useEffect(() => {
    if (!tenantId || !session?.sessionId) {
      setActiveOrders([]);
      return;
    }

    const ordersColRef = collection(db, 'restaurants', tenantId, 'orders');
    const q = query(
      ordersColRef,
      where('sessionId', '==', session.sessionId)
    );

    const unsubActiveOrders = onSnapshot(q, (snap) => {
      const list: any[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        // Change 5: Remove from dashboard when order status reaches COMPLETED or CANCELLED
        if (data.status && !['COMPLETED', 'CANCELLED'].includes(data.status?.toUpperCase())) {
          list.push({ id: docSnap.id, ...data });
        }
      });
      // Sort newest active order first
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setActiveOrders(list);
    }, (err) => {
      console.error('[CustomerMenu] Active orders subscription error:', err);
    });

    return () => unsubActiveOrders();
  }, [tenantId, session?.sessionId]);

  // 3. Category scroll handler
  const handleCategoryClick = (cat: string) => {
    setActiveCategory(cat);

    // Log Category view event
    if (tenantId) {
      customerService.logCustomerEvent(tenantId, 'Category Viewed', `Customer filtered category: ${cat}`, {
        categoryName: cat,
        tableNumber
      });
    }

    const sectionEl = document.getElementById(`cat-section-${cat.replace(/\s+/g, '-').toLowerCase()}`);
    if (sectionEl) {
      sectionEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // 4. Custom badge parser based on item ratings or characteristics
  const getItemBadges = (item: IMenuItem) => {
    const badges: string[] = [];
    if (item.rating && item.rating >= 4.7) badges.push('Best Seller');
    if (item.price > 1800) badges.push('Premium');
    if (item.isVeg || item.veg) badges.push('Healthy');
    if (item.category === 'Starters') badges.push('New');

    // Add additional tag mappings if present
    if (item.tags) {
      item.tags.forEach(t => {
        if (!badges.includes(t)) badges.push(t);
      });
    }

    return badges.slice(0, 2); // limit to 2 for visuals
  };

  // 5. Instantly Filter & Sort Menu Items
  const filteredAndSortedItems = useMemo(() => {
    let result = [...menuItems];

    // Filter by category
    if (activeCategory !== 'all') {
      result = result.filter(item => item.category === activeCategory);
    }

    // Filter by Search Query (name, category, description, tags)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(item =>
        item.name.toLowerCase().includes(q) ||
        (item.category || '').toLowerCase().includes(q) ||
        (item.description || '').toLowerCase().includes(q) ||
        (item.tags || []).some(t => t.toLowerCase().includes(q))
      );
    }

    // Interactive Advanced Filters
    if (showVegOnly) {
      result = result.filter(item => item.isVeg || item.veg);
    }
    if (showNonVegOnly) {
      result = result.filter(item => !(item.isVeg || item.veg));
    }
    if (showBestSellerOnly) {
      result = result.filter(item => (item.rating || 0) >= 4.7);
    }
    if (showChefSpecialOnly) {
      result = result.filter(item => item.price >= 1500); // Mock rule representation
    }
    if (showSpicyOnly) {
      result = result.filter(item => item.description.toLowerCase().includes('spicy') || item.description.toLowerCase().includes('chili'));
    }
    if (showLowSpiceOnly) {
      result = result.filter(item => !item.description.toLowerCase().includes('spicy') && !item.description.toLowerCase().includes('chili'));
    }
    if (showQuickPrepOnly) {
      result = result.filter(item => (item.preparationTime || 15) <= 15);
    }

    // Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return (a.discountPrice || a.price) - (b.discountPrice || b.price);
        case 'price-desc':
          return (b.discountPrice || b.price) - (a.discountPrice || a.price);
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'prep-time':
          return (a.preparationTime || 15) - (b.preparationTime || 15);
        case 'popularity':
        default:
          return (b.rating || 0) - (a.rating || 0); // default ratings popularity
      }
    });

    return result;
  }, [menuItems, activeCategory, searchQuery, showVegOnly, showNonVegOnly, showBestSellerOnly, showChefSpecialOnly, showSpicyOnly, showLowSpiceOnly, showQuickPrepOnly, sortBy]);

  // Group items by category to construct sectional headers
  const categorizedMenu = useMemo(() => {
    const groups: Record<string, IMenuItem[]> = {};
    filteredAndSortedItems.forEach(item => {
      const cat = item.category || 'Other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [filteredAndSortedItems]);

  // Confirm & Place Diner Order
  const handlePlaceOrder = async () => {
    console.log('[STEP 1] Confirm button clicked');

    if (!tenantId) {
      console.error('[CustomerMenu] Missing tenantId — cannot place order');
      toast.error('Restaurant session is invalid. Please scan the table QR code again.');
      return;
    }
    if (cartItems.length === 0) {
      toast.error('Your cart is empty. Add items before placing an order.');
      return;
    }

    setIsPlacingOrder(true);
    try {
      const resolvedBranchId = session?.branchId || 'main';
      const resolvedTableId = session?.tableId || `TBL-${tableNumber}`;

      // 1. Validate restaurant open & branch/table status
      const qrParams = {
        r: tenantId,
        b: resolvedBranchId,
        t: resolvedTableId,
        s: session?.secureToken || 'master-token'
      };

      const valRes = await customerService.validateDiningSessionQR(qrParams, true);
      if (!valRes.valid) {
        console.error('[CustomerMenu] Validation failed:', valRes.errorType);
        toast.error(`Order Validation Failed: ${(valRes.errorType || 'unknown').replace('-', ' ').toUpperCase()}`);
        return;
      }

      console.log('[STEP 2] Validation passed');

      // Check if all cart items are available (in-stock)
      const unavailableItem = cartItems.find(ci => {
        const matchingMenuItem = menuItems.find(m => m.id === ci.itemId);
        return matchingMenuItem && matchingMenuItem.available === false;
      });

      if (unavailableItem) {
        toast.error(`"${unavailableItem.name}" is sold out. Please remove it from basket.`);
        return;
      }

      const orderId = generateUniqueOrderId();
      const orderRef = doc(db, 'restaurants', tenantId, 'orders', orderId);

      const finalTableId = valRes.table?.id || valRes.table?.tableId || resolvedTableId;

      const orderPayload = {
        id: orderId,
        orderId,
        tenantId,
        restaurantId: tenantId,
        branchId: resolvedBranchId,
        tableId: finalTableId,
        tableNumber: tableNumber,
        customerName: customerName.trim() || 'Guest Diner',
        phone: customerPhone.trim() || 'Guest Phone',
        items: cartItems,
        subtotal: cartSubtotal,
        tax: gstCharge,
        serviceCharge: serviceCharge,
        discount: 0,
        totalAmount: totalCartCost,
        total: totalCartCost,
        status: 'NEW',
        paymentStatus: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        specialInstructions: specialInstructions.trim(),
        sessionId: session?.sessionId || 'ANON-SESSION'
      };

      console.log('[STEP 3] Order object created', { orderId, tenantId, branchId: resolvedBranchId, tableId: finalTableId, itemCount: cartItems.length, total: totalCartCost });
      console.log('[STEP 4] Writing to Firestore', `restaurants/${tenantId}/orders/${orderId}`);

      await setDoc(orderRef, orderPayload);

      console.log('[STEP 5] Firestore write successful');

      // Update table status — non-blocking so order success is not rolled back
      try {
        const tableRef = doc(db, 'restaurants', tenantId, 'tables', finalTableId);
        await updateDoc(tableRef, {
          status: 'Occupied',
          updatedAt: new Date().toISOString()
        });
      } catch (tableErr) {
        console.warn('[CustomerMenu] Table status update failed (order still placed):', tableErr);
      }

      // Write notification alert for waiter — non-blocking
      try {
        const waiterAlertId = `REQ-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
        const waiterAlertRef = doc(db, 'restaurants', tenantId, 'waiterRequests', waiterAlertId);
        await setDoc(waiterAlertRef, {
          id: waiterAlertId,
          tableNumber: tableNumber,
          requestType: 'New Order Placed',
          status: 'Pending',
          createdAt: new Date().toISOString(),
          orderId
        });
      } catch (alertErr) {
        console.warn('[CustomerMenu] Waiter alert write failed (order still placed):', alertErr);
      }

      console.log('[STEP 6] Showing confirmation dialog');
      // Calculate estimated prep time before clearing cart
      const prepTimes = cartItems.map(ci => {
        const item = menuItems.find(m => m.id === ci.itemId);
        return item?.preparationTime || 15;
      });
      const maxPrep = prepTimes.length > 0 ? Math.max(...prepTimes) : 15;
      setSuccessOrderPrepTime(`${maxPrep} mins`);

      setSuccessOrderId(orderId);
      setIsOrderSuccess(true);
      setIsCartOpen(false);
      toast.success('Order placed successfully!', { id: 'order-placed-success' });

      console.log('[STEP 7] Clearing cart');
      clearCart();

      // Fire operational event logs — non-blocking
      customerService.logCustomerEvent(tenantId, 'Order Created', `Diner placed order ${orderId} on table ${tableNumber} for ${formatPrice(totalCartCost)}`, {
        orderId,
        tableNumber,
        itemsCount: cartItems.length,
        total: totalCartCost
      }).catch(err => console.warn('[CustomerMenu] Event log failed:', err));

      customerService.logCustomerEvent(tenantId, 'Order Sent To Kitchen', `Order ${orderId} routed successfully to KDS kitchen queue`, {
        orderId,
        tableNumber,
        itemsCount: cartItems.length
      }).catch(err => console.warn('[CustomerMenu] Event log failed:', err));
    } catch (e) {
      console.error('[CustomerMenu] Place order error:', e);
      toast.error('Failed to submit order to kitchen.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // Handle Add Item to Cart
  const handleAddToCart = () => {
    if (!selectedItem) return;

    // Calculate variant offset if Regular/Large chosen
    let priceOffset = 0;
    if (selectedVariant === 'Large') priceOffset = 300; // +$3.00
    if (selectedVariant === 'Medium') priceOffset = 150; // +$1.50

    const updatedItem = {
      ...selectedItem,
      price: selectedItem.price + priceOffset,
      discountPrice: selectedItem.discountPrice ? selectedItem.discountPrice + priceOffset : undefined
    };

    // Construct customizable notes
    const customOptionsNotes = [
      selectedVariant !== 'Regular' ? `Size: ${selectedVariant}` : '',
      selectedAddons.length > 0 ? `Add-ons: ${selectedAddons.join(', ')}` : '',
      itemNotes.trim()
    ].filter(Boolean).join(' | ');

    addItem(updatedItem, addItemCount, customOptionsNotes);

    // Log Cart event
    if (tenantId) {
      customerService.logCustomerEvent(tenantId, 'Item Added To Cart', `Added ${selectedItem.name} (x${addItemCount}) to basket`, {
        itemId: selectedItem.id,
        itemName: selectedItem.name,
        quantity: addItemCount,
        options: customOptionsNotes,
        tableNumber
      });
    }

    toast.success(`${selectedItem.name} added to cart!`);
    setSelectedItem(null);
    setSelectedAddons([]);
    setSelectedVariant('Regular');
  };

  // Add bundle items directly to cart
  const handleAddBundleToCart = (bundle: any) => {
    if (!selectedItem || !bundle) return;

    // Add main item
    addItem(selectedItem, 1, `Combo Bundle (Size: Regular)`);

    // Add additional items in bundle
    bundle.bundleItems.forEach((bi: IMenuItem) => {
      addItem(bi, 1, `Combo Item`);
    });

    // Log Cart bundle event
    if (tenantId) {
      customerService.logCustomerEvent(tenantId, 'Item Added To Cart', `Added Combo Bundle containing ${selectedItem.name} to cart`, {
        mainItemName: selectedItem.name,
        bundleItems: bundle.bundleItems.map((b: IMenuItem) => b.name),
        tableNumber
      });
    }

    toast.success('Combo bundle added to cart with discount!');
    setSelectedItem(null);
  };

  // Active Order Card helpers (Change 2)
  const getProgressPercent = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'NEW':
      case 'PLACED': return 15;
      case 'ACCEPTED': return 40;
      case 'PREPARING': return 65;
      case 'READY': return 85;
      case 'DELIVERED': return 100;
      default: return 0;
    }
  };

  const getOrderPrepTime = (order: any) => {
    if (!order?.items || order.items.length === 0) return '15 mins';
    const prepTimes = order.items.map((oi: any) => {
      const matchedItem = menuItems.find(m => m.id === oi.itemId || m.id === oi.id);
      return matchedItem?.preparationTime || 15;
    });
    const maxPrep = prepTimes.length > 0 ? Math.max(...prepTimes) : 15;
    return `${maxPrep} mins`;
  };

  const formatLastUpdated = (updatedAtStr: string) => {
    if (!updatedAtStr) return 'Just now';
    try {
      const date = new Date(updatedAtStr);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return 'Just now';
    }
  };

  // Helper values
  const totalCartItemsCount = cartItems.reduce((acc, curr) => acc + curr.count, 0);
  const gstCharge = Math.round(cartSubtotal * 0.05);
  const serviceCharge = Math.round(cartSubtotal * 0.05);
  const totalCartCost = cartSubtotal + gstCharge + serviceCharge;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center select-none antialiased">
        <div className="relative z-10 space-y-6">
          <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center mx-auto shadow-2xl relative">
            <span className="text-primary font-display font-extrabold text-3xl animate-pulse">R</span>
            <div className="absolute inset-0 border-2 border-primary/20 border-t-primary rounded-2xl animate-spin" />
          </div>
          <div className="space-y-2">
            <h2 className="text-sm font-display font-extrabold uppercase tracking-widest text-slate-500">RestaurantOS</h2>
            <p className="text-xs text-mutedAsh animate-pulse">Loading premium dining menu...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-28 text-left relative overflow-hidden select-none antialiased">
      {/* Ambient background glow */}
      <div className="absolute top-[-10%] left-[-15%] w-[600px] h-[600px] rounded-full bg-primary/5 blur-[150px] pointer-events-none" />

      {/* TOP RESTAURANT COVER HEADER */}
      <div className="w-full h-48 md:h-60 relative overflow-hidden shrink-0">
        <img
          src={coverImage || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=60'}
          alt={restaurantName}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

        {/* Floating active session / table tag details */}
        <div className="absolute top-4 left-6 z-20 flex items-center gap-2">
          <button
            onClick={() => navigate('/customer')}
            className="p-2 bg-slate-950/70 border border-slate-800/40 rounded-xl text-slate-400 hover:text-textPearl transition-all backdrop-blur-md"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>

        <div className="absolute bottom-6 left-6 right-6 z-20 flex items-end justify-between">
          <div className="space-y-1 text-left">
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-display font-extrabold text-textPearl drop-shadow-md">
                {restaurantName}
              </h1>
              {session && (
                <Badge variant="success" className="text-[9px] scale-95 origin-left">
                  Session Active
                </Badge>
              )}
            </div>

            <div className="flex items-center space-x-3 text-xs text-slate-350">
              <span className="font-semibold flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-primary" />
                <span>Table {tableNumber}</span>
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
              <span>Explore Gourmet Menu</span>
            </div>
          </div>

          {logoUrl && (
            <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-800 bg-slate-900 shadow-xl hidden sm:block">
              <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      </div>

      {/* STICKY SEARCH & CATEGORY BAR */}
      <div className="bg-slate-950/95 sticky top-0 z-30 border-b border-slate-850/60 pb-3 pt-4 backdrop-blur-md px-6">
        <div className="max-w-4xl mx-auto space-y-3.5">
          {/* Search bar block */}
          <div className="flex items-center gap-2.5">
            <div className="flex-1 bg-slate-900 border border-slate-850 focus-within:border-primary/50 rounded-2xl px-4 py-3 flex items-center space-x-3 shadow-lg shadow-black/10 transition-colors">
              <Search className="w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search pizzas, starters, chef selections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-xs font-semibold text-textPearl placeholder-slate-500 w-full outline-none"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-slate-500 hover:text-textPearl text-xs">Clear</button>
              )}
            </div>

            {/* Filter Toggle Button */}
            <button
              onClick={() => setIsFiltersOpen(true)}
              className={`p-3 rounded-2xl border flex items-center justify-center transition-all ${showVegOnly || showNonVegOnly || showBestSellerOnly || showSpicyOnly || showQuickPrepOnly
                  ? 'bg-primary border-primary text-background'
                  : 'bg-slate-900 border-slate-850 text-slate-450 hover:text-textPearl'
                }`}
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>

          {/* Scrolling category Chips */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none select-none">
            <button
              onClick={() => handleCategoryClick('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-300 border ${activeCategory === 'all'
                  ? 'bg-primary border-primary text-background font-extrabold'
                  : 'bg-slate-900 border-slate-850 text-slate-400 hover:text-textPearl'
                }`}
            >
              🍽️ All Selections
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryClick(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-300 border ${activeCategory === cat
                    ? 'bg-primary border-primary text-background font-extrabold font-bold'
                    : 'bg-slate-900 border-slate-850 text-slate-400 hover:text-textPearl'
                  }`}
              >
                {getCategoryEmoji(cat)} {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="max-w-4xl mx-auto px-6 pt-6 relative z-10 space-y-8 text-left">
        {/* Change 2: Persistent Active Order Card */}
        {activeOrders.length > 0 && (
          <div className="space-y-4">
            {activeOrders.map((activeOrder) => {
              const progressPercent = getProgressPercent(activeOrder.status);
              const prepTime = getOrderPrepTime(activeOrder);
              const itemsCount = activeOrder.items?.reduce((sum: number, item: any) => sum + (item.count || 1), 0) || 0;
              const formattedTime = formatLastUpdated(activeOrder.updatedAt || activeOrder.createdAt);

              return (
                <div
                  key={activeOrder.id}
                  className="bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-primary/10 border border-primary/25 rounded-3xl p-5 shadow-2xl relative overflow-hidden backdrop-blur-md"
                >
                  {/* Subtle background highlight */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none" />

                  <div className="flex justify-between items-start pb-3 border-b border-slate-800/60 mb-4">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Active Order</span>
                      <strong className="text-xs font-mono text-textPearl uppercase">#{activeOrder.orderId}</strong>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Last Updated</span>
                      <span className="text-xs font-semibold text-slate-300">{formattedTime}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
                    <div>
                      <span className="text-slate-500 block font-semibold">Est. Preparation Time:</span>
                      <span className="text-primary font-bold">{prepTime}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block font-semibold">Items Count:</span>
                      <span className="text-textPearl font-bold">{itemsCount} {itemsCount === 1 ? 'item' : 'items'}</span>
                    </div>
                  </div>

                  {/* Progress Indicator */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-primary uppercase tracking-wider">
                        Status: {activeOrder.status === 'NEW' ? 'Order Received' : activeOrder.status}
                      </span>
                      <span className="text-slate-400">{progressPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden p-0.5 border border-slate-700/30">
                      <div
                        style={{ width: `${progressPercent}%` }}
                        className="bg-gradient-to-r from-primary to-amber-500 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <Button
                      onClick={() => navigate(`/customer/restaurant/${tenantId}/order/${activeOrder.orderId}`)}
                      className="flex-1 bg-primary hover:bg-primary-hover text-background font-bold py-2.5 rounded-xl shadow-lg shadow-primary/10 flex items-center justify-center gap-1.5 transition-all text-xs"
                    >
                      Track My Order
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      onClick={() => {
                        const firstCat = Object.keys(categorizedMenu)[0];
                        const el = firstCat ? document.getElementById(`cat-section-${firstCat.replace(/\s+/g, '-').toLowerCase()}`) : null;
                        if (el) {
                          el.scrollIntoView({ behavior: 'smooth' });
                        } else {
                          window.scrollTo({ top: 500, behavior: 'smooth' });
                        }
                      }}
                      className="flex-1 bg-slate-900 border border-slate-800 text-slate-300 hover:text-textPearl py-2.5 rounded-xl text-xs"
                    >
                      Continue Browsing
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {filteredAndSortedItems.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-slate-850 rounded-2xl bg-slate-900/10">
            <AlertTriangle className="w-8 h-8 text-slate-700 mx-auto mb-2" />
            <p className="text-sm text-slate-400 font-semibold">No menu dishes match your selections.</p>
          </div>
        ) : (
          Object.entries(categorizedMenu).map(([categoryName, items]) => (
            <div
              key={categoryName}
              id={`cat-section-${categoryName.replace(/\s+/g, '-').toLowerCase()}`}
              className="space-y-4 pt-2"
            >
              <h2 className="text-base font-display font-extrabold text-textPearl tracking-wide flex items-center space-x-2">
                <span className="text-primary">{getCategoryEmoji(categoryName)}</span>
                <span>{categoryName}</span>
                <span className="text-[10px] text-slate-500 font-bold bg-slate-900 px-2 py-0.5 border border-slate-850 rounded-lg">
                  {items.length} dishes
                </span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {items.map((item) => {
                  const isVeg = item.isVeg || item.veg;
                  const discountPrice = item.discountPrice;
                  const badges = getItemBadges(item);

                  return (
                    <Card
                      key={item.id}
                      className={`p-4 border-slate-855 bg-slate-900/20 hover:border-slate-800/80 hover:bg-slate-900/40 flex items-start justify-between space-x-4 cursor-pointer transition-all ${item.available === false ? 'opacity-40' : ''
                        }`}
                      onClick={() => item.available !== false && setSelectedItem(item)}
                    >
                      <div className="flex-1 flex flex-col text-left space-y-1">
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          {/* Veg/Non-veg Dot */}
                          <div className={`w-3.5 h-3.5 border flex items-center justify-center shrink-0 rounded ${isVeg ? 'border-emerald-500' : 'border-red-500'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${isVeg ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          </div>

                          <h3 className="font-display font-extrabold text-sm text-textPearl leading-tight">
                            {item.name}
                          </h3>

                          {badges.map((b) => (
                            <span
                              key={b}
                              className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${b === 'Best Seller' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-primary/10 text-primary border border-primary/20'
                                }`}
                            >
                              {b}
                            </span>
                          ))}
                        </div>

                        <p className="text-[11px] text-slate-450 leading-relaxed font-medium line-clamp-2">
                          {item.description || 'Tasty house-crafted gourmet specialty.'}
                        </p>

                        <div className="flex items-center space-x-2.5 pt-1">
                          {discountPrice ? (
                            <>
                              <span className="text-sm font-extrabold text-textPearl">{formatPrice(discountPrice)}</span>
                              <span className="text-[10px] text-slate-500 line-through">{formatPrice(item.price)}</span>
                            </>
                          ) : (
                            <span className="text-sm font-extrabold text-textPearl">{formatPrice(item.price)}</span>
                          )}
                        </div>

                        {/* Card metadata line */}
                        <div className="flex items-center space-x-3.5 pt-2 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                          <div className="flex items-center text-amber-500">
                            <Star className="w-3 h-3 fill-current mr-0.5" />
                            <span>{item.rating?.toFixed(1) || '4.5'}</span>
                          </div>

                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{item.preparationTime || 15} mins</span>
                          </div>

                          {item.description.toLowerCase().includes('spicy') && (
                            <div className="flex items-center space-x-0.5 text-red-500">
                              <Flame className="w-3.5 h-3.5" />
                              <span>Spicy</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card visual details block */}
                      <div className="flex flex-col items-center shrink-0 space-y-2 select-none">
                        {item.imageUrl ? (
                          <div className="w-20 h-20 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-lg relative">
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                        ) : (
                          <div className="w-20 h-20 rounded-2xl border border-slate-850 bg-slate-950 flex items-center justify-center text-slate-700">
                            <Sparkles className="w-5 h-5" />
                          </div>
                        )}

                        {item.available === false ? (
                          <span className="text-[9px] font-bold bg-slate-900 border border-slate-800 text-slate-500 px-2 py-1 rounded-lg uppercase">
                            Sold Out
                          </span>
                        ) : (
                          <Button
                            variant="secondary"
                            className="text-[10px] font-extrabold uppercase px-3 py-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-primary/45 rounded-lg text-primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedItem(item);
                            }}
                          >
                            + Add
                          </Button>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </main>

      {/* FLOATING BASKET PREVIEW BAR (Survives Refresh, Caches Items) */}
      {totalCartItemsCount > 0 && (
        <div className="fixed bottom-6 right-6 z-40 max-w-sm w-[90%] sm:w-auto">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full sm:w-auto bg-primary hover:bg-primary-hover text-background font-display font-extrabold px-6 py-4 rounded-2xl flex items-center justify-between gap-6 shadow-2xl shadow-primary/20 transition-transform active:scale-[0.98] animate-bounce"
          >
            <div className="flex items-center space-x-3.5">
              <ShoppingBag className="w-5 h-5" />
              <span className="text-xs">Basket • {totalCartItemsCount} Items</span>
            </div>
            <div className="flex items-center space-x-1.5 text-xs">
              <strong>{formatPrice(totalCartCost)}</strong>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {/* FILTER CONTROLS MODAL */}
      <Modal
        isOpen={isFiltersOpen}
        onClose={() => setIsFiltersOpen(false)}
        title="Custom Filters & Sorting"
      >
        <div className="space-y-5 text-left text-xs select-none">
          {/* Sorting choices */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Sort Catalog By</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'popularity', label: 'Popularity' },
                { id: 'rating', label: 'Customer Rating' },
                { id: 'price-asc', label: 'Price: Low to High' },
                { id: 'price-desc', label: 'Price: High to Low' },
                { id: 'prep-time', label: 'Preparation Time' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setSortBy(opt.id)}
                  className={`p-2.5 rounded-xl border font-semibold text-center transition-all ${sortBy === opt.id
                      ? 'bg-primary border-primary text-background'
                      : 'bg-slate-900 border-slate-850 text-slate-400 hover:text-textPearl'
                    }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Filtering switches */}
          <div className="space-y-2 border-t border-slate-850 pt-4">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Dietary preference</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setShowVegOnly(!showVegOnly);
                  if (showNonVegOnly) setShowNonVegOnly(false);
                }}
                className={`px-3 py-2 rounded-xl border font-bold transition-all ${showVegOnly
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                    : 'bg-slate-900 border-slate-850 text-slate-400'
                  }`}
              >
                🥦 Veg Only
              </button>
              <button
                onClick={() => {
                  setShowNonVegOnly(!showNonVegOnly);
                  if (showVegOnly) setShowVegOnly(false);
                }}
                className={`px-3 py-2 rounded-xl border font-bold transition-all ${showNonVegOnly
                    ? 'bg-red-500/10 border-red-500/40 text-red-400'
                    : 'bg-slate-900 border-slate-850 text-slate-400'
                  }`}
              >
                🥩 Non-Veg Only
              </button>
            </div>
          </div>

          <div className="space-y-2 border-t border-slate-850 pt-4">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Tags & Specialties</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowBestSellerOnly(!showBestSellerOnly)}
                className={`px-3 py-2 rounded-xl border font-bold transition-all ${showBestSellerOnly
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                    : 'bg-slate-900 border-slate-850 text-slate-400'
                  }`}
              >
                ⭐ Best Sellers
              </button>
              <button
                onClick={() => setShowChefSpecialOnly(!showChefSpecialOnly)}
                className={`px-3 py-2 rounded-xl border font-bold transition-all ${showChefSpecialOnly
                    ? 'bg-violet-500/10 border-violet-500/40 text-violet-400'
                    : 'bg-slate-900 border-slate-850 text-slate-400'
                  }`}
              >
                👨‍🍳 Chef Specials
              </button>
              <button
                onClick={() => {
                  setShowSpicyOnly(!showSpicyOnly);
                  if (showLowSpiceOnly) setShowLowSpiceOnly(false);
                }}
                className={`px-3 py-2 rounded-xl border font-bold transition-all ${showSpicyOnly
                    ? 'bg-red-500/10 border-red-500/40 text-red-400'
                    : 'bg-slate-900 border-slate-850 text-slate-400'
                  }`}
              >
                🌶️ Spicy Selection
              </button>
              <button
                onClick={() => {
                  setShowLowSpiceOnly(!showLowSpiceOnly);
                  if (showSpicyOnly) setShowSpicyOnly(false);
                }}
                className={`px-3 py-2 rounded-xl border font-bold transition-all ${showLowSpiceOnly
                    ? 'bg-teal-500/10 border-teal-500/40 text-teal-400'
                    : 'bg-slate-900 border-slate-850 text-slate-400'
                  }`}
              >
                🌱 Low Spice
              </button>
              <button
                onClick={() => setShowQuickPrepOnly(!showQuickPrepOnly)}
                className={`px-3 py-2 rounded-xl border font-bold transition-all ${showQuickPrepOnly
                    ? 'bg-primary/10 border-primary/45 text-primary'
                    : 'bg-slate-900 border-slate-855 text-slate-400'
                  }`}
              >
                ⚡ Quick Prep (&lt;15m)
              </button>
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <Button
              className="flex-1 text-xs py-2 bg-slate-800 border-slate-700 text-slate-400"
              onClick={() => {
                setShowVegOnly(false);
                setShowNonVegOnly(false);
                setShowBestSellerOnly(false);
                setShowChefSpecialOnly(false);
                setShowSpicyOnly(false);
                setShowLowSpiceOnly(false);
                setShowQuickPrepOnly(false);
                setSortBy('popularity');
                toast.success('Filters cleared.');
              }}
            >
              Clear All
            </Button>
            <Button
              className="flex-1 text-xs py-2"
              onClick={() => setIsFiltersOpen(false)}
            >
              Apply Selections
            </Button>
          </div>
        </div>
      </Modal>

      {/* DISH DETAILS / CUSTOMIZATION MODAL */}
      <Modal
        isOpen={selectedItem !== null}
        onClose={() => setSelectedItem(null)}
        title={selectedItem?.name || 'Customize Selection'}
      >
        {selectedItem && (
          <div className="space-y-5 text-left text-xs select-none max-h-[75vh] overflow-y-auto pr-1">
            {/* Visual Cover Header */}
            {selectedItem.imageUrl ? (
              <div className="w-full h-44 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
                <img src={selectedItem.imageUrl} alt={selectedItem.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-full h-24 rounded-2xl border border-slate-850 bg-slate-950/40 flex items-center justify-center text-slate-700">
                <Sparkles className="w-7 h-7" />
              </div>
            )}

            {/* Description & metadata tags */}
            <div className="space-y-2">
              <p className="text-slate-400 leading-relaxed font-medium">
                {selectedItem.description || 'Expertly prepared house-crafted delicacy.'}
              </p>

              {/* Nutritional block & Allergens */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="bg-slate-900 border border-slate-850 p-2.5 rounded-xl flex items-start gap-2">
                  <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">Nutrition facts</span>
                    <span className="text-[10px] text-slate-350 font-semibold block leading-tight">Calories: 380 kcal | Protein: 12g</span>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-855 p-2.5 rounded-xl flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[9px] text-slate-550 font-bold block uppercase tracking-wider">Allergens</span>
                    <span className="text-[10px] text-slate-350 font-semibold block leading-tight">Contains: Gluten, Dairy</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sizes / Variants Selector */}
            <div className="space-y-2 border-t border-slate-850 pt-4">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Select Size Variant</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'Small', label: 'Small', tag: 'Regular price' },
                  { id: 'Medium', label: 'Medium', tag: '+$1.50' },
                  { id: 'Large', label: 'Large', tag: '+$3.00' }
                ].map(v => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v.id)}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-0.5 text-center transition-all ${selectedVariant === v.id
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-slate-900 border-slate-850 text-slate-400 hover:text-textPearl'
                      }`}
                  >
                    <span className="font-bold text-[11px]">{v.label}</span>
                    <span className="text-[8.5px] font-semibold text-slate-500">{v.tag}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Add-ons Checklist */}
            <div className="space-y-2 border-t border-slate-850 pt-4">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Add Extra Ingredients</label>
              <div className="space-y-2">
                {[
                  { id: 'extra-cheese', label: 'Extra Cheese', price: 100 },
                  { id: 'garlic-dip', label: 'Garlic Butter Dip', price: 50 },
                  { id: 'extra-veggies', label: 'Extra Topping Veggies', price: 150 }
                ].map(addon => {
                  const isChecked = selectedAddons.includes(addon.label);
                  return (
                    <button
                      key={addon.id}
                      onClick={() => {
                        setSelectedAddons(prev =>
                          isChecked ? prev.filter(a => a !== addon.label) : [...prev, addon.label]
                        );
                      }}
                      className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-left transition-all ${isChecked
                          ? 'bg-slate-900 border-primary/45 text-textPearl'
                          : 'bg-slate-900 border-slate-855 text-slate-400'
                        }`}
                    >
                      <span className="font-bold">{addon.label}</span>
                      <span className="font-mono text-primary text-[10.5px]">+{formatPrice(addon.price)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Notes */}
            <div className="space-y-2 border-t border-slate-850 pt-4">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Preparation Instructions</label>
              <textarea
                placeholder="E.g., No onions, Make it extra spicy, Less salt..."
                value={itemNotes}
                onChange={(e) => setItemNotes(e.target.value)}
                className="w-full bg-slate-900 border border-slate-850 focus:border-primary rounded-xl p-3 text-xs font-semibold text-textPearl outline-none"
                rows={2}
              />
            </div>

            {/* RULE-BASED UP-SELLING RECOMMENDATIONS (Static Engine integration) */}
            {(recommendations.alsoOrdered.length > 0 || recommendations.completeMeal) && (
              <div className="space-y-3.5 border-t border-slate-850 pt-4">
                <h4 className="text-[10.5px] font-bold text-primary uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Chef Up-Sells Selections</span>
                </h4>

                {/* 1. Complete Your Meal Combo card */}
                {recommendations.completeMeal && (
                  <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-slate-900/10 border border-primary/25 rounded-2xl p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <Badge variant="warning" className="text-[8.5px] tracking-wider uppercase font-bold py-0.5 mb-1.5">
                          Complete Your Meal Bundle
                        </Badge>
                        <h5 className="text-[11.5px] font-extrabold text-textPearl">
                          Add combo: {selectedItem.name} + {recommendations.completeMeal.bundleItems.map(b => b.name).join(' & ')}
                        </h5>
                      </div>
                      <span className="text-[9.5px] font-extrabold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg uppercase">
                        Save {formatPrice(recommendations.completeMeal.discountAmount)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex flex-col text-left">
                        <span className="text-[9px] text-slate-500 line-through">
                          Original: {formatPrice(recommendations.completeMeal.originalTotal + (selectedItem.discountPrice || selectedItem.price))}
                        </span>
                        <strong className="text-textPearl font-extrabold text-xs">
                          Combo price: <span className="text-primary">{formatPrice(recommendations.completeMeal.bundleTotal + (selectedItem.discountPrice || selectedItem.price))}</span>
                        </strong>
                      </div>

                      <Button
                        className="text-[10px] font-bold px-3 py-1.5"
                        onClick={() => handleAddBundleToCart(recommendations.completeMeal)}
                      >
                        Add Combo
                      </Button>
                    </div>
                  </Card>
                )}

                {/* 2. Also Ordered Item list */}
                {recommendations.alsoOrdered.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <span className="text-[9.5px] text-slate-500 font-bold block uppercase tracking-wider">People also ordered</span>
                    <div className="flex flex-col gap-2">
                      {recommendations.alsoOrdered.map((item) => (
                        <div key={item.id} className="bg-slate-900 border border-slate-850 p-2.5 rounded-xl flex justify-between items-center text-xs">
                          <div className="space-y-0.5">
                            <span className="font-bold text-textPearl block leading-tight">{item.name}</span>
                            <span className="text-[10px] text-slate-455 font-mono">{formatPrice(item.discountPrice || item.price)}</span>
                          </div>

                          <Button
                            variant="secondary"
                            className="text-[9px] font-bold py-1 px-2.5 bg-slate-950 border border-slate-800 hover:border-primary text-primary"
                            onClick={() => {
                              addItem(item, 1, `Recommended item added from ${selectedItem.name}`);
                              toast.success(`${item.name} added to cart!`);
                            }}
                          >
                            + Add
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Bottom Actions footer */}
            <div className="flex items-center justify-between border-t border-slate-850 pt-4 gap-4">
              {/* Counters */}
              <div className="flex items-center space-x-3.5 bg-slate-900 border border-slate-850 p-1.5 rounded-2xl shrink-0">
                <button
                  onClick={() => setAddItemCount(prev => Math.max(1, prev - 1))}
                  className="p-1.5 bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-textPearl rounded-xl"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-bold text-textPearl w-4 text-center">{addItemCount}</span>
                <button
                  onClick={() => setAddItemCount(prev => prev + 1)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-textPearl rounded-xl"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Add trigger */}
              <Button
                onClick={handleAddToCart}
                className="flex-1 text-xs py-3 font-bold bg-primary hover:bg-primary-hover text-background"
              >
                Add to Cart • {formatPrice((selectedItem.discountPrice || selectedItem.price) * addItemCount)}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* CUSTOMER BASKET / CART DRAWER OVERLAY */}
      <Modal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        title="Explore Basket Summary"
      >
        <div className="space-y-4 text-left select-none text-xs">
          {cartItems.length === 0 ? (
            <div className="py-8 text-center border border-dashed border-slate-850 rounded-2xl bg-slate-900/10">
              <ShoppingBag className="w-8 h-8 text-slate-755 mx-auto mb-2" />
              <p className="text-xs text-slate-400 font-semibold">Your dining cart is empty.</p>
            </div>
          ) : (
            <>
              <div className="space-y-3 divide-y divide-slate-850/60 max-h-52 overflow-y-auto pr-1">
                {cartItems.map((item) => (
                  <div key={item.itemId} className="flex items-start justify-between pt-3.5 first:pt-0">
                    <div className="flex-1 space-y-1 pr-4">
                      <h4 className="text-xs font-bold text-textPearl leading-tight">{item.name}</h4>
                      {item.notes ? (
                        <p className="text-[9.5px] text-primary font-bold">Customization: {item.notes}</p>
                      ) : null}
                      <span className="text-[10px] text-slate-500 font-mono block pt-0.5">{formatPrice(item.pricePerUnit)} each</span>
                    </div>

                    <div className="flex items-center space-x-3.5 shrink-0">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.itemId, item.count - 1)}
                          className="p-1 bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-textPearl rounded-lg"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-bold text-textPearl w-4 text-center">{item.count}</span>
                        <button
                          onClick={() => updateQuantity(item.itemId, item.count + 1)}
                          className="p-1 bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-textPearl rounded-lg"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.itemId)}
                        className="p-1 text-slate-600 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Checkout details input forms */}
              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Your Name</label>
                  <input
                    type="text"
                    placeholder="Enter guest name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-850 focus:border-primary rounded-xl p-3 text-xs font-semibold text-textPearl outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Phone Number</label>
                  <input
                    type="text"
                    placeholder="Enter phone number"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-850 focus:border-primary rounded-xl p-3 text-xs font-semibold text-textPearl outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Whole-Order Cooking Instructions</label>
                  <textarea
                    placeholder="E.g. Serve starters first, less salt in main course..."
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-855 focus:border-primary rounded-xl p-3 text-xs font-semibold text-textPearl outline-none"
                    rows={2}
                  />
                </div>
              </div>

              {/* Running invoicing calculations */}
              <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl space-y-2 text-xs font-semibold text-slate-400 pt-3">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-textPearl">{formatPrice(cartSubtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST (5%)</span>
                  <span className="text-textPearl">{formatPrice(gstCharge)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Service Fee (5%)</span>
                  <span className="text-textPearl">{formatPrice(serviceCharge)}</span>
                </div>
                <div className="flex justify-between text-textPearl font-extrabold text-sm pt-2.5 border-t border-slate-850/60">
                  <span>Basket Total</span>
                  <span className="text-primary">{formatPrice(totalCartCost)}</span>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  className="w-full text-xs font-bold py-3 bg-gradient-to-r from-primary to-amber-600 hover:from-primary-hover hover:to-amber-700 text-background"
                  onClick={handlePlaceOrder}
                  isLoading={isPlacingOrder}
                >
                  Confirm & Place Order
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* ORDER SUCCESS DIALOG */}
      <Modal
        isOpen={isOrderSuccess}
        onClose={() => setIsOrderSuccess(false)}
        title=""
      >
        <div className="space-y-6 text-center py-4 text-xs select-none">
          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/5">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 animate-bounce" />
          </div>
          <div className="space-y-3">
            <h3 className="font-display font-extrabold text-base text-textPearl">✅ ORDER CONFIRMED</h3>
            <p className="text-xs text-mutedAsh">
              Your order has been successfully placed.
            </p>
            <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-2xl text-xs font-semibold text-slate-400 space-y-2 text-left max-w-xs mx-auto">
              <div className="flex justify-between">
                <span>Order Number:</span>
                <span className="text-textPearl font-mono font-bold uppercase">{successOrderId}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Preparation Time:</span>
                <span className="text-primary font-bold">{successOrderPrepTime}</span>
              </div>
              <div className="flex justify-between">
                <span>Current Status:</span>
                <span className="text-emerald-500 font-bold">NEW</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <Button
              onClick={() => {
                setIsOrderSuccess(false);
                navigate(`/customer/restaurant/${tenantId}/order/${successOrderId}`);
              }}
              className="w-full bg-primary hover:bg-primary-hover text-background font-bold"
            >
              Track My Order
            </Button>
            <Button
              onClick={() => {
                setIsOrderSuccess(false);
              }}
              className="w-full bg-slate-900 border-slate-800 text-slate-300 hover:text-textPearl"
            >
              Continue Browsing
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CustomerMenu;
