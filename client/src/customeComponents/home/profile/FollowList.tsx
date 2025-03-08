import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "@/context/AuthContext";
import { userService } from "@/services/userService";


interface FollowListProps {
  title: string;
  data?: { _id: string; fullname: string; avatar?: string }[];
  refetch: () => void;
  hideUnfollow?: boolean; // New prop to control button visibility
}

const FollowList: React.FC<FollowListProps> = ({ title, data = [], refetch, hideUnfollow = false }) => {
  const { user } = useAuthStore();
  const userId = user?._id;

  const [followList, setFollowList] = useState(data);
  const [loadingId, setLoadingId] = useState<string | null>(null); // Track which user is being unfollowed

  useEffect(() => {
    setFollowList(data);
  }, [data]);

  const unfollowMutation = useMutation({
    mutationFn: async (followingId: string) => {
      setLoadingId(followingId); // Set loading state for specific user
      return userService.unfollowUser(followingId);
    },
    onSuccess: () => {
      refetch();
    },
    onError: () => {
      refetch();
    },
    onSettled: () => {
      setLoadingId(null); // Reset loading state
    },
  });

  return (
    <Card>
      <CardContent>
        <h3 className="text-lg font-semibold mb-2">
          {title} ({followList.length})
        </h3>
        <ScrollArea className="h-40 overflow-y-auto">
          {followList.length > 0 ? (
            followList.map((person) => (
              <div key={person._id} className="flex items-center justify-between gap-3 py-2">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={person.avatar} alt={person.fullname} />
                    <AvatarFallback>{person.fullname?.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <p className="font-medium">{person.fullname}</p>
                </div>
                {!hideUnfollow && userId !== person._id && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => unfollowMutation.mutate(person._id)}
                    disabled={loadingId === person._id} // Only disable the button of the user being unfollowed
                  >
                    {loadingId === person._id ? "Unfollowing..." : "Unfollow"}
                  </Button>
                )}
              </div>
            ))
          ) : (
            <p className="text-gray-500">No {title.toLowerCase()} found</p>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default FollowList;
