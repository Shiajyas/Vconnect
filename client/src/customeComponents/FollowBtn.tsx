import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button'; // ShadCN Button
import { socket } from '../utils/Socket';
import useNotificationStore from '@/store/notificationStore';
import { useQueryClient } from '@tanstack/react-query';
// import { useAuthStore } from "@/appStore/AuthStore";

interface FollowBtnProps {
  userId: string; // The current logged-in user
  isFollowing: boolean;
  followingId: string; // The user being followed
}

interface FollowUpdateData {
  followingId: string;
  action: 'follow' | 'unfollow';
}

interface SocketResponse {
  success: boolean;
  message?: string;
}

const FollowBtn: React.FC<FollowBtnProps> = ({ followingId, isFollowing, userId }) => {
  const [following, setFollowing] = useState(isFollowing);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { incrementUnreadCount } = useNotificationStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleFollowUpdate = (data: FollowUpdateData) => {
      if (data.followingId === followingId) {
        setFollowing(data.action === 'follow');
        setLoading(false);
        setError(null);

        // Group all invalidations together
        ['suggestions', 'followers', 'following', 'userProfile'].forEach((key) => {
          queryClient.invalidateQueries({ queryKey: [key] });
        });
      }
    };

    const handleFollowSuccess = (data: any) => handleFollowUpdate({ ...data, action: 'follow' });
    const handleUnfollowSuccess = (data: any) =>
      handleFollowUpdate({ ...data, action: 'unfollow' });

    socket.on('followSuccess', handleFollowSuccess);
    socket.on('unfollowSuccess', handleUnfollowSuccess);

    return () => {
      socket.off('followSuccess', handleFollowSuccess);
      socket.off('unfollowSuccess', handleUnfollowSuccess);
    };
  }, [followingId, queryClient, userId, incrementUnreadCount]);

  const handleFollowAction = useCallback(
    (action: 'followUser' | 'unfollowUser') => {
      if (loading || !userId) return;
      setLoading(true);
      setError(null);

      socket.emit(action, { followingId, userId }, (response: SocketResponse) => {
        if (!response?.success) {
          setError(response?.message || 'An error occurred');
          setLoading(false);
        }
      });
    },
    [followingId, userId, loading],
  );

  return (
    <div>
      <Button
        onClick={() => handleFollowAction(following ? 'unfollowUser' : 'followUser')}
        disabled={loading}
        className={`px-4 py-2 rounded-md shadow-md transition ${
          following ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
        }`}
      >
        {loading ? 'Processing...' : following ? 'Unfollow' : 'Follow'}
      </Button>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default FollowBtn;
