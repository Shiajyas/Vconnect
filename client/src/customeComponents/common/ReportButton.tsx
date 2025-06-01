import { useState } from "react";
import { Flag } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { socket } from "@/utils/Socket";
const REPORT_REASONS = [
  "Spam",
  "Harassment",
  "Hate Speech",
  "Inappropriate Content",
  "Misinformation",
  "Nudity or Sexual Content",
  "Violence",
  "Other",
];

interface ReportButtonProps {
  postId: string;
  userId: string;
}

export default function ReportButton({ postId, userId }: ReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error("Please select a reason.");
      return;
    }

    setLoading(true);
  socket.emit(
  "report:post",
  { postId, userId, reason },
  (response: { success: boolean; message?: string }) => {
    setLoading(false);

    if (response.success) {
      toast.success("Report submitted.");
      setIsOpen(false);
      setReason("");
    } else {
      toast.error(response.message || "Failed to submit report.");
    }
  }
);

  };

  return (
    <>
      <Button
        variant="ghost"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
      >
        <Flag className="w-5 h-5 mt-1 text-gray-500" />
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-[22rem] max-w-full">
            <h2 className="text-lg font-semibold mb-4">Report Post</h2>

            <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
              {REPORT_REASONS.map((item) => (
                <button
                  key={item}
                  className={`w-full text-left px-4 py-2 rounded-md border ${
                    reason === item
                      ? "bg-yellow-500 text-white border-yellow-600"
                      : "bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-800"
                  }`}
                  onClick={() => setReason(item)}
                  disabled={loading}
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
