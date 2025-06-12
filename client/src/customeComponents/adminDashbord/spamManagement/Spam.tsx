"use client";

import React, { useEffect, useState } from "react";
import { socket } from "@/utils/Socket";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { adminReportService } from "@/services/adminReportService";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { useReportStore } from "@/appStore/useReportStore";

interface Report {
  _id: string;
  reason: string;
  createdAt: string;
  reporter: {
    username: string;
    email: string;
  };
  post: {
    _id: string;
    title: string;
    description: string;
    mediaUrls: string[];
    owner: {
      username: string;
      email: string;
    };
  };
}

const PAGE_LIMIT = 10;

const Spam = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const {
    reportCount,
    setReportCount,
    increment: incrementCount,
    decrement: decrementCount,
  } = useReportStore();

  const {
    data: reports = [],
    isLoading,
    isFetching,
  } = useQuery<Report[]>({
    queryKey: ["reports", page],
    queryFn: () =>
      adminReportService.getReportedPosts({ page, limit: PAGE_LIMIT }),
  });
// Replace dismissMutation and blockMutation
const dismissMutation = useMutation({
  mutationFn: async (reportId: string) => {
    return new Promise<void>((resolve, reject) => {
      socket.emit("admin:dismissReport", reportId, (response: { success: boolean; message?: string }) => {
        if (response.success) return resolve();
        reject(new Error(response.message || "Dismiss failed"));
      });
    });
  },
  onSuccess: (_, reportId) => {
    queryClient.setQueryData<Report[]>(["reports", page], (prev = []) =>
      prev.filter((r) => r._id !== reportId)
    );
    decrementCount();
    toast.success("✅ Report dismissed");
  },
  onError: () => toast.error("❌ Failed to dismiss report"),
});

const blockMutation = useMutation({
  mutationFn: async (postId: string) => {
    return new Promise<void>((resolve, reject) => {
      socket.emit("admin:blockPost", postId, (response: { success: boolean; message?: string }) => {
        if (response.success) return resolve();
        reject(new Error(response.message || "Block failed"));
      });
    });
  },
  onSuccess: () => {
    decrementCount();
    queryClient.invalidateQueries({ queryKey: ["reports"] });
    toast.success("🚫 Post blocked");
  },
  onError: () => toast.error("❌ Failed to block post"),
});

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const count = await adminReportService.getReportCount();
        console.log("Fetched report count:", count);
        setReportCount(count.count);
      } catch (err) {
        console.error("Failed to fetch report count", err);
      }
    };

    fetchCount();
    socket.emit("admin:join");

    const handleNewReport = (report: Report) => {
      queryClient.setQueryData<Report[]>(["reports", 1], (prev = []) => {
        const exists = prev.some((r) => r._id === report._id);
        if (exists) return prev;
        return [report, ...prev];
      });
      incrementCount();
      toast.info("📨 New report received");
    };

    socket.off("admin:newReport");
    socket.on("admin:newReport", handleNewReport);

    return () => {
      socket.off("admin:newReport", handleNewReport);
    };
  }, [queryClient, setReportCount, incrementCount]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-yellow-600" />
          Reported Posts
        </h1>

        <motion.div
          key={reportCount}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="bg-red-100 text-red-800 px-3 py-1 rounded-full font-semibold text-sm shadow-sm"
        >
          Total: {reportCount}
        </motion.div>
      </div>

      {isLoading && <p className="text-gray-600">Loading reports...</p>}
      {!isLoading && reports.length === 0 && (
        <p className="text-gray-500 italic">No reports found.</p>
      )}

      <div className="grid gap-6">
        {reports.map((report) => (
          <Card
            key={report._id}
            className="shadow-sm border transition-all duration-200 hover:shadow-lg hover:border-gray-300 group"
          >
            <CardContent className="p-5 space-y-3">
              <div className="flex justify-between items-start">
                <div className="text-sm text-gray-500">
                  Reported by{" "}
                  <strong className="text-gray-800 group-hover:text-black transition-colors">
                    {report.reporter?.username ?? "Unknown"}
                  </strong>{" "}
                  ·{" "}
                  {formatDistanceToNow(new Date(report.createdAt), {
                    addSuffix: true,
                  })}
                </div>
                <div className="text-xs font-medium bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                  {report.reason}
                </div>
              </div>

              <p className="text-gray-800 text-base leading-relaxed whitespace-pre-wrap">
                {report.post?.description || (
                  <span className="text-gray-400 italic">No description</span>
                )}
              </p>

              {report.post?.mediaUrls?.[0] && (
                <div className="border rounded-md bg-gray-50 p-2 flex justify-center items-center">
                  <img
                    src={report.post.mediaUrls[0]}
                    alt="Reported"
                    className="max-h-[500px] w-auto object-contain transition-transform duration-200 group-hover:scale-[1.02]"
                  />
                </div>
              )}

              <div className="text-sm text-gray-600">
                Post Owner:{" "}
                <strong className="text-gray-800">
                  {report.post?.owner?.username ?? "Unknown"}
                </strong>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <Button
                  variant="destructive"
                  onClick={() => dismissMutation.mutate(report._id)}
                  disabled={dismissMutation.isPending}
                >
                  Dismiss
                </Button>
                <Button
                  variant="outline"
                  onClick={() => blockMutation.mutate(report.post._id)}
                  disabled={blockMutation.isPending}
                >
                  Block Post
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-between items-center mt-10">
        <Button
          onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          disabled={page === 1 || isFetching}
        >
          ⬅ Previous
        </Button>
        <span className="text-gray-700 font-medium">Page {page}</span>
        <Button
          onClick={() => setPage((prev) => prev + 1)}
          disabled={reports.length < PAGE_LIMIT || isFetching}
        >
          Next ➡
        </Button>
      </div>
    </div>
  );
};

export default Spam;
