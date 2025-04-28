import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import FollowBtn from "@/customeComponents/FollowBtn";
import { useAuthStore } from "@/appStore/AuthStore";

interface FollowListProps {
  followers: {
    _id: string;
    fullname: string;
    avatar?: string;
    followers: string[];
    following: string[];
  }[];
  following: {
    _id: string;
    fullname: string;
    avatar?: string;
    followers: string[];
    following: string[];
  }[];
  parentUserId: string;
}

const FollowList: React.FC<FollowListProps> = ({ followers = [], following = [],  parentUserId }) => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"followers" | "following">("following");
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredList, setFilteredList] = useState(followers);

  // Update filtered list based on active tab and search query
  useEffect(() => {
    const list = activeTab === "followers" ? followers : following;
    setFilteredList(list.filter((person) => person.fullname.toLowerCase().includes(searchQuery.toLowerCase())));
  }, [searchQuery, activeTab, followers, following]);

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        {/* Toggle Followers & Following */}
        <div className="flex justify-between mb-3">
        <button
            className={`w-1/2 py-2 text-center ${activeTab === "following" ? "font-bold border-b-2 border-blue-500" : "text-gray-500"}`}
            onClick={() => setActiveTab("following")}
          >
            Following ({following.length})
          </button>
          <button
            className={`w-1/2 py-2 text-center ${activeTab === "followers" ? "font-bold border-b-2 border-blue-500" : "text-gray-500"}`}
            onClick={() => setActiveTab("followers")}
          >
            Followers ({followers.length})
          </button>
       
        </div>

        {/* Search Input */}
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-2 mb-3 border rounded-md"
        />

        {/* Scrollable List */}
        <ScrollArea className="h-64 overflow-y-auto">
          {filteredList.length > 0 ? (
            filteredList.map((person) => {
              const isFollowing = person.followers.includes(parentUserId);

              return (
                <div key={person._id} className="flex items-center justify-between gap-3 py-2">
                  <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/home/profile/${person._id}`)}>
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
            <p className="text-gray-500 text-center">No {activeTab} found</p>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default FollowList;
