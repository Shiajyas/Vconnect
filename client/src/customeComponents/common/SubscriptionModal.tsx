import { useState } from "react";
import { CheckCircleIcon, XCircleIcon, ClockIcon, ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/solid";
import SubscriptionPlanPreview from "./SubscriptionPlanPreview";
import StripePayment from "@/features/StripePayment";
import { useSubscriptionHistory } from "@/hooks/stripeHooks/useSubscriptionHistory";
import clsx from "clsx";

interface Props {
  subscription: {
    isSubscribed: boolean;
    endDate: string;
  } | undefined;
  isLoading: boolean;
  userId: string;
  refreshSubscription: () => void;
}

const SubscriptionStatus: React.FC<Props> = ({ subscription, isLoading, userId, refreshSubscription }) => {
  const [step, setStep] = useState<"plan" | "payment" | "success">("plan");
  const [showHistory, setShowHistory] = useState(false);

  const {
    data: history,
    isLoading: isHistoryLoading,
    refetch: fetchHistory,
  } = useSubscriptionHistory(userId); // fetch only on toggle

  console.log("subscription", subscription);
  console.log("history", history);

  const now = new Date();
  const isExpired = subscription && new Date(subscription.endDate) < now;

  const handleToggleHistory = () => {
    if (!showHistory) fetchHistory(); // fetch on open only
    setShowHistory((prev) => !prev);
  };

  const renderHistory = () => (
    <div className="transition-all duration-300 ease-in-out">
      <button
        className="flex items-center gap-1 text-sm text-purple-600 hover:underline mt-4"
        onClick={handleToggleHistory}
      >
        {showHistory ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
        {showHistory ? "Hide Subscription History" : "View Subscription History"}
      </button>
  
      {showHistory && (
        <div className="mt-2 border border-gray-200 rounded-md p-2 bg-gray-50 shadow-inner text-sm relative max-h-48 overflow-y-auto scrollbar-hide">
          {isHistoryLoading ? (
            <p className="text-gray-500">Loading history...</p>
          ) : history?.length > 0 ? (
            <ul className="space-y-1">
              {history.map((sub: any, idx: number) => (
                <li
                  key={idx}
                  className="flex justify-between border-b border-dashed border-gray-200 pb-1"
                >
                  <span>
                    {new Date(sub.startDate).toLocaleDateString()} → {new Date(sub.endDate).toLocaleDateString()}
                  </span>
                  <span className={clsx("font-semibold", sub.isSubscribed ? "text-green-500" : "text-red-500")}>
                    {sub.isSubscribed ? "Active" : "Expired"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No subscription history found.</p>
          )}
        </div>
      )}
    </div>
  );
  
  if (isLoading) {
    return (
      <div className="h-[500px] flex items-center justify-center text-gray-600">
        <ClockIcon className="h-6 w-6 animate-spin text-gray-500" />
        <span className="ml-2">Loading subscription details...</span>
      </div>
    );
  }

  if (subscription?.isSubscribed && !isExpired) {
    return (
      <div className="h-[500px] overflow-y-auto p-6 bg-white shadow-md border border-green-200 rounded-lg space-y-6">
        <div className="flex flex-col justify-center items-center space-y-3 text-green-700">
          <CheckCircleIcon className="h-10 w-10 text-green-500" />
          <p className="text-lg font-semibold">You're subscribed until:</p>
          <span className="font-bold text-xl">
            {new Date(subscription.endDate).toLocaleDateString()}
          </span>
        </div>

        <div>
          <h3 className="text-md font-semibold text-gray-800 mb-2 text-center">
            🎁 Enjoy your Pro benefits:
          </h3>
          <SubscriptionPlanPreview />
        </div>

        {renderHistory()}
      </div>
    );
  }

  return (
    <div className="h-[500px] overflow-y-auto p-6 bg-white shadow-md  rounded-lg space-y-6">
      {step === "plan" && (
        <>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-red-600 font-medium">
              <XCircleIcon className="h-6 w-6" />
              <p>{subscription ? "Subscription expired" : "Not Subscribed"}</p>
            </div>
            <p className="text-gray-700 text-sm">
              {subscription
                ? "Renew your subscription to continue enjoying premium features."
                : "Subscribe to access premium features."}
            </p>
          </div>

          <SubscriptionPlanPreview />

          <button
            className="w-full py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
            onClick={() => setStep("payment")}
          >
            {subscription ? "Renew Subscription" : "Subscribe Now"}
          </button>

          {renderHistory()}
        </>
      )}

      {step === "payment" && (
        <StripePayment
          userId={userId}
          onSuccess={() => setStep("success")}
          refreshSubscription={refreshSubscription}
        />
      )}

      {step === "success" && (
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <CheckCircleIcon className="h-10 w-10 text-green-500" />
          <p className="text-xl font-semibold text-green-700">
            🎉 Subscription successful!
          </p>
          <p className="text-gray-600 text-sm">
            Enjoy all the premium features right away.
          </p>
        </div>
      )}
    </div>
  );
};

export default SubscriptionStatus;
