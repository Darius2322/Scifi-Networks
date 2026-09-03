'use client';

import { useState } from 'react';

type Review = { id: string; name: string; rating: number; comment: string; is_published: boolean; created_at: string };

export function ReviewModerationList({ initialReviews }: { initialReviews: Review[] }) {
  const [reviews, setReviews] = useState(initialReviews);

  async function togglePublish(review: Review) {
    await fetch(`/api/admin/reviews/${review.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_published: !review.is_published }),
    });
    setReviews((prev) => prev.map((r) => (r.id === review.id ? { ...r, is_published: !r.is_published } : r)));
  }

  async function remove(id: string) {
    if (!window.confirm('Delete this review?')) return;
    await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' });
    setReviews((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div className="border border-ink-950/10">
      <table className="w-full text-sm">
        <thead className="border-b border-ink-950/10 text-left text-ink-800/60">
          <tr>
            <th className="p-3 font-medium">Review</th>
            <th className="p-3 font-medium">Rating</th>
            <th className="p-3 font-medium">Status</th>
            <th className="p-3 font-medium"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-950/10">
          {reviews.map((r) => (
            <tr key={r.id}>
              <td className="p-3">
                <p className="font-medium text-ink-950">{r.name}</p>
                <p className="text-ink-800/70 max-w-md">{r.comment}</p>
              </td>
              <td className="p-3 text-ink-800/70">{r.rating} / 5</td>
              <td className="p-3">
                <span className={r.is_published ? 'text-status-good' : 'text-ink-800/50'}>
                  {r.is_published ? 'Published' : 'Pending'}
                </span>
              </td>
              <td className="p-3 text-right whitespace-nowrap space-x-3">
                <button onClick={() => togglePublish(r)} className="text-signal-500 hover:text-signal-600">
                  {r.is_published ? 'Unpublish' : 'Publish'}
                </button>
                <button onClick={() => remove(r.id)} className="text-status-bad hover:text-status-bad/80">
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {reviews.length === 0 && (
            <tr>
              <td colSpan={4} className="p-6 text-center text-ink-800/60">
                No reviews yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
