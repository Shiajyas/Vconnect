import { useEffect } from "react";

export const useInfiniteScroll = (ref: React.RefObject<HTMLDivElement>, fetchNextPage: () => void, hasNextPage: boolean, isFetchingNextPage: boolean) => {
  useEffect(() => {
    if (!ref.current || !hasNextPage || isFetchingNextPage) return;

    const chatContainer = ref.current;

    const handleScroll = () => {
      if (chatContainer.scrollTop === 0) {
        fetchNextPage();
      }
    };

    chatContainer.addEventListener("scroll", handleScroll);

    return () => chatContainer.removeEventListener("scroll", handleScroll);
  }, [ref, fetchNextPage, hasNextPage, isFetchingNextPage]);
};
