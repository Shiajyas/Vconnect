import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import FollowBtn from "@/customeComponents/FollowBtn";
import { useAuthStore } from "@/context/AuthContext";
import { socket } from "@/utils/Socket";
import { useQueryClient } from "@tanstack/react-query";
interface FollowListProps {
  title: string;
  data?: { 
    _id: string; 
    fullname: string; 
    avatar?: string; 
    isFollowing?: boolean; 
    followers: string[]; 
    following: string[];
  }[];
  refetch: () => void;
  parentUserId: string;
}

const FollowList: React.FC<FollowListProps> = ({ title, data = [], refetch, parentUserId }) => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [followList, setFollowList] = useState(data);
  const queryClient = useQueryClient()

  // Update state when data changes
  useEffect(() => {
    setFollowList(data);
  }, [data]);


  return (
    <Card>
      <CardContent>
        <h3 className="text-lg font-semibold mb-2">
          {title} ({followList.length})
        </h3>
        <ScrollArea className="h-40 overflow-y-auto">
          {followList.length > 0 ? (
            followList.map((person) => {
              const isFollowing = person.followers.includes(parentUserId);

              return (
                <div key={person._id} className="flex items-center justify-between gap-3 py-2">
                  <div
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => navigate(`/home/profile/${person._id}`)}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={person.avatar} alt={person.fullname} />
                      <AvatarFallback>{person.fullname?.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <p className="font-medium">{person.fullname}</p>
                  </div>

                  {user?._id !== person._id && (
                    <FollowBtn followingId={person._id} isFollowing={isFollowing} userId={parentUserId} />
                  )}
                </div>
              );
            })
          ) : (
            <p className="text-gray-500">No {title.toLowerCase()} found</p>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default FollowList;
