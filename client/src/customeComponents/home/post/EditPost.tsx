import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom"; // Import navigate
import MediaPreview from "../../media/MediaPreview";
import MediaCapture from "../../media/MediaCapture";
import { socket } from "@/utils/Socket";
import { useUpdatePost, useGetPostDetails } from "@/hooks/usePost"; // Fetch post
import { useQueryClient } from "@tanstack/react-query";

const EditPost = () => {
  const { postId } = useParams();
  const navigate = useNavigate(); // Initialize navigate
  const queryClient = useQueryClient();

  // Fetch post data
  const { data: post, isLoading, error } = useGetPostDetails(postId!);
  
  const [media, setMedia] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [description, setDescription] = useState("");

  const { mutate: updatePost, status } = useUpdatePost();

  useEffect(() => {
    if (post) {
      setCaption(post.post.title || "");
      setDescription(post.post.description || "");
      setPreview(post.post.mediaUrls?.[0] || null); // Show existing media preview
    }
  }, [post]);

  const handleMediaCaptured = (file: File, previewUrl: string) => {
    setMedia(file);
    setPreview(previewUrl);
  };

  const handleRemoveMedia = () => {
    setMedia(null);
    setPreview(null);
  };

  const handleUpdate = () => {
    if (!caption.trim()) {
      alert("Caption is required!");
      return;
    }

    const formData = new FormData();
    if (media) formData.append("mediaUrls", media); // Only append if new media exists
    formData.append("title", caption);
    formData.append("description", description);

    updatePost(
      { postId, formData },
      {
        onSuccess: () => {
          alert("Post updated successfully!");
          queryClient.invalidateQueries({ queryKey: ["post", postId] }); 
          socket.emit("postUpdated", { postId });
          navigate(-1); // Navigate back after updating
        },
        onError: (e) => {
          console.log(e, ">>>>>>");
          alert("Failed to update post!");
        },
      }
    );
  };

  if (isLoading) return <p>Loading post...</p>;
  if (error) return <p>Error loading post.</p>;

  return (
    <div className="p-4 bg-white shadow-md rounded-lg flex-grow h-full flex flex-col">
           <button
        onClick={() => navigate(-1)}
        className="mb-4 px-4 py-2 text-sm font-semibold text-white bg-gray-700 rounded-md hover:bg-gray-900 transition"
      >
        ← Back
      </button>

      {!preview ? (
        <MediaCapture onMediaCaptured={handleMediaCaptured} />
      ) : (
        <MediaPreview previewUrl={preview} onRemove={handleRemoveMedia} />
      )}

      <input
        type="text"
        placeholder="Caption"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        className="border rounded p-2 my-2"
      />
      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="border rounded p-2 my-2"
      />

      <button
        onClick={handleUpdate}
        disabled={status === "pending"}
        className="bg-purple-500 text-white p-2 rounded"
      >
        {status === "pending" ? "Updating..." : "Update"}
      </button>
    </div>
  );
};

export default EditPost;
