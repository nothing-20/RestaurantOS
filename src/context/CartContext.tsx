import React, { createContext, useContext, useState, useEffect } from 'react';
import { IOrderItem, IMenuItem, ISelectedChoice } from '../types';

interface ICartContextType {
  cartItems: IOrderItem[];
  addItem: (item: IMenuItem, count: number, selections: ISelectedChoice[], notes: string) => void;
  removeItem: (itemId: string, selectionsHash: string) => void;
  clearCart: () => void;
  cartTotal: number; // in cents
}

const CartContext = createContext<ICartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<IOrderItem[]>([]);

  // Load cart from storage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('restaurantos_cart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to parse cart items', e);
      }
    }
  }, []);

  // Save cart modifications
  const saveCart = (items: IOrderItem[]) => {
    setCartItems(items);
    localStorage.setItem('restaurantos_cart', JSON.stringify(items));
  };

  const addItem = (item: IMenuItem, count: number, selections: ISelectedChoice[], notes: string) => {
    // calculate actual price including price modifiers
    const modifierSum = selections.reduce((acc, curr) => acc + curr.priceModifier, 0);
    const pricePerUnit = item.price + modifierSum;

    const newCartItem: IOrderItem = {
      itemId: item.id,
      name: item.name,
      count,
      notes,
      selectedChoices: selections,
      pricePerUnit
    };

    // For simplicity, check if the exact configuration exists
    const selectionsHash = JSON.stringify(selections);
    const existingIndex = cartItems.findIndex(
      ci => ci.itemId === item.id && JSON.stringify(ci.selectedChoices) === selectionsHash
    );

    if (existingIndex > -1) {
      const updated = [...cartItems];
      updated[existingIndex].count += count;
      saveCart(updated);
    } else {
      saveCart([...cartItems, newCartItem]);
    }
  };

  const removeItem = (itemId: string, selectionsHash: string) => {
    const filtered = cartItems.filter(
      ci => !(ci.itemId === itemId && JSON.stringify(ci.selectedChoices) === selectionsHash)
    );
    saveCart(filtered);
  };

  const clearCart = () => {
    saveCart([]);
  };

  const cartTotal = cartItems.reduce((acc, item) => acc + item.pricePerUnit * item.count, 0);

  return (
    <CartContext.Provider value={{ cartItems, addItem, removeItem, clearCart, cartTotal }}>
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
