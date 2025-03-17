import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button"; // ShadCN Button
import { socket } from "../utils/Socket";
import useNotificationStore from "@/store/notificationStore";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/context/AuthContext";

interface FollowBtnProps {
  userId: string; // The current logged-in user
  isFollowing: boolean;
  followingId: string; // The user being followed
}

const FollowBtn: React.FC<FollowBtnProps> = ({ followingId, isFollowing, userId }) => {
  const [following, setFollowing] = useState(isFollowing);
  const [loading, setLoading] = useState(false);
  const { incrementUnreadCount } = useNotificationStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleFollowUpdate = (data: { followingId: string; action: "follow" | "unfollow" ;}) => {
      if (data.followingId === followingId) {
        setFollowing(data.action === "follow");
        setLoading(false);
        queryClient.invalidateQueries({ queryKey: ["suggestions"] })

      queryClient.invalidateQueries({ queryKey: ["followers" ]});
      queryClient.invalidateQueries({ queryKey: ["following" ]});
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      }
    };

    

    socket.on("followSuccess", (data) => handleFollowUpdate({ ...data, action: "follow" }));
    socket.on("unfollowSuccess", (data) => handleFollowUpdate({ ...data, action: "unfollow" }));

    return () => {
      socket.off("followSuccess", handleFollowUpdate);
      socket.off("unfollowSuccess", handleFollowUpdate);
    };
  }, [followingId, queryClient, userId]);

  useEffect(() => {
    setFollowing(isFollowing);
  }, [isFollowing]);
  

  const handleFollowAction = useCallback(
    (action: "followUser" | "unfollowUser") => {
      if (loading || !userId) return;
      setLoading(true);

      socket.emit(action, { followingId, userId }, (response: any) => {
        if (!response?.success) {
          console.error(`${action} action failed:`, response?.message);
          setLoading(false);
        }
      });
    },
    [followingId, userId, loading]
  );

  return (
    <Button
      onClick={() => handleFollowAction(following ? "unfollowUser" : "followUser")}
      disabled={loading}
      className={`px-4 py-2 rounded-md shadow-md transition ${
        following ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"
      }`}
    >
      {loading ? "Processing..." : following ? "Unfollow" : "Follow"}
    </Button>
  );
};

export default FollowBtn;
