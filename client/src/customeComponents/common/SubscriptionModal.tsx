import { useState } from "react";
import { CheckCircleIcon, XCircleIcon, ClockIcon } from "@heroicons/react/24/solid";
import SubscriptionPlanPreview from "./SubscriptionPlanPreview";
import StripePayment from "@/features/StripePayment";

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

  if (isLoading) {
    return (
      <div className="h-[500px] flex items-center justify-center text-gray-600">
        <ClockIcon className="h-6 w-6 animate-spin text-gray-500" />
        <span className="ml-2">Loading subscription details...</span>
      </div>
    );
  }

  if (subscription?.isSubscribed) {
    return (
      <div className="h-[500px] overflow-y-auto p-6 bg-white shadow-md border border-green-200 rounded-lg space-y-6">
        <div className="flex flex-col justify-center items-center space-y-3 text-green-700">
          <CheckCircleIcon className="h-10 w-10 text-green-500" />
          <p className="text-lg font-semibold">You're subscribed until:</p>
          <span className="font-bold text-xl">
            {new Date(subscription.endDate).toLocaleDateString()}
          </span>
        </div>

        <div className="pt-4">
          <h3 className="text-md font-semibold text-gray-800 mb-2 text-center">
            🎁 Enjoy your Pro benefits:
          </h3>
          <SubscriptionPlanPreview />
        </div>
      </div>
    );
  }

  return (
    <div className="h-[500px] overflow-y-auto p-6 bg-white shadow-md border border-gray-200 rounded-lg space-y-6">
      {step === "plan" && (
        <>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-red-600 font-medium">
              <XCircleIcon className="h-6 w-6" />
              <p> Not Subscribed</p>
            </div>
            <p className="text-gray-700 text-sm">
              Subscribe to access premium features.
            </p>
          </div>

          <SubscriptionPlanPreview />

          <button
            className="w-full py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
            onClick={() => setStep("payment")}
          >
            Continue to Payment
          </button>
        </>
      )}

      {step === "payment" && (
        <>
          <StripePayment
            userId={userId}
            onSuccess={() => setStep("success")}
            refreshSubscription={refreshSubscription}
          />
        </>
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
