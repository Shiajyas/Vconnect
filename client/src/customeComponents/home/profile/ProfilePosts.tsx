import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { userService } from "@/services/userService";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

import { Image as ImageIcon, Video as VideoIcon, List as ListIcon } from "lucide-react";
interface ProfilePostsProps {
  userId: string;
}

const ProfilePosts: React.FC<ProfilePostsProps> = ({ userId }) => {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<"all" | "image" | "video">("all");

  // Fetch user's media posts (Only images/videos)
  const { data: mediaPosts, isLoading } = useQuery({
    queryKey: ["userMediaPosts", userId],
    queryFn: () => userService.getUserMediaPosts(userId),
  });

  const isImage = (url: string) => /\.(jpeg|jpg|png|webp)$/i.test(url);
  const isVideo = (url: string) => /\.(mp4|webm|ogg)$/i.test(url);

  const filteredPosts = mediaPosts?.filter((post) => {
    const mediaUrl = Array.isArray(post.mediaUrls) ? post.mediaUrls[0] : post.mediaUrls;
    if (selectedType === "image") return isImage(mediaUrl);
    if (selectedType === "video") return isVideo(mediaUrl);
    return true; // Show all posts by default
  });

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold text-center mb-4">Posts</h3>

      <div className="flex justify-center gap-4 mb-4">
        <Button
          variant={selectedType === "all" ? "default" : "outline"}
          onClick={() => setSelectedType("all")}
        >
          <ListIcon className="w-5 h-5 mr-2" /> All
        </Button>
        <Button
          variant={selectedType === "image" ? "default" : "outline"}
          onClick={() => setSelectedType("image")}
        >
          <ImageIcon className="w-5 h-5 mr-2" /> Images
        </Button>
        <Button
          variant={selectedType === "video" ? "default" : "outline"}
          onClick={() => setSelectedType("video")}
        >
          <VideoIcon className="w-5 h-5 mr-2" /> Videos
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-3 gap-2">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : filteredPosts?.length ? (
        <div className="grid grid-cols-3 gap-2">
          {filteredPosts.map((post) => {
            const mediaUrl = Array.isArray(post.mediaUrls) ? post.mediaUrls[0] : post.mediaUrls;
            return (
              <div
                key={post._id}
                className="relative cursor-pointer border-[0.5px] border-gray-300 rounded-md"
                onClick={() => navigate(`/post/${post._id}`)}
              >
                {isImage(mediaUrl) ? (
                  <img
                    src={mediaUrl}
                    alt="User Media"
                    className="w-full h-24 object-cover rounded-md"
                  />
                ) : (
                  <video
                    className="w-full h-24 object-cover rounded-md"
                    controls
                  >
                    <source src={mediaUrl} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-gray-500 text-center">No {selectedType} posts found</p>
      )}
    </div>
  );
};

export default ProfilePosts;
