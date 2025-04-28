import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/appStore/AuthStore";
import { socket } from "@/utils/Socket";
import { NormalizedChat } from "@/utils/normalizeChat";
import { normalizeChat } from "@/utils/normalizeChat";


export const useFetchChats = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const userId = user?._id || null;

  const fetchChatsViaSocket = (userId: string): Promise<NormalizedChat[]> => {
    return new Promise((resolve, reject) => {
      if (!socket || !userId) return reject("❌ Socket not initialized or userId missing");

      // console.log("📤 Requesting chats via socket for user:", userId);
      socket.emit("getChats", { userId });

      socket.once("chatsList", ({ chats }: { chats: any[] }) => {
        // console.log("📥 Received chats list:", chats);
        resolve(chats.map(normalizeChat));
      });

      setTimeout(() => reject("⏳ Chat fetch timeout"), 5000);
    });
  };

  // React Query to fetch chats
  const { data: chats = [], refetch } = useQuery({
    queryKey: ["chats", userId],
    queryFn: () => fetchChatsViaSocket(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  useEffect(() => {
    if (!socket || !userId) return;

    const handleNewChat = (newChat: any) => {
      console.log("📥 Received new chat:", newChat);

      let actualChat = newChat.chat || newChat;

      const normalizedChat = normalizeChat(actualChat);
      queryClient.setQueryData(["chats", userId], (prevChats: NormalizedChat[] = []) => [
        normalizedChat,
        ...prevChats.filter((chat) => chat._id !== normalizedChat._id),
      ]);
    };

    socket.on("chatCreated", handleNewChat);
    return () => {
      socket.off("chatCreated", handleNewChat);
    };
  }, [userId, queryClient]);

  return { chats, refetch };
};
