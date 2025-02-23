import { useEffect, useState } from "react";
import { FaDownload, FaTrash } from "react-icons/fa";

interface MediaPreviewProps {
  previewUrl: string;
  onRemove: () => void;
}

const MediaPreview = ({ previewUrl, onRemove }: MediaPreviewProps) => {
  const [isVideo, setIsVideo] = useState<boolean | null>(null);

  useEffect(() => {
    const checkMediaType = async () => {
      try {
        const response = await fetch(previewUrl);
        const blob = await response.blob();
        setIsVideo(blob.type.startsWith("video/"));
      } catch (error) {
        console.error("Error checking media type:", error);
      }
    };

    if (previewUrl.startsWith("blob:")) {
      checkMediaType();
    }
  }, [previewUrl]);

  return (
    <div className="p-4 bg-white shadow-md rounded-lg flex-grow h-full flex flex-col items-center">
      {isVideo === null ? (
        <p>Loading preview...</p>
      ) : isVideo ? (
        <video src={previewUrl} controls className="w-full h-60 rounded"></video>
      ) : (
        <img src={previewUrl} alt="Preview" className="w-full h-96 rounded object-cover" />
      )}
      <div className="flex justify-center gap-4 mt-4">
        <a href={previewUrl} download className="bg-blue-500 text-white p-2 rounded flex items-center gap-2">
          <FaDownload /> Download
        </a>
        <button onClick={onRemove} className="bg-red-500 text-white p-2 rounded flex items-center gap-2">
          <FaTrash /> Remove
        </button>
      </div>
    </div>
  );
};

export default MediaPreview;
