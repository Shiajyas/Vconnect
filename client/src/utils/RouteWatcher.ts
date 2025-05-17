import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import useMessageStore from "@/appStore/useMessageStore";

const RouteWatcher = () => {
  const location = useLocation();
  const setCurrentlyOpenChatId = useMessageStore((state) => state.setCurrentlyOpenChatId);

  useEffect(() => {
    if (location.pathname !== "/home/messages") {
      // Automatically clear if not on messages page
      setCurrentlyOpenChatId(null);
    }
  }, [location.pathname, setCurrentlyOpenChatId]);

  return null; 
};

export default RouteWatcher;
