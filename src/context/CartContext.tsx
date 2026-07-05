import React, { createContext, useContext, useState, useEffect } from 'react';
import { IOrderItem, IMenuItem } from '../types';

interface ICartContextType {
  cartItems: IOrderItem[];
  addItem: (item: IMenuItem, count: number, notes?: string) => void;
  updateQuantity: (itemId: string, count: number) => void;
  updateNotes: (itemId: string, notes: string) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
  cartSubtotal: number; // in cents
  cartTax: number;      // in cents
  cartTotal: number;    // in cents
}

const CartContext = createContext<ICartContextType | undefined>(undefined);

const TAX_RATE = 0.08; // 8% sales tax parameter

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<IOrderItem[]>([]);

  // Hydrate cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('restaurantos_cart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to parse cart local cache', e);
      }
    }
  }, []);

  const saveCart = (items: IOrderItem[]) => {
    setCartItems(items);
    localStorage.setItem('restaurantos_cart', JSON.stringify(items));
  };

  const addItem = (item: IMenuItem, count: number, notes: string = '') => {
    const existingIndex = cartItems.findIndex(ci => ci.itemId === item.id);
    
    // Choose active price (take discount price if configured)
    const activePrice = item.discountPrice && item.discountPrice < item.price 
      ? item.discountPrice 
      : item.price;

    if (existingIndex > -1) {
      const updated = [...cartItems];
      updated[existingIndex].count += count;
      if (notes) {
        updated[existingIndex].notes = notes; // append or overwrite
      }
      saveCart(updated);
    } else {
      const newCartItem: IOrderItem = {
        itemId: item.id,
        name: item.name,
        count,
        notes,
        pricePerUnit: activePrice
      };
      saveCart([...cartItems, newCartItem]);
    }
  };

  const updateQuantity = (itemId: string, count: number) => {
    if (count <= 0) {
      removeItem(itemId);
      return;
    }
    const updated = cartItems.map(ci => 
      ci.itemId === itemId ? { ...ci, count } : ci
    );
    saveCart(updated);
  };

  const updateNotes = (itemId: string, notes: string) => {
    const updated = cartItems.map(ci => 
      ci.itemId === itemId ? { ...ci, notes } : ci
    );
    saveCart(updated);
  };

  const removeItem = (itemId: string) => {
    const filtered = cartItems.filter(ci => ci.itemId !== itemId);
    saveCart(filtered);
  };

  const clearCart = () => {
    saveCart([]);
  };

  // Computations
  const cartSubtotal = cartItems.reduce((acc, item) => acc + item.pricePerUnit * item.count, 0);
  const cartTax = Math.round(cartSubtotal * TAX_RATE);
  const cartTotal = cartSubtotal + cartTax;

  return (
    <CartContext.Provider value={{
      cartItems,
      addItem,
      updateQuantity,
      updateNotes,
      removeItem,
      clearCart,
      cartSubtotal,
      cartTax,
      cartTotal
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
export default CartContext;
