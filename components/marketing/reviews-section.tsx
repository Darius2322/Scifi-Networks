import { ReviewForm } from './review-form';

type Review = { id: string; name: string; rating: number; comment: string; created_at: string };

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5 text-signal-500">
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} width="14" height="14" viewBox="0 0 24 24" fill={n <= rating ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path d="M12 2l2.9 6.6 7.1.7-5.4 4.7 1.6 7-6.2-3.7-6.2 3.7 1.6-7L2 9.3l7.1-.7z" />
        </svg>
      ))}
    </div>
  );
}

export function ReviewsSection({ reviews }: { reviews: Review[] }) {
  return (
    <section className="border-b border-ink-950/10">
      <div className="container-page py-14">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-2xl font-semibold text-ink-950">What customers say</h2>
        </div>

        {reviews.length === 0 ? (
          <p className="mt-6 text-sm text-ink-800/60">No reviews published yet — be the first to leave one.</p>
        ) : (
          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {reviews.map((r) => (
              <div key={r.id} className="border border-ink-950/10 p-5">
                <Stars rating={r.rating} />
                <p className="mt-3 text-sm text-ink-800/90">"{r.comment}"</p>
                <p className="mt-3 text-xs text-ink-800/50">— {r.name}</p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-10 max-w-md">
          <h3 className="font-medium text-ink-950">Leave a review</h3>
          <div className="mt-4">
            <ReviewForm />
          </div>
        </div>
      </div>
    </section>
  );
}
