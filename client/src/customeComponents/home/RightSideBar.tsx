import React, { useEffect } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useInView } from "react-intersection-observer";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { LoaderIcon } from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";
import { userService } from "@/services/userService";
import FollowBtn from "../FollowBtn";
import { IUser } from "@/types/userTypes";
import { motion } from "framer-motion";


const RightSideBar = () => {
  const { user, token } = useAuthContext();
  // console.log(user,"3214");
  
  const navigate = useNavigate();
  const { ref, inView } = useInView();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["suggestions", token],
    queryFn: async ({ pageParam = 1 }) => {
      if (!token) throw new Error("Token is null");
      return userService.getSuggestions(token, pageParam);
    },
    getNextPageParam: (lastPage: IUser[], allPages) => 
      lastPage.length > 0 ? allPages.length + 1 : undefined,
    initialPageParam: 1,
    enabled: !!token,
  });

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  const handleNavigate = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  return (
    <div className="my-4">
      <div className="inner-shadow rounded-lg">
        {user && (
          <Card className="w-full p-4">
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.5 }}
              className="flex items-center justify-between"
            >
              <div className="flex items-center space-x-4 cursor-pointer" onClick={() => handleNavigate(user._id)}>
                <Avatar className="h-12 w-12">
                  <AvatarImage src={user.avatar} alt={user.username} />
                  <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-medium">{user.username}</span>
                  <span className="text-sm text-muted-foreground">{user.fullname}</span>
                </div>
              </div>
            </motion.div>
          </Card>
        )}
      </div>

      {/* Sticky Suggestions Header */}
      <div className="sticky top-0 bg-white z-10 flex justify-center py-2 border-b shadow-sm">
        <h5 className="text-lg font-semibold text-center">Suggestions</h5>
      </div>

      {/* Suggestions List */}
      <div className="suggestions flex-1 overflow-y-auto scrollbar-hide px-2">
        {data?.pages.map((page, pageIndex) =>
          page.map((suggestedUser: IUser, index) => {
            const isFollowing = suggestedUser.followers?.includes(suggestedUser?._id || "");

            return (
              <motion.div 
                key={suggestedUser.id} 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.3, delay: (pageIndex * 5 + index) * 0.05 }}
              >
                <Card className="mb-3 inner-shadow rounded-lg p-4 transition-all hover:scale-105 hover:shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 cursor-pointer" onClick={() => handleNavigate(suggestedUser.id)}>
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={suggestedUser.avatar} alt={suggestedUser.username} />
                        <AvatarFallback>{suggestedUser.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium">{suggestedUser.username}</span>
                        <span className="text-sm text-muted-foreground">{suggestedUser.fullname}</span>
                      </div>
                    </div>
                    <FollowBtn 
                      followingId ={suggestedUser._id || ""} 
                      isFollowing={isFollowing} 
                      userId={user?._id || ""} 
                    />
                  </div>
                </Card>
              </motion.div>
            );
          })
        )}

        {/* Infinite Scroll Loader */}
        {isFetchingNextPage && (
          <div className="flex justify-center my-4">
            <LoaderIcon className="w-8 h-8 animate-spin" />
          </div>
        )}

        {/* Trigger point for infinite scrolling */}
        <div ref={ref} className="h-10" />
      </div>
    </div>
  );
};

export default RightSideBar;
