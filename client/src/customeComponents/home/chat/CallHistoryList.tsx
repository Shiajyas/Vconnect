import { CallHistoryItem } from './CallHistoryItem';
import { useCallHistory } from '@/hooks/callHooks/useCallHistory';
import { useAuthStore } from '@/appStore/AuthStore';

interface CallHistoryListProps {
  onClose: () => void;
}

export const CallHistoryList = ({ onClose }: CallHistoryListProps) => {
  const { user } = useAuthStore();
  const userId = user?._id || '';
  const { data: history, isLoading } = useCallHistory(userId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] relative flex flex-col">
        {/* Header with fixed close and title */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 p-4 border-b border-gray-300 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-center w-full">Call History</h2>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-red-500 text-xl"
          >
            &times;
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto px-4 py-4 flex-1">
          {isLoading ? (
            <p className="text-center p-4">Loading call history...</p>
          ) : !history?.length ? (
            <p className="text-center p-4 text-gray-500">No calls found.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {history.map((call: any, index: number) => (
                <CallHistoryItem
                  key={index}
                  fromUser={{
                    id: call?.callerId?._id,
                    name: call?.callerId?.username,
                    avatar: call?.callerId?.avatar,
                  }}
                  toUser={{
                    id: call?.receiverId?._id,
                    name: call?.receiverId?.username,
                    avatar: call?.receiverId?.avatar,
                  }}
                  currentUserId={userId}
                  type={call.type}
                  startedAt={call.startedAt}
                  endedAt={call.endedAt}
                  onCall={(user, type) => {
                    console.log('Calling', user.name, 'with', type, 'call');
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
