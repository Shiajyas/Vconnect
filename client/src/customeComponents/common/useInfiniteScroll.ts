
import { useEffect, useRef, useCallback } from "react";

export const useInfiniteScroll = (
  ref: React.RefObject<HTMLDivElement>,
  fetchMessages: () => void,
  hasMore: boolean,
  loading: boolean
) => {
  const isFetchingRef = useRef(false); // Prevent duplicate API calls
  const prevScrollHeightRef = useRef(0); // Store previous scroll height

  const handleScroll = useCallback(() => {
    if (!ref.current || !hasMore || loading || isFetchingRef.current) return;

    const chatContainer = ref.current;

    if (chatContainer.scrollTop <= 10) {  // When scrolled to the top, load older messages
      isFetchingRef.current = true;
      prevScrollHeightRef.current = chatContainer.scrollHeight; // Store current height

      fetchMessages(); // Fetch older messages
    }
  }, [ref, hasMore, loading, fetchMessages]);

  useEffect(() => {
    const chatContainer = ref.current;
    if (!chatContainer) return;

    chatContainer.addEventListener("scroll", handleScroll);
    return () => chatContainer.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Restore scroll position after new messages are added
  useEffect(() => {
    if (!loading && ref.current) {
      const chatContainer = ref.current;
      chatContainer.scrollTop = chatContainer.scrollHeight - prevScrollHeightRef.current;
      isFetchingRef.current = false;
    }
  }, [loading]);
};

// export const useInfiniteScroll = (
//   ref: React.RefObject<HTMLDivElement>,
//   fetchMessages: () => void,
//   hasMore: boolean,
//   loading: boolean
// ) => {
//   const isFetchingRef = useRef(false); // Prevent duplicate API calls
//   const prevScrollHeightRef = useRef(0); // Store previous scroll height

//   const handleScroll = useCallback(() => {
//     if (!ref.current || !hasMore || loading || isFetchingRef.current) return;

//     const chatContainer = ref.current;

//     if (chatContainer.scrollTop <= 10) {
//       isFetchingRef.current = true;
//       prevScrollHeightRef.current = chatContainer.scrollHeight; // Store current scroll height

//       fetchMessages(); // Fetch older messages
//     }
//   }, [ref, hasMore, loading, fetchMessages]);

//   useEffect(() => {
//     const chatContainer = ref.current;
//     if (!chatContainer) return;

//     chatContainer.addEventListener("scroll", handleScroll);
//     return () => chatContainer.removeEventListener("scroll", handleScroll);
//   }, [handleScroll]);

//   // Restore scroll position after new messages are added
//   useEffect(() => {
//     if (!loading && ref.current) {
//       const chatContainer = ref.current;
//       chatContainer.scrollTop = chatContainer.scrollHeight - prevScrollHeightRef.current;
//       isFetchingRef.current = false;
//     }
//   }, [loading]);
// };
