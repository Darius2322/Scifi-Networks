'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type CartItem = {
  product_id: string;
  name: string;
  price_kes: number;
  image_url: string | null;
  quantity: number;
  stock_qty: number;
};

type CartContextValue = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
  subtotal: number;
  count: number;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = 'scifi-cart';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Load once on mount — cart is per-device, never sent anywhere until checkout.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // corrupt/blocked storage — just start with an empty cart
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // storage full/blocked — cart still works for this session
    }
  }, [items, hydrated]);

  const value = useMemo<CartContextValue>(() => {
    const addItem: CartContextValue['addItem'] = (item, quantity = 1) => {
      setItems((prev) => {
        const existing = prev.find((i) => i.product_id === item.product_id);
        if (existing) {
          const nextQty = Math.min(existing.quantity + quantity, item.stock_qty);
          return prev.map((i) => (i.product_id === item.product_id ? { ...i, quantity: nextQty } : i));
        }
        return [...prev, { ...item, quantity: Math.min(quantity, item.stock_qty) }];
      });
    };

    const setQuantity: CartContextValue['setQuantity'] = (productId, quantity) => {
      setItems((prev) =>
        quantity <= 0
          ? prev.filter((i) => i.product_id !== productId)
          : prev.map((i) => (i.product_id === productId ? { ...i, quantity: Math.min(quantity, i.stock_qty) } : i))
      );
    };

    const removeItem: CartContextValue['removeItem'] = (productId) => {
      setItems((prev) => prev.filter((i) => i.product_id !== productId));
    };

    const clear = () => setItems([]);
    const subtotal = items.reduce((sum, i) => sum + i.price_kes * i.quantity, 0);
    const count = items.reduce((sum, i) => sum + i.quantity, 0);

    return { items, addItem, setQuantity, removeItem, clear, subtotal, count };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
