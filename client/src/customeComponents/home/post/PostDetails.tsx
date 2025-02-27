import { useQuery } from "@tanstack/react-query";
import { postService } from "@/services/postService";
import CommentSection from "../comments/CommentSection"; // Create this component
import PostItem from "./PostItem";

const PostDetails: React.FC<{ postId: string }> = ({ postId }) => {
  const { data: post, isLoading } = useQuery({
    queryKey: ["post", postId],
    queryFn: () => postService.getPost(postId),
  });

  if (isLoading) return <p>Loading post...</p>;
  if (!post) return <p>Post not found.</p>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <PostItem post={post.post} onLike={() => {}} onSelect={() => {}} /> 
    </div>
  );    
};

export default PostDetails;
