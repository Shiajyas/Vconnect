import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button"; // ShadCN Button
import { socket } from "../utils/Socket";
import useNotificationStore from "@/store/notificationStore";

interface FollowBtnProps {
  userId: string; // User being followed
  isFollowing: boolean;
  followingId: string; // ID of the user you are following
}

const FollowBtn: React.FC<FollowBtnProps> = ({ followingId, isFollowing, userId }) => {

  const [following, setFollowing] = useState(isFollowing);
  const [loading, setLoading] = useState(false);
  const {incrementUnreadCount} = useNotificationStore()

  useEffect(() => {
    // Listen for follow/unfollow success events
    const handleFollowSuccess = (data: { followingId: string }) => {
      // console.log(data,">>>follow success");
      
      if (data.followingId === followingId) {
        setFollowing(true);
        setLoading(false);
      }
    };

    const handleUnfollowSuccess = (data: { followingId: string }) => {
      console.log(data,">>>unfollow success");
      if (data.followingId === followingId) {
        setFollowing(false);
        setLoading(false);
      }
    };

   
    // const handleNewNotification = (notification: any) => {
    //   console.log("New notification received:", notification);
    //  incrementUnreadCount()
    // };

    socket.on("followSuccess", handleFollowSuccess);
    socket.on("unfollowSuccess", handleUnfollowSuccess);
    // socket.on("newNotification", handleNewNotification);

    return () => {
      socket.off("followSuccess", handleFollowSuccess);
      socket.off("unfollowSuccess", handleUnfollowSuccess);
      // socket.off("newNotification", handleNewNotification);
    };
  }, [followingId,incrementUnreadCount]);

  const handleFollow = () => {
    if (loading || !userId) return;
    setLoading(true);

    socket.emit("follow", { followingId, userId }, (response: any) => {
      if (response?.success) {
        setFollowing(true);
      } else {
        console.error("Follow action failed:", response?.message);
      }
      setLoading(false);
    });
  };

  const handleUnfollow = () => {
    if (loading || !userId) return;
    setLoading(true);

    socket.emit("unfollow", { followingId, userId }, (response: any) => {
      if (response?.success) {
        setFollowing(false);
      } else {
        console.error("Unfollow action failed:", response?.message);
      }
      setLoading(false);
    });
  };

  return (
    <Button
      onClick={following ? handleUnfollow : handleFollow}
      disabled={loading}
      className="px-4 py-2 rounded-md shadow-md transition hover:bg-blue-300"
    >
      {loading ? "Processing..." : following ? "Unfollow" : "Follow"}
    </Button>
  );
};

export default FollowBtn;
