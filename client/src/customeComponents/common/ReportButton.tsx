import { useState } from "react";
import { Flag } from "lucide-react";
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"; // or wherever your Button is

interface ReportButtonProps {
  postId: string;
  userId: string;
  onReport: (postId: string, userId: string, reason: string) => Promise<void>;
}

export default function ReportButton({ postId, userId, onReport }: ReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error("Please select a reason.");
      return;
    }
    setLoading(true);
    try {
      await onReport(postId, userId, reason);
      toast.success("Report submitted.");
      setIsOpen(false);
      setReason("");
    } catch {
      toast.error("Failed to submit report.");
    } finally {
      setLoading(false);
    }
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
        <Flag    className="w-5 mt-1 h-5 text-gray-500"  />
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-80">
            <h2 className="text-lg font-semibold mb-4">Report Post</h2>
            <select
              className="w-full border border-gray-300 rounded-md p-2 mb-4"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={loading}
            >
              <option value="">Select reason</option>
              <option value="Spam">Spam</option>
              <option value="Harassment">Harassment</option>
              <option value="Hate Speech">Hate Speech</option>
              <option value="Inappropriate Content">Inappropriate Content</option>
              <option value="Other">Other</option>
            </select>

            <div className="flex justify-end gap-2">
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
