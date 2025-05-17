import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authService } from "../../../services/authService";
import Spinner from "../../common/Spinner";
import { toast } from "react-toastify";
import { useAuthStore } from "@/appStore/AuthStore";

interface User {
  _id: string;
  username: string;
  fullname: string;
  email: string;
  gender: string;
  role: string;
  isBlocked: boolean;
}

const UsersManagement = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<{ column: string; order: "asc" | "desc" }>({
    column: "username",
    order: "asc",
  });

  const queryClient = useQueryClient();
  const {isAdminAuthenticated} = useAuthStore()

  // Fetch all users once
  const { data: allUsersData, isLoading, isError } = useQuery({
    queryKey: ["allUsers"],
    queryFn: () => authService.getAllUsers(1,1000),
    enabled: !!isAdminAuthenticated,
  });

  const blockUserMutation = useMutation({
    mutationFn: authService.blockUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
      toast.success("User has been blocked.");
    },
  });

  const unblockUserMutation = useMutation({
    mutationFn: authService.unblockUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
      toast.success("User has been unblocked.");
    },
  });

  if (isLoading) return <Spinner />;
  if (isError) return <div>Error fetching user list.</div>;

  const allUsers = allUsersData?.users || [];

  // Total number of users
  const totalUsers = allUsers.length;

  // console.log("allUsers", allUsers);

  // Filter users based on search term
  const filteredUsers = allUsers?.filter((user: User) =>
   
    [user.username, user.email, user.fullname].some((field) =>
      field?.toLowerCase()?.includes(searchTerm.toLowerCase())
    )
  );

  // Sort users
  const sortedUsers = filteredUsers?.sort((a, b) => {
    if (sortBy.column === "isBlocked") {
      return sortBy.order === "asc" ? Number(a.isBlocked) - Number(b.isBlocked) : Number(b.isBlocked) - Number(a.isBlocked);
    } else {
      return sortBy.order === "asc"
        ? a[sortBy.column]?.localeCompare(b[sortBy.column])
        : b[sortBy.column]?.localeCompare(a[sortBy.column]);
    }
  });

  // Paginate users on frontend
  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);
  const displayedUsers = sortedUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Handle page change
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Handle sorting
  const handleSort = (column: string) => {
    setSortBy((prev) => ({
      column,
      order: prev.column === column && prev.order === "asc" ? "desc" : "asc",
    }));
  };

  // Handle block/unblock
  const toggleBlockStatus = (userId: string, isBlocked: boolean) => {
    if (isBlocked) {
      unblockUserMutation.mutate(userId);
    } else {
      blockUserMutation.mutate(userId);
    }
  };

  return (
    <div className="bg-white shadow rounded p-4 overflow-x-auto">
      <h2 className="text-xl font-bold mb-4">User List</h2>

      {/* Search Input */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by username, email, or full name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
        />
      </div>

      {/* User Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-200">
              {["username", "fullname", "email", "isBlocked"].map((col) => (
                <th
                  key={col}
                  className="border border-gray-300 px-4 py-2 cursor-pointer"
                  onClick={() => handleSort(col)}
                >
                  {col === "isBlocked" ? "Blocked" : col.charAt(0).toUpperCase() + col.slice(1)}{" "}
                  {sortBy.column === col && (sortBy.order === "asc" ? "↑" : "↓")}
                </th>
              ))}
              <th className="border border-gray-300 px-4 py-2">Gender</th>
              <th className="border border-gray-300 px-4 py-2">Role</th>
              <th className="border border-gray-300 px-4 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {displayedUsers?.map((user) => (
              <tr key={user._id} className="hover:bg-gray-100">
                <td className="border border-gray-300 px-4 py-2">{user.username}</td>
                <td className="border border-gray-300 px-4 py-2">{user.fullname}</td>
                <td className="border border-gray-300 px-4 py-2">{user.email}</td>
                <td className="border border-gray-300 px-4 py-2">{user.isBlocked ? "Yes" : "No"}</td>
                <td className="border border-gray-300 px-4 py-2">{user.gender}</td>
                <td className="border border-gray-300 px-4 py-2">{user.role}</td>
                <td className="border border-gray-300 px-4 py-2">
                  <button
                    onClick={() => toggleBlockStatus(user._id, user.isBlocked)}
                    className={`px-4 py-2 rounded ${
                      user.isBlocked ? "bg-red-500 text-white" : "bg-green-500 text-white"
                    }`}
                    disabled={
                      (user.isBlocked && unblockUserMutation.status === "pending") ||
                      (!user.isBlocked && blockUserMutation.status === "pending")
                    }
                  >
                    {user.isBlocked ? "Unblock" : "Block"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center mt-4 space-y-2 md:space-y-0">
        <button
          onClick={() => paginate(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          Previous
        </button>

        <div className="flex gap-2 flex-wrap justify-center">
          {Array.from({ length: totalPages }, (_, index) => (
            <button
              key={index + 1}
              onClick={() => paginate(index + 1)}
              className={`px-4 py-2 rounded ${currentPage === index + 1 ? "bg-blue-500 text-white" : "bg-gray-200"}`}
            >
              {index + 1}
            </button>
          ))}
        </div>

        <button
          onClick={() => paginate(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {/* Total Users */}
      <div className="mt-4 text-sm text-gray-600 text-center md:text-left">
        Total Users: {totalUsers}
      </div>
    </div>
  );
};

export default UsersManagement;
