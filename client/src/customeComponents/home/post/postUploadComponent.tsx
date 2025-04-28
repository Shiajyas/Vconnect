import { useState } from "react";
import MediaPreview from "../../media/MediaPreview";
import MediaCapture from "../../media/MediaCapture";
import { socket } from "@/utils/Socket";
import { useUploadPost } from "@/hooks/usePost";
import { useParams } from "react-router-dom";
import { Camera, Upload, Loader2 } from "lucide-react";
import { toast } from "react-toastify";

const PostUpload = () => {
  const [media, setMedia] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");

  const [errors, setErrors] = useState<{ caption?: string; media?: string }>({});

  const { userId } = useParams();
  const { mutate: uploadPost, status } = useUploadPost();

  const handleMediaCaptured = (file: File, previewUrl: string) => {
    setMedia(file);
    setPreview(previewUrl);
    setErrors((prev) => ({ ...prev, media: undefined }));
  };

  const handleRemoveMedia = () => {
    setMedia(null);
    setPreview(null);
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!media) newErrors.media = "Please select or capture a file.";
    if (!caption.trim()) newErrors.caption = "Caption is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpload = () => {
    if (!validateForm()) return;

    const formData = new FormData();
    formData.append("mediaUrls", media!);
    formData.append("title", caption);
    formData.append("description", description);
    formData.append("userId", userId || "");
    formData.append("visibility", visibility);

    uploadPost(formData, {
      onSuccess: (data) => {
        const postId = data.post._id;

        toast.success("Post uploaded successfully!");
        socket.emit("postUploaded", { userId, postId });

        // Reset form
        handleRemoveMedia();
        setCaption("");
        setDescription("");
        setVisibility("public");
        setErrors({});
      },
      onError: () => {
        toast.error("Upload failed!");
      },
    });
  };

  return (
    <div className="max-w-lg mx-auto rounded-xl shadow-lg p-6 flex flex-col space-y-4 h-[calc(100vh-4rem)] md:h-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center space-x-2">
          <Camera className="h-6 w-6 text-purple-500" />
          <span>Create a Post</span>
        </h2>
      </div>

      {/* Media Section */}
      <div className="bg-gray-50 rounded-lg p-4 flex-1 overflow-hidden">
        {!preview ? (
          <MediaCapture onMediaCaptured={handleMediaCaptured} />
        ) : (
          <MediaPreview previewUrl={preview} onRemove={handleRemoveMedia} />
        )}
        {errors.media && <p className="text-red-500 text-sm mt-2">{errors.media}</p>}
      </div>

      {/* Input Fields */}
      <div className="space-y-4">
        <div>
          <input
            type="text"
            placeholder="Add a caption..."
            value={caption}
            onChange={(e) => {
              setCaption(e.target.value);
              if (e.target.value.trim()) setErrors((prev) => ({ ...prev, caption: undefined }));
            }}
            className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
          />
          {errors.caption && <p className="text-red-500 text-sm mt-1">{errors.caption}</p>}
        </div>

        <textarea
          placeholder="What's on your mind?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none transition-all"
        />

        {/* Visibility Selector */}
        <div className="relative">
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as "public" | "private")}
            className="w-full p-3 rounded-lg border border-gray-300 bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={status === "pending"}
        className={`w-full py-3 rounded-lg font-semibold text-white flex items-center justify-center space-x-2 transition-all duration-200
          ${
            status === "pending"
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-purple-600 hover:bg-purple-700 active:bg-purple-800"
          }`}
      >
        {status === "pending" ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Uploading...</span>
          </>
        ) : (
          <>
            <Upload className="h-5 w-5" />
            <span>Share Post</span>
          </>
        )}
      </button>
    </div>
  );
};

export default PostUpload;
