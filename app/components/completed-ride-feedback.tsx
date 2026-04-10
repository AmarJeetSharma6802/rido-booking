"use client";

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
  reviewModalOpen: boolean;
  complaintModalOpen: boolean;
  onReviewRatingChange: (value: number) => void;
  onReviewReasonChange: (value: string) => void;
  onDismissReview: () => void;
  onReviewModalChange: (open: boolean) => void;
  onComplaintMessageChange: (value: string) => void;
  onComplaintModalChange: (open: boolean) => void;
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
  reviewModalOpen,
  complaintModalOpen,
  onReviewRatingChange,
  onReviewReasonChange,
  onDismissReview,
  onReviewModalChange,
  onComplaintMessageChange,
  onComplaintModalChange,
  onSubmitReview,
  onSubmitComplaint,
}: CompletedRideFeedbackProps) {
  const closeReviewWithDefaultRating = () => {
    if (ride.hasReview || reviewSubmitting) {
      onReviewModalChange(false);
      return;
    }

    onReviewModalChange(false);
    onDismissReview();
  };

  return (
    <>
      {reviewModalOpen && !ride.hasReview ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 p-4 sm:items-center">
          <div className="w-full max-w-2xl rounded-[30px] border border-emerald-100 bg-white p-5 shadow-[0_30px_90px_rgba(15,23,42,0.24)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-500">
                  Review ride
                </p>
                <h3 className="mt-2 text-2xl font-black">How was your trip?</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Submit a review, or close this popup to send the default 5-star rating automatically.
                </p>
              </div>
              <button
                type="button"
                onClick={closeReviewWithDefaultRating}
                disabled={reviewSubmitting}
                className="rounded-full border border-slate-200 px-4 py-2 text-xs font-black text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Close
              </button>
            </div>

            <div className="mt-5 rounded-[26px] bg-emerald-50 p-5 text-sm text-slate-700">
              <p><span className="font-black text-slate-950">Driver:</span> {ride.driver?.driverName ?? "-"}</p>
              <p className="mt-2"><span className="font-black text-slate-950">Vehicle:</span> {ride.driver?.vehicleName ?? "-"}</p>
              <p className="mt-2"><span className="font-black text-slate-950">Route:</span> {ride.pickup} to {ride.destination}</p>
            </div>

            <div className="mt-5">
              <p className="text-sm font-black text-slate-900">Rate this ride</p>
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
          </div>
        </div>
      ) : null}

      {complaintModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 p-4 sm:items-center">
          <div className="w-full max-w-2xl rounded-[30px] border border-amber-100 bg-white p-5 shadow-[0_30px_90px_rgba(15,23,42,0.24)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-amber-500">
                  Complaint form
                </p>
                <h3 className="mt-2 text-2xl font-black">Report a trip issue</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Share what went wrong during the trip.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onComplaintModalChange(false)}
                className="rounded-full border border-slate-200 px-4 py-2 text-xs font-black text-slate-600 transition hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <textarea
              value={complaintMessage}
              onChange={(event) => onComplaintMessageChange(event.target.value)}
              placeholder="Example: overcharge, unsafe driving, wrong route, or rude behavior."
              className="mt-5 min-h-40 w-full rounded-[24px] border border-amber-200 bg-white px-4 py-4 text-sm font-medium text-slate-900 outline-none transition focus:border-amber-500"
            />

            {complaintSent ? (
              <div className="mt-4 rounded-[24px] border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
                Complaint submitted successfully.
              </div>
            ) : null}

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => onComplaintModalChange(false)}
                className="rounded-[20px] border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={onSubmitComplaint}
                disabled={complaintSubmitting}
                className="rounded-[20px] bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {complaintSubmitting ? "Submitting..." : "Submit complaint"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
