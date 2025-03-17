  import { useParams } from "react-router-dom";
  import { useQuery, useQueryClient } from "@tanstack/react-query";
  import { useEffect } from "react";
  import ProfileHeader from "./ProfileHeader";
  import FollowList from "./FollowList";
  import ProfilePosts from "./ProfilePosts";
  import { userService } from "@/services/userService";
  import { socket } from "@/utils/Socket";
  import { useAuthStore } from "@/context/AuthContext";


  const ProfilePage: React.FC = () => {
    const { userId } = useParams(); // ✅ Get userId from URL
    const {user: parentUser} = useAuthStore()

    const parantUserId = parentUser?._id

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

    useEffect(() => {
      if (!userId) return; // Ensure userId exists

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

    console.log(followers,">>>>>>>>>>>>>>>34")

    return (
      <div className="container mx-auto px-4 py-6">
       <ProfileHeader user={user} userId={userId} parentUserId={parantUserId} refetch={refetch} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <FollowList title="Followers" data={followers} refetch={refetchFollowers} hideUnfollow={true} parentUserId={parantUserId} />
          <FollowList title="Following" data={following} refetch={refetchFollowing} hideUnfollow={false} parentUserId={parantUserId} />
        </div>
        <ProfilePosts userId={userId} />
      </div>
    );
  };

  export default ProfilePage;
