'use client';

import { useState } from 'react';
import { useCart } from '@/lib/cart-context';

type Product = {
  id: string;
  name: string;
  price_kes: number;
  image_url: string | null;
  stock_qty: number;
};

export function AddToCartButton({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  if (product.stock_qty <= 0) {
    return (
      <span className="btn-secondary mt-4 opacity-50 pointer-events-none select-none">Out of stock</span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        addItem({
          product_id: product.id,
          name: product.name,
          price_kes: Number(product.price_kes),
          image_url: product.image_url,
          stock_qty: product.stock_qty,
        });
        setAdded(true);
        setTimeout(() => setAdded(false), 1500);
      }}
      className="btn-primary mt-4"
    >
      {added ? 'Added ✓' : 'Add to cart'}
    </button>
  );
}
