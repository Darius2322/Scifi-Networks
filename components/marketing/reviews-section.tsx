import { ReviewForm } from './review-form';

type Review = { id: string; name: string; rating: number; comment: string; created_at: string };

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5 text-signal-500">
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} width="15" height="15" viewBox="0 0 24 24" fill={n <= rating ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path d="M12 2l2.9 6.6 7.1.7-5.4 4.7 1.6 7-6.2-3.7-6.2 3.7 1.6-7L2 9.3l7.1-.7z" />
        </svg>
      ))}
    </div>
  );
}

export function ReviewsSection({ reviews }: { reviews: Review[] }) {
  return (
    <section className="border-b border-paper-200">
      <div className="container-page section-py">
        <p className="eyebrow">Reviews</p>
        <h2 className="mt-2 font-display text-2xl sm:text-3xl font-bold text-ink-950">What customers say</h2>

        {reviews.length === 0 ? (
          <div className="mt-8 card p-10 text-center">
            <p className="text-ink-700">No reviews published yet — be the first to share your experience.</p>
          </div>
        ) : (
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {reviews.map((r) => (
              <div key={r.id} className="card p-6">
                <Stars rating={r.rating} />
                <p className="mt-4 text-sm text-ink-800 leading-relaxed">{r.comment}</p>
                <p className="mt-4 text-xs font-medium text-ink-700">{r.name}</p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-10 max-w-md">
          <h3 className="font-semibold text-ink-950">Leave a review</h3>
          <div className="mt-4">
            <ReviewForm />
          </div>
        </div>
      </div>
    </section>
  );
}
