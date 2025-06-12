import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Modal from "react-modal";
import { adminSubscriptionService } from "@/services/adminSubscriptionService";

interface Subscription {
  _id: string;
  userId: {
    _id: string;
    username: string;
    email: string;
  };
  isSubscribed: boolean;
  startDate: string | null;
  endDate: string | null;
  amount: number;
}

const AdminManagement: React.FC = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState<{ start?: string; end?: string }>({});
  const [page, setPage] = useState(1);
  const [previewOpen, setPreviewOpen] = useState(false);
  const limit = 10;

  const queryParams = useMemo(
    () => ({
      search,
      status: statusFilter !== "all" ? statusFilter : undefined,
      startDate: dateRange.start,
      endDate: dateRange.end,
      page,
      limit,
    }),
    [search, statusFilter, dateRange, page]
  );

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["subscriptions", queryParams],
    queryFn: () => adminSubscriptionService.getSubscriptions(queryParams),
    staleTime: 20000,
  });

  const handleToggle = async (id: string, current: boolean) => {
    await adminSubscriptionService.toggleSubscriptionStatus(id, !current);
    refetch();
  };

  const generatePDF = async () => {
    const allData = await adminSubscriptionService.getAllSubscriptions({
      search,
      status: statusFilter !== "all" ? statusFilter : undefined,
      startDate: dateRange.start,
      endDate: dateRange.end,
    });

    const doc = new jsPDF("landscape");
    const title = "Subscription Report";
    const branding = "© 2025 Vconnect – Confidential";

    doc.setFontSize(16);
    doc.text(title, 14, 20);

    autoTable(doc, {
      head: [[
        "User ID", "Username", "Email", "Status", "Start Date", "End Date", "Amount ($)"
      ]],
      body: allData.subscriptions.map((sub: Subscription) => [
        sub.userId._id,
        sub.userId.username,
        sub.userId.email,
        sub.isSubscribed ? "Active" : "Inactive",
        sub.startDate ? format(new Date(sub.startDate), "PP") : "N/A",
        sub.endDate ? format(new Date(sub.endDate), "PP") : "N/A",
        sub.amount.toFixed(2)
      ]),
      startY: 30,
      styles: { fontSize: 10 },
      margin: { top: 30 },
      didDrawPage: (data) => {
        doc.setFontSize(10);
        doc.text(branding, data.settings.margin.left, doc.internal.pageSize.height - 10);
      }
    });

    doc.save("subscriptions.pdf");
  };

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Subscription Management</h2>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-4">
        <input
          type="text"
          placeholder="Search by User ID or Email"
          className="border p-2 rounded w-64"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <select
          className="border p-2 rounded"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="all">All Status</option>
          <option value="active">Subscribed</option>
          <option value="inactive">Unsubscribed</option>
        </select>
        <input
          type="date"
          className="border p-2 rounded"
          onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
        />
        <input
          type="date"
          className="border p-2 rounded"
          onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
        />
        <button
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          onClick={() => setPreviewOpen(true)}
        >
          Preview PDF
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto shadow rounded-lg">
        {isLoading ? (
          <div className="text-center p-4">Loading...</div>
        ) : (
          <table className="min-w-full bg-white divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-6 py-3">Username</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">User ID</th>
                <th className="px-6 py-3">Subscribed</th>
                <th className="px-6 py-3">Start Date</th>
                <th className="px-6 py-3">End Date</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data?.subscriptions?.map((sub: Subscription) => (
                <tr key={sub._id}>
                  <td className="px-6 py-4 font-medium">{sub.userId.username}</td>
                  <td className="px-6 py-4 text-gray-600">{sub.userId.email}</td>
                  <td className="px-6 py-4 text-xs">{sub.userId._id}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        sub.isSubscribed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}
                    >
                      {sub.isSubscribed ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {sub.startDate ? format(new Date(sub.startDate), "PP") : "N/A"}
                  </td>
                  <td className="px-6 py-4">
                    {sub.endDate ? format(new Date(sub.endDate), "PP") : "N/A"}
                  </td>
                  <td className="px-6 py-4">${sub.amount.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggle(sub._id, sub.isSubscribed)}
                      className="text-sm px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
                    >
                      Toggle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <button
          disabled={page === 1}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Previous
        </button>
        <span className="text-sm">Page {page}</span>
        <button
          disabled={!data?.hasMore}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </button>
      </div>

      {/* Preview Modal */}
      <Modal
        isOpen={previewOpen}
        onRequestClose={() => setPreviewOpen(false)}
        contentLabel="PDF Preview"
        className="bg-white p-6 rounded-lg max-w-2xl mx-auto my-20 outline-none"
        overlayClassName="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center"
      >
        <h3 className="text-xl font-bold mb-4">PDF Export Preview</h3>
        <p className="text-sm text-gray-600 mb-6">
          This will generate a complete subscription report with your filters and all pages.
        </p>
        <div className="flex gap-4 justify-end">
          <button
            onClick={() => setPreviewOpen(false)}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              generatePDF();
              setPreviewOpen(false);
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Download PDF
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default AdminManagement;
