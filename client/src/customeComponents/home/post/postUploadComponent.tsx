import { useState } from "react";
import MediaPreview from "../../media/MediaPreview";
import MediaCapture from "../../media/MediaCapture";
import { socket } from "@/utils/Socket";
import { useUploadPost } from "@/hooks/usePost";
import { useParams } from "react-router-dom";

const PostUpload = () => {
  const [media, setMedia] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public"); // Default public

  const { userId } = useParams(); 

  const { mutate: uploadPost, status } = useUploadPost();

  const handleMediaCaptured = (file: File, previewUrl: string) => {
    setMedia(file);
    setPreview(previewUrl);
  };

  const handleRemoveMedia = () => {
    setMedia(null);
    setPreview(null);
  };

  const handleUpload = () => {
    if (!media) {
      alert("Please select or capture a file first!");
      return;
    }

    const formData = new FormData();
    formData.append("mediaUrls", media);
    formData.append("title", caption);
    formData.append("description", description);
    formData.append("userId", userId || ""); 
    formData.append("visibility", visibility); // Adding visibility option

    console.log("🔹 FormData Entries:");
    for (const pair of formData.entries()) {
      console.log(pair[0], pair[1]); // Key: Value
    }

    uploadPost(formData, {
      onSuccess: (data) => {
        console.log(data.post._id, ">>>321");

        let postId = data.post._id;

        alert("Post uploaded successfully!");
        socket.emit("postUploaded", { userId, postId });

        handleRemoveMedia();
        setCaption("");
        setDescription("");
        setVisibility("public"); // Reset to default
      },
      onError: () => {
        alert("Upload failed!");
      },
    });
  };

  return (
    <div className="p-4 bg-white shadow-md rounded-lg flex-grow h-full flex flex-col">
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

      {/* Visibility Selector */}
      <select
        value={visibility}
        onChange={(e) => setVisibility(e.target.value as "public" | "private")}
        className="border rounded p-2 my-2"
      >
        <option value="public">Public</option>
        <option value="private">Private</option>
      </select>

      <button
        onClick={handleUpload}
        disabled={status === "pending"}
        className="bg-purple-500 text-white p-2 rounded"
      >
        {status === "pending" ? "Uploading..." : "Upload"}
      </button>
    </div>
  );
};

export default PostUpload;
