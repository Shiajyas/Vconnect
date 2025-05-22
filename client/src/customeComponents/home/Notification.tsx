import React, { useRef, useEffect, useCallback } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/userService';
import { Loader2, Trash2, Bell } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import useNotificationStore from '@/store/notificationStore';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuthStore } from '@/appStore/AuthStore';
import { useNavigate } from 'react-router-dom';

interface Notification {
  _id: string;
  message: string;
  read: boolean;
  type: string;
  senderId: string;
  postId?: string;
  createdAt: string;
  senderName: string;
}

const Notification: React.FC = () => {
  const queryClient = useQueryClient();
  const { unreadCount, setUnreadCount, resetUnreadCount } = useNotificationStore();
  const { user } = useAuthStore();
  const userId = user?._id || null;
  const navigate = useNavigate();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, refetch, isLoading } =
    useInfiniteQuery({
      queryKey: ['notifications', userId],
      queryFn: async ({ pageParam = 1 }) => {
        if (!userId) throw new Error('User ID is null');
        return await userService.getNotifications({ pageParam, userId });
      },
      getNextPageParam: (lastPage) => lastPage?.nextPage ?? undefined,
      initialPageParam: 1,
      enabled: !!userId,
    });

  // ✅ Reset unread count once when component mounts
  useEffect(() => {
    if (unreadCount > 0) {
      resetUnreadCount();
    }
  }, []);

  // ✅ Optionally refetch when there were unread notifications
  useEffect(() => {
    if (unreadCount > 0) {
      refetch();
    }
  }, [unreadCount, refetch]);

  /** Handles notification click */
  const handleNotificationClick = (notification: Notification) => {
    console.log('Notification clicked:', notification);

    // Redirect based on notification type
    if (notification.senderId) {
      navigate(`/home/profile/${notification.senderId}`);
    }
    if (notification.postId) {
      navigate(`/home/post/${notification.postId}`);
    }
  };

  /** Delete a notification */
  const deleteMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return await userService.deleteNotification(notificationId);
    },
    onSuccess: (_, notificationId) => {
      queryClient.setQueryData(['notifications', userId], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            notifications: page.notifications.filter((n: any) => n._id !== notificationId),
          })),
        };
      });
      refetch();
      toast.success('Successfully deleted notification');
    },
    onError: (error) => {
      console.error('Error deleting notification:', error);
    },
  });

  /** Infinite scrolling trigger */
  const observer = useRef<IntersectionObserver | null>(null);
  const lastNotificationRef = useCallback(
    (node: HTMLLIElement | null) => {
      if (isFetchingNextPage) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      });
      if (node) observer.current.observe(node);
    },
    [isFetchingNextPage, fetchNextPage, hasNextPage],
  );

  return (
    <div className="p-4 bg-white shadow-md rounded-lg flex-grow h-full flex flex-col">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-white shadow-md p-3 z-10 border-b">
        <h2 className="text-lg font-semibold text-center">Notifications</h2>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 p-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : data?.pages?.flatMap((page) => page.notifications).length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Bell className="h-12 w-12 mx-auto text-gray-400 mb-2" />
            <p>No notifications yet</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {data?.pages
              ?.flatMap((page) => page.notifications)
              .map((notification, index, arr) => (
                <li
                  key={notification._id}
                  ref={index === arr.length - 1 ? lastNotificationRef : null}
                  onClick={() => handleNotificationClick(notification)}
                  className={`relative flex items-start p-4 rounded-lg shadow-sm transition-all duration-200 cursor-pointer
                  ${notification.read ? 'bg-gray-200' : 'bg-gray-50 border-l-4 border-gray-300'}
                  hover:bg-gray-100 hover:shadow-md`}
                >
                  <div className="flex-1">
                    <p className="text-sm">
                      <span
                        className="font-semibold text-blue-600 hover:underline"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/home/profile/${notification.senderId}`);
                        }}
                      >
                        {notification.senderName}
                      </span>{' '}
                      {notification.message.replace(notification.senderName, '')}{' '}
                      {notification.postId && (
                        <span
                          className="font-semibold text-blue-600 hover:underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/home/post/${notification.postId}`);
                          }}
                        >
                          Post
                        </span>
                      )}
                    </p>
                    <span className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteMutation.mutate(notification._id);
                    }}
                    className="ml-3 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </li>
              ))}
          </ul>
        )}
        {isFetchingNextPage && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        )}
      </div>
    </div>
  );
};

export default Notification;
