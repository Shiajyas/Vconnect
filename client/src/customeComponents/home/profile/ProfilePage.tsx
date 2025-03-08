import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import ProfileHeader from "./ProfileHeader";
import FollowList from "./FollowList";
import ProfilePosts from "./ProfilePosts";
import { userService } from "@/services/userService";
import { socket } from "@/utils/Socket";

interface ProfilePageProps {
  userId: string;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ userId }) => {
  const queryClient = useQueryClient();

  // Fetch user profile
  const { data: user, refetch } = useQuery({
    queryKey: ["userProfile", userId],
    queryFn: () => userService.getUserProfile(userId),
    enabled: !!userId,
  });

  // Fetch followers & following
  const { data: followers, refetch: refetchFollowers } = useQuery({
    queryKey: ["followers", userId],
    queryFn: () => userService.getFollowers(userId),
    enabled: !!userId,
  });

  const { data: following, refetch: refetchFollowing } = useQuery({
    queryKey: ["following", userId],
    queryFn: () => userService.getFollowing(userId),
    enabled: !!userId,
  });

  useEffect(() => {
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

  return (
    <div className="container mx-auto px-4 py-6">
      <ProfileHeader user={user} userId={userId} refetch={refetch} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Pass correct props */}
        <FollowList title="Followers" data={followers} refetch={refetchFollowers} hideUnfollow={true} />
        <FollowList title="Following" data={following} refetch={refetchFollowing} hideUnfollow={false} />
      
      </div>
      <ProfilePosts userId={userId} />
    </div>
  );
};

export default ProfilePage;
