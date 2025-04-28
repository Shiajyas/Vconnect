import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import ProfileHeader from "./ProfileHeader";
import FollowList from "./FollowList";
import ProfilePosts from "./ProfilePosts";
import { userService } from "@/services/userService";
import { socket } from "@/utils/Socket";
import { useAuthStore } from "@/appStore/AuthStore";

const ProfilePage: React.FC = () => {
  const { userId } = useParams(); // ✅ Get userId from URL
  const { user: parentUser } = useAuthStore();
  const parentUserId = parentUser?._id;
  const queryClient = useQueryClient();

  // Fetch user profile
  const { data: user, refetch } = useQuery({
    queryKey: ["userProfile", userId],
    queryFn: () => userService.getUserProfile(userId as string), // Ensure it's a string
    enabled: !!userId,
  });

  // Fetch followers & following
  const { data: followers, refetch: refetchFollowers } = useQuery({
    queryKey: ["followers", userId],
    queryFn: () => userService.getFollowers(userId as string),
    enabled: !!userId,
  });

  const { data: following, refetch: refetchFollowing } = useQuery({
    queryKey: ["following", userId],
    queryFn: () => userService.getFollowing(userId as string),
    enabled: !!userId,
  });

  // Handle socket updates
  useEffect(() => {
    if (!userId) return;

    const handleFollowUpdate = () => {
      refetchFollowers();
      refetchFollowing();
      refetch();
    };

    const handlePostUpload = () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      queryClient.invalidateQueries({ queryKey: ["userPosts", userId] });
    };

    socket.on("followSuccess", handleFollowUpdate);
    socket.on("unfollowSuccess", handleFollowUpdate);
    socket.on("postUpload", handlePostUpload);

    return () => {
      socket.off("followSuccess", handleFollowUpdate);
      socket.off("unfollowSuccess", handleFollowUpdate);
      socket.off("postUpload", handlePostUpload);
    };
  }, [queryClient, refetch, refetchFollowers, refetchFollowing, userId]);

  if (!userId) {
    return <div>User ID not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Profile Header */}
      <ProfileHeader user={user} userId={userId} parentUserId={parentUserId || ""} refetch={refetch} />

      {/* Combined FollowList (Single Div with Swipe for Followers/Following) */}
      <div className="mt-6">
        <FollowList
          followers={followers || []}
          following={following || []}
          parentUserId={parentUserId || ""}
        />
      </div>

      {/* Profile Posts */}
      <ProfilePosts userId={userId} />
    </div>
  );
};

export default ProfilePage;
