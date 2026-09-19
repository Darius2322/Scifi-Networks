'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Product = {
  id: string;
  name: string;
  description: string | null;
  price_kes: number;
  category: string;
  image_url: string | null;
  stock_qty: number;
  is_active: boolean;
  is_archived: boolean;
};

export function ProductManager({ initialProducts }: { initialProducts: Product[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-8">
      <div className="border border-ink-950/10">
        <table className="w-full text-sm">
          <thead className="border-b border-ink-950/10 text-left text-ink-800/60">
            <tr>
              <th className="p-3 font-medium">Product</th>
              <th className="p-3 font-medium">Category</th>
              <th className="p-3 font-medium">Price</th>
              <th className="p-3 font-medium">Stock</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-950/10">
            {initialProducts.map((product) => (
              <ProductRow
                key={product.id}
                product={product}
                isEditing={editingId === product.id}
                onEdit={() => setEditingId(product.id)}
                onCancelEdit={() => setEditingId(null)}
                onSaved={() => {
                  setEditingId(null);
                  router.refresh();
                }}
              />
            ))}
            {initialProducts.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-ink-800/60">
                  No products yet. Add your first one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="border border-ink-950/10 p-5 h-fit">
        <h2 className="font-medium text-ink-950">Add a product</h2>
        <div className="mt-4">
          <CreateProductForm onCreated={() => router.refresh()} />
        </div>
      </div>
    </div>
  );
}

function ProductRow({
  product,
  isEditing,
  onEdit,
  onCancelEdit,
  onSaved,
}: {
  product: Product;
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSaved: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);

  async function toggleArchive() {
    setSubmitting(true);
    await fetch(`/api/admin/products/${product.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_archived: !product.is_archived, is_active: product.is_archived }),
    });
    setSubmitting(false);
    onSaved();
  }

  if (isEditing) {
    return (
      <tr>
        <td colSpan={6} className="p-4 bg-paper-100">
          <EditProductForm product={product} onSaved={onSaved} onCancel={onCancelEdit} />
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td className="p-3 font-medium text-ink-950">{product.name}</td>
      <td className="p-3 text-ink-800/70">{product.category}</td>
      <td className="p-3 text-ink-800/70">KES {Number(product.price_kes).toLocaleString()}</td>
      <td className="p-3 text-ink-800/70">{product.stock_qty}</td>
      <td className="p-3">
        {product.is_archived ? (
          <span className="text-ink-800/50">Archived</span>
        ) : product.is_active ? (
          <span className="text-status-good">Active</span>
        ) : (
          <span className="text-status-warn">Disabled</span>
        )}
      </td>
      <td className="p-3 text-right space-x-3 whitespace-nowrap">
        <button onClick={onEdit} className="text-signal-500 hover:text-signal-600">
          Edit
        </button>
        <button onClick={toggleArchive} disabled={submitting} className="text-ink-800/60 hover:text-ink-950">
          {product.is_archived ? 'Unarchive' : 'Archive'}
        </button>
      </td>
    </tr>
  );
}

function CreateProductForm({ onCreated }: { onCreated: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.get('name'),
          category: formData.get('category') || 'general',
          price_kes: formData.get('price_kes'),
          stock_qty: formData.get('stock_qty') || 0,
          image_url: formData.get('image_url'),
          description: formData.get('description'),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'Could not create product.');
        return;
      }
      (e.target as HTMLFormElement).reset();
      onCreated();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {error && (
        <p role="alert" className="border border-status-bad/30 bg-status-bad/5 p-2.5 text-xs text-status-bad">
          {error}
        </p>
      )}
      <TextField label="Name" name="name" required />
      <TextField label="Category" name="category" placeholder="routers, cables, extenders…" />
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Price (KES)" name="price_kes" type="number" required />
        <TextField label="Stock qty" name="stock_qty" type="number" placeholder="0" />
      </div>
      <TextField label="Image URL" name="image_url" placeholder="https://…" />
      <TextAreaField label="Description" name="description" />
      <button
        type="submit"
        disabled={submitting}
        className="w-full inline-flex items-center justify-center rounded-sm bg-signal-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-signal-600 transition-colors disabled:opacity-60"
      >
        {submitting ? 'Adding…' : 'Add product'}
      </button>
    </form>
  );
}

function EditProductForm({ product, onSaved, onCancel }: { product: Product; onSaved: () => void; onCancel: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.get('name'),
          category: formData.get('category'),
          price_kes: formData.get('price_kes'),
          stock_qty: formData.get('stock_qty'),
          image_url: formData.get('image_url'),
          description: formData.get('description'),
          is_active: formData.get('is_active') === 'on',
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'Could not save changes.');
        return;
      }
      onSaved();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg" noValidate>
      {error && (
        <p role="alert" className="border border-status-bad/30 bg-status-bad/5 p-2.5 text-xs text-status-bad">
          {error}
        </p>
      )}
      <TextField label="Name" name="name" defaultValue={product.name} required />
      <TextField label="Category" name="category" defaultValue={product.category} />
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Price (KES)" name="price_kes" type="number" defaultValue={product.price_kes} required />
        <TextField label="Stock qty" name="stock_qty" type="number" defaultValue={product.stock_qty} />
      </div>
      <TextField label="Image URL" name="image_url" defaultValue={product.image_url ?? ''} />
      <TextAreaField label="Description" name="description" defaultValue={product.description ?? ''} />
      <label className="flex items-center gap-2 text-sm text-ink-950">
        <input type="checkbox" name="is_active" defaultChecked={product.is_active} className="h-4 w-4" />
        Active (visible on public shop)
      </label>
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center rounded-sm bg-signal-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-signal-600 transition-colors disabled:opacity-60"
        >
          {submitting ? 'Saving…' : 'Save changes'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center justify-center border border-ink-950/15 px-4 py-2.5 text-sm font-medium text-ink-950"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function TextField({ label, name, required, type = 'text', defaultValue, placeholder }: any) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-ink-950">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="mt-1.5 w-full border border-ink-950/15 bg-paper-50 px-3 py-2 text-sm focus:border-signal-500"
      />
    </div>
  );
}

function TextAreaField({ label, name, defaultValue }: any) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-ink-950">
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        rows={3}
        defaultValue={defaultValue}
        className="mt-1.5 w-full border border-ink-950/15 bg-paper-50 px-3 py-2 text-sm focus:border-signal-500"
      />
    </div>
  );
}
