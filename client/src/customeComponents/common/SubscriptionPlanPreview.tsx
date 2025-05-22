import { CheckCircleIcon } from '@heroicons/react/24/solid';

const SubscriptionPlanPreview = () => {
  return (
    <div className="border border-purple-200 rounded-xl p-6 bg-purple-50 shadow-sm space-y-4">
      <h4 className="text-lg font-semibold text-purple-700 flex items-center gap-2">
        <CheckCircleIcon className="h-6 w-6 text-purple-500" />
        Premium Plan
      </h4>

      <p className="text-2xl font-bold text-gray-800">$9.99/month</p>

      <ul className="text-sm text-gray-700 space-y-2">
        <li className="flex items-center gap-2">
          <CheckCircleIcon className="h-5 w-5 text-green-500" />
          Unlimited messaging & media uploads
        </li>
        <li className="flex items-center gap-2">
          <CheckCircleIcon className="h-5 w-5 text-green-500" />
          Access to voice & video calls
        </li>
        <li className="flex items-center gap-2">
          <CheckCircleIcon className="h-5 w-5 text-green-500" />
          Priority support & faster load times
        </li>
        <li className="flex items-center gap-2">
          <CheckCircleIcon className="h-5 w-5 text-green-500" />
          Post scheduling & analytics
        </li>
      </ul>
    </div>
  );
};

export default SubscriptionPlanPreview;
