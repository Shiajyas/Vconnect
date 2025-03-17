import React, { useRef, useEffect, useState, useCallback } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { postService } from "@/services/postService";
import PostCard from "./PostItem";
import { socket } from "@/utils/Socket";
import { useAuthStore } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

const PostList: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const observerRef = useRef<HTMLDivElement | null>(null);
  const { user, isUserAuthenticated } = useAuthStore();
  const userId = user?._id?.toString() || "";

  const [openPostId, setOpenPostId] = useState<string | null>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["posts"],
    queryFn: ({ pageParam = 1 }) => postService.getPosts(pageParam, 10),
    getNextPageParam: (lastPage) => lastPage?.nextPage || undefined,
    initialPageParam: 1,
    enabled: isUserAuthenticated, // No need for `!!` since it's already a boolean
    refetchInterval: 60000, // Auto-refetch every 60 sec
  });

  const handlePostClick = (postId: string) => {
    navigate(`/home/post/${postId}`);
  };

  const updateLikeCache = async (postId: string, liked: boolean) => {
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
              ? {
                  ...post,
                  likes: liked
                    ? [...post.likes, userId]
                    : post.likes.filter((id) => id !== userId),
                }
              : post
          ),
        })),
      };
    });

    return { previousData };
  };

  useEffect(() => {
    const handleNewComment = (data: { postId: string }) => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["comments", data.postId] });
    };

    socket.on("newComment", handleNewComment);
    socket.on("delete_comment", handleNewComment);

    return () => {
      socket.off("newComment", handleNewComment);
      socket.off("delete_comment", handleNewComment);
    };
  }, [queryClient]);

  const likeMutation = useMutation({
    mutationFn: (postId: string) => postService.likePost(postId),
    onMutate: async (postId) => updateLikeCache(postId, true),
    onSuccess: (_, postId) => socket.emit("like_post", { userId, postId, type: "like" }),
    onError: (_error, _postId, context: any) =>
      queryClient.setQueryData(["posts"], context.previousData),
  });

  const unlikeMutation = useMutation({
    mutationFn: (postId: string) => postService.unLikePost(postId),
    onMutate: async (postId) => updateLikeCache(postId, false),
    onSuccess: (_, postId) => socket.emit("like_post", { userId, postId, type: "unlike" }),
    onError: (_error, _postId, context: any) =>
      queryClient.setQueryData(["posts"], context.previousData),
  });

  const handleLike = (postId: string, isLiked: boolean) => {
    isLiked ? unlikeMutation.mutate(postId) : likeMutation.mutate(postId);
  };

  const handleToggleComments = (postId: string) => {
    setOpenPostId((prev) => (prev === postId ? null : postId));
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
    if (!observerRef.current) return;

    const observer = new IntersectionObserver(handleObserver, { threshold: 1.0 });
    observer.observe(observerRef.current);

    return () => observer.disconnect();
  }, [handleObserver]);

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      {data?.pages.map((page) =>
        page.posts.map((post) => (
          <PostCard
            key={post._id}
            post={post}
            isLiked={post.likes.includes(userId)}
            onLike={() => handleLike(post._id, post.likes.includes(userId))}
            onToggleComments={() => handleToggleComments(post._id)}
            isCommentsOpen={openPostId === post._id}
            onClick={() => handlePostClick(post._id)}
          />
        ))
      )}

      <div ref={observerRef} className="h-10"></div>
      {isFetchingNextPage && <p className="text-center text-gray-500">Loading more posts...</p>}
    </div>
  );
};

export default PostList;
