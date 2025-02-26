import React, { useRef, useEffect, useCallback } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { postService } from "@/services/postService";
import PostItem from "./PostItem";
import { socket } from "@/utils/Socket";
import { useAuthStore } from "@/context/AuthContext";

// const socket = io(import.meta.env.VITE_SOCKET_URL, { withCredentials: true });

const PostList: React.FC = () => {
  const queryClient = useQueryClient();
  const observerRef = useRef<HTMLDivElement | null>(null);
  const isUser = localStorage.getItem("isUser"); 

  const {user,isUserAuthenticated} = useAuthStore();

  const userId = user?._id.toString();

  console.log("🔹 User ID:", userId);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["posts"],
    queryFn: ({ pageParam = 1 }) => postService.getPosts(pageParam, 10),
    getNextPageParam: (lastPage) => lastPage?.nextPage || undefined,
    initialPageParam: 1,
    enabled: !!isUserAuthenticated,
    refetchInterval: 60000,
  });

  const likeMutation = useMutation({
    mutationFn: async (postId: string) => {
      return postService.likePost(postId); // Ensure you return the promise
    },
    onMutate: async (postId: string) => {
      await queryClient.cancelQueries({ queryKey: ["posts"] });
  
      const previousData = queryClient.getQueryData(["posts"]);
  
      queryClient.setQueryData(["posts"], (oldData: any) => {
        if (!oldData) return oldData;
  
        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            posts: page.posts.map((post) =>
              post._id === postId
                ? { ...post, likes: [...post.likes, userId] } // Add userId to likes array
                : post
            ),
          })),
        };
      });
  
      return { previousData };
    },
    onSuccess: (_data, postId) => {
      socket.emit("like_post", {userId, postId, type : "like"}); // Emit event after success
    },
    onError: (_error, _postId, context: any) => {
      queryClient.setQueryData(["posts"], context.previousData);
    },
  });
  
  
  const unlikeMutation = useMutation({
    mutationFn: async (postId: string) => {
      await postService.unLikePost(postId);
      
    },
    onMutate: async (postId: string) => {
      await queryClient.cancelQueries({ queryKey: ["posts"] });
  
      const previousData = queryClient.getQueryData(["posts"]);
  
      queryClient.setQueryData(["posts"], (oldData: any) => {
        if (!oldData) return oldData;
  
        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            posts: page.posts.map((post) =>
              post._id === postId
                ? { ...post, likes: post.likes.filter((id) => id !== userId) } // Remove userId from likes array
                : post
            ),
          })),
        };
      });
  
      return { previousData };
    },
    onSuccess: (_data, postId) => {
      socket.emit("like_post", {userId, postId, type : "unlike"}); // Emit event after success
    },
    onError: (_error, _postId, context: any) => {
      queryClient.setQueryData(["posts"], context.previousData);
    },
  });

  useEffect(() => {
    console.log("🔌 Checking socket connection:", socket.connected);
  
    socket.on("update_like_count", ({ postId, likes }) => {
      console.log("🔹 Received update_like_count event:", { postId, likes });
      
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    });
  
    return () => {
      console.log("🛑 Removing listener for update_like_count");
      socket.off("update_like_count");
    };
  }, [queryClient]);
  
  
  // Handle Like Click
  const handleLike = (postId: string) => {
    const post = data?.pages
      .flatMap((page) => page.posts)
      .find((post) => post._id === postId);
  
    if (!post) return;
  
    const isLiked = Array.isArray(post.likes) && post.likes.includes(userId);
  
    isLiked ? unlikeMutation.mutate(postId) : likeMutation.mutate(postId);
  };
  
  

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, { threshold: 1.0 });
    if (observerRef.current) observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [handleObserver]);

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      {data?.pages.map((page) =>
        page.posts.map((post) => <PostItem key={post._id} post={post}  onLike={handleLike} />)
      )}

      <div ref={observerRef} className="h-10"></div>
      {isFetchingNextPage && <p className="text-center text-gray-500">Loading more posts...</p>}
    </div>
  );
};

export default PostList;
