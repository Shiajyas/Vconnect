import { useEffect } from 'react';
import { chatSocket as socket } from '@/utils/chatSocket';
import useMessageStore from '@/appStore/useMessageStore';

const GlobalSocketListener = () => {
  useEffect(() => {
    const handleMessage = (newMessage: any) => {
      const { currentlyOpenChatId, incrementUnreadCount } = useMessageStore.getState();

      console.log('📩 New message received:', newMessage);

      // Increment unread count for the chat if it's not the currently open chat
      if (newMessage?.chatId !== currentlyOpenChatId) {
        incrementUnreadCount(newMessage?.chatId);
      }
    };

    socket.on("chatUpdated", handleMessage);
    return () => {
      socket.off('chatUpdated', handleMessage);
    };
  }, []);

  return null;
};




export default GlobalSocketListener;
