import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import MediaPreview from "../../media/MediaPreview";
import MediaCapture from "../../media/MediaCapture";
import { socket } from "@/utils/Socket";
import { useUpdatePost, useGetPostDetails } from "@/hooks/usePost"; // Use update & fetch hooks

const EditPost = () => {
  const { postId } = useParams(); // Get postId from URL params

  const [media, setMedia] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [description, setDescription] = useState("");
  const [existingMedia, setExistingMedia] = useState<string | null>(null); // Store old media
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // ✅ Fetch post details using React Query
  const { data: post, isLoading } = useGetPostDetails(postId);


  // ✅ Use mutation for updating post
  const { mutate: updatePost, status } = useUpdatePost();

  // ✅ Set initial values when post data is fetched
  useEffect(() => {
    if (post) {
      console.log("Fetched Post Data:", post);
      setCaption(post.post.title || ""); 
      setDescription(post.post.description || ""); 
      setExistingMedia(Array.isArray(post.post.mediaUrls) ? post.post.mediaUrls[0] : post.post.mediaUrls || null);
      setIsDataLoaded(true); 
    }
  }, [post]);
  
  const handleMediaCaptured = (file: File, previewUrl: string) => {
    setMedia(file);
    setPreview(previewUrl);
    setExistingMedia(null); // Remove old media
  };

  const handleRemoveMedia = () => {
    setMedia(null);
    setPreview(null);
    setExistingMedia(null);
  };

  const handleUpdate = () => {
    if (!caption || !description) {
      alert("Please fill in all fields!");
      return;
    }

    const formData = new FormData();
    if (media) {
      formData.append("mediaUrls", media); // Upload new media
    } else {
      formData.append("existingMedia", existingMedia || ""); // Keep old media if no new file
    }
    formData.append("title", caption);
    formData.append("description", description);

    console.log("🔹 FormData Entries:");
    for (const pair of formData.entries()) {
      console.log(pair[0], pair[1]);
    }

    updatePost({ postId, formData }, {
      onSuccess: (data) => {
        alert("Post updated successfully!");
        socket.emit("postUpdated", { postId });

        // Reset fields after update
        setMedia(null);
        setPreview(null);
        setCaption("");
        setDescription("");
      },
      onError: () => {
        alert("Update failed!");
      },
    });
  };
  console.log(existingMedia,">>>>>>>>>>")

  if (isLoading || !isDataLoaded) return <p>Loading post...</p>;

  return (
    <div className="p-4 bg-white shadow-md rounded-lg flex-grow h-full flex flex-col">
   {!preview && existingMedia && typeof existingMedia === "string" ? (
  <MediaPreview previewUrl={existingMedia} onRemove={handleRemoveMedia} />
) : (
  <MediaCapture onMediaCaptured={handleMediaCaptured} />
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
        className="bg-blue-500 text-white p-2 rounded"
      >
        {status === "pending" ? "Updating..." : "Update Post"}
      </button>
    </div>
  );
};

export default EditPost;
