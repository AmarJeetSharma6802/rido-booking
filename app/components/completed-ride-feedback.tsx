interface FeedbackRide {
  pickup: string;
  destination: string;
  estimatedFare: number | null;
  estimatedDistanceKm: number | null;
  hasReview?: boolean;
  driver?: {
    id: string;
    driverName: string;
    vehicleName: string;
    numberPlate: string | null;
  };
}

interface ReviewReasonOption {
  value: string;
  label: string;
}

interface CompletedRideFeedbackProps {
  ride: FeedbackRide;
  reviewRating: number;
  reviewReason: string;
  reviewReasonOptions: readonly ReviewReasonOption[];
  reviewSubmitting: boolean;
  complaintSubmitting: boolean;
  complaintMessage: string;
  complaintSent: boolean;
  onReviewRatingChange: (value: number) => void;
  onReviewReasonChange: (value: string) => void;
  onComplaintMessageChange: (value: string) => void;
  onSubmitReview: () => void;
  onSubmitComplaint: () => void;
}

export default function CompletedRideFeedback({
  ride,
  reviewRating,
  reviewReason,
  reviewReasonOptions,
  reviewSubmitting,
  complaintSubmitting,
  complaintMessage,
  complaintSent,
  onReviewRatingChange,
  onReviewReasonChange,
  onComplaintMessageChange,
  onSubmitReview,
  onSubmitComplaint,
}: CompletedRideFeedbackProps) {
  return (
    <section className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
      <div className="rounded-[34px] border border-emerald-100 bg-white p-5 shadow-[0_26px_80px_rgba(16,185,129,0.14)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-500">
              Trip completed
            </p>
            <h3 className="mt-2 text-3xl font-black">How was your ride?</h3>
            <p className="mt-2 text-sm text-slate-600">
              Driver details aur trip summary yahan hai. Quick review se app aur real lagega.
            </p>
          </div>
          <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-black text-emerald-700">
            Rs. {ride.estimatedFare?.toFixed(0) ?? "-"}
          </span>
        </div>

        <div className="mt-5 grid gap-3 rounded-[26px] bg-emerald-50 p-5 text-sm text-slate-700">
          <p><span className="font-black text-slate-950">From:</span> {ride.pickup}</p>
          <p><span className="font-black text-slate-950">To:</span> {ride.destination}</p>
          <p><span className="font-black text-slate-950">Driver:</span> {ride.driver?.driverName ?? "-"}</p>
          <p><span className="font-black text-slate-950">Vehicle:</span> {ride.driver?.vehicleName ?? "-"}</p>
          <p><span className="font-black text-slate-950">Plate:</span> {ride.driver?.numberPlate ?? "-"}</p>
          <p><span className="font-black text-slate-950">Distance:</span> {ride.estimatedDistanceKm?.toFixed(2) ?? "-"} km</p>
        </div>

        {ride.hasReview ? (
          <div className="mt-5 rounded-[24px] border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
            Review already submit ho chuki hai. Aap turant next ride book kar sakte ho.
          </div>
        ) : (
          <>
            <div className="mt-5">
              <p className="text-sm font-black text-slate-900">Driver rating</p>
              <div className="mt-3 flex flex-wrap gap-3">
                {[1, 2, 3, 4, 5].map((ratingValue) => (
                  <button
                    key={ratingValue}
                    type="button"
                    onClick={() => onReviewRatingChange(ratingValue)}
                    className={`rounded-2xl px-4 py-3 text-sm font-black transition ${
                      reviewRating === ratingValue
                        ? "bg-emerald-600 text-white shadow-[0_16px_30px_rgba(5,150,105,0.24)]"
                        : "border border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50"
                    }`}
                  >
                    {ratingValue} / 5
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <label className="text-sm font-black text-slate-900">
                Review reason
              </label>
              <select
                value={reviewReason}
                onChange={(event) => onReviewReasonChange(event.target.value)}
                className="mt-3 w-full rounded-[22px] border border-emerald-200 bg-white px-4 py-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-emerald-500"
              >
                {reviewReasonOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={onSubmitReview}
              disabled={reviewSubmitting}
              className="mt-5 w-full rounded-[22px] bg-emerald-600 px-4 py-4 text-sm font-black text-white shadow-[0_18px_40px_rgba(5,150,105,0.22)] transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
            >
              {reviewSubmitting ? "Submitting review..." : "Submit review"}
            </button>
          </>
        )}
      </div>

      <div className="rounded-[34px] border border-amber-100 bg-white p-5 shadow-[0_26px_80px_rgba(217,119,6,0.12)]">
        <p className="text-xs font-black uppercase tracking-[0.28em] text-amber-500">
          Help and complaint
        </p>
        <h3 className="mt-2 text-3xl font-black">Raise an issue</h3>
        <p className="mt-2 text-sm text-slate-600">
          Agar overcharge, rude behavior, ya pickup-route issue hua ho to yahan likh do.
        </p>

        <div className="mt-5 rounded-[26px] bg-amber-50 p-5 text-sm text-slate-700">
          <p><span className="font-black text-slate-950">Assigned driver:</span> {ride.driver?.driverName ?? "-"}</p>
          <p className="mt-2"><span className="font-black text-slate-950">Vehicle:</span> {ride.driver?.vehicleName ?? "-"}</p>
          <p className="mt-2"><span className="font-black text-slate-950">Number plate:</span> {ride.driver?.numberPlate ?? "-"}</p>
        </div>

        {complaintSent ? (
          <div className="mt-5 rounded-[24px] border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
            Complaint submit ho gayi. Team is ride ko manually review kar sakti hai.
          </div>
        ) : null}

        <textarea
          value={complaintMessage}
          onChange={(event) => onComplaintMessageChange(event.target.value)}
          placeholder="Example: driver ne extra cash demand ki, wrong lane li, ya rude behavior tha..."
          className="mt-5 min-h-40 w-full rounded-[24px] border border-amber-200 bg-white px-4 py-4 text-sm font-medium text-slate-900 outline-none transition focus:border-amber-500"
        />

        <button
          onClick={onSubmitComplaint}
          disabled={complaintSubmitting}
          className="mt-5 w-full rounded-[22px] bg-slate-950 px-4 py-4 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {complaintSubmitting ? "Submitting complaint..." : "Submit complaint"}
        </button>
      </div>
    </section>
  );
}
