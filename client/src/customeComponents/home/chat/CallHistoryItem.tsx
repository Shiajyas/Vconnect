import { motion } from "framer-motion";
import {
  Video,
  Phone,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

type CallType = "video" | "voice" | "text";

interface User {
  id: string;
  name: string;
  avatar?: string;
}

interface CallHistoryItemProps {
  fromUser: User;
  toUser: User;
  currentUserId: string;
  type: CallType;
  startedAt: string;
  endedAt?: string;
  onCall?: (user: User, type: CallType) => void;
}

export const CallHistoryItem: React.FC<CallHistoryItemProps> = ({
  fromUser,
  toUser,
  currentUserId,
  type,
  startedAt,
  endedAt,
  onCall,
}) => {
  const isOutgoing = fromUser.id === currentUserId;
  const targetUser = isOutgoing ? toUser : fromUser;

  const startTime = new Date(startedAt);
  const endTime = endedAt ? new Date(endedAt) : null;
  const duration =
    endTime && startTime
      ? Math.max(0, Math.floor((endTime.getTime() - startTime.getTime()) / 1000))
      : null;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
      className="flex items-center gap-4 p-4 rounded-xl shadow-sm bg-white dark:bg-gray-900 hover:shadow-md transition-all duration-300 cursor-pointer w-full max-w-md mx-auto"
    >
      {/* Avatars */}
      <div className="relative w-14 h-12">
        <img
          src={fromUser.avatar || "/default-avatar.png"}
          alt={fromUser.name}
          className="absolute left-0 top-0 w-8 h-8 rounded-full border-2 border-white dark:border-gray-900 object-cover"
        />
        <img
          src={toUser.avatar || "/default-avatar.png"}
          alt={toUser.name}
          className="absolute left-5 top-2 w-8 h-8 rounded-full border-2 border-white dark:border-gray-900 object-cover"
        />
      </div>

      {/* Call Info */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <p className="font-semibold text-base truncate">{targetUser.name}</p>
          <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
            {format(startTime, "p")}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1 text-sm text-gray-600 dark:text-gray-400 flex-wrap">
          <span className="flex items-center gap-1">
            {isOutgoing ? (
              <>
                <ArrowUpRight className="w-4 h-4 text-blue-400" />
                Outgoing
              </>
            ) : (
              <>
                <ArrowDownLeft className="w-4 h-4 text-green-400" />
                Incoming
              </>
            )}
          </span>
          {duration !== null && (
            <>
              <Clock className="w-4 h-4 text-gray-400" />
              <span>{formatDuration(duration)}</span>
            </>
          )}
          <span className="whitespace-nowrap text-xs">
            • {formatDistanceToNow(startTime)} ago
          </span>
        </div>
      </div>

      {/* Call Button */}
      {(type === "video" || type === "voice") && onCall && (
        <button
          onClick={() => onCall(targetUser, type)}
          className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          title={`Call ${targetUser.name}`}
        >
          {type === "video" ? (
            <Video className="w-5 h-5 text-blue-600" />
          ) : (
            <Phone className="w-5 h-5 text-green-600" />
          )}
        </button>
      )}
    </motion.div>
  );
};
