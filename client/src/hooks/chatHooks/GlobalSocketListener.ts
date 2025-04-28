import { useEffect } from "react";
import { socket } from "@/utils/Socket";
import useMessageStore from "@/appStore/useMessageStore";

const GlobalSocketListener = () => {
  useEffect(() => {
    const handleMessage = (newMessage: any) => {
      const { currentlyOpenChatId, incrementUnreadCount } = useMessageStore.getState();

      console.log("📩 New message received:", newMessage);
      
      // Increment unread count for the chat if it's not the currently open chat
      if (newMessage.chatId !== currentlyOpenChatId) {
        incrementUnreadCount(newMessage.chatId);
      }
    };

    socket.on("messageReceived", handleMessage);
    return () => {
      socket.off("messageReceived"   , handleMessage);
    };
  }, []);

  return null;
};

export default GlobalSocketListener;
