import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { authService } from "../../../services/authService";
import Spinner from "../../common/Spinner";

const UsersManagement = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Items per page

  // Fetch paginated data using React Query
  const {
    data: paginatedData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["users", currentPage, itemsPerPage], // Include page and limit in the query key
    queryFn: () => authService.getAllUsers(currentPage, itemsPerPage),
    enabled: !!localStorage.getItem("adminToken"), // Only fetch if admin is authenticated
  });

  if (isLoading) return <Spinner />;
  if (isError) return <div>Error fetching user list.</div>;

  const { users, totalPages, totalUsers } = paginatedData;

  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className="bg-white shadow rounded p-4 overflow-x-auto">
      <h2 className="text-xl font-bold mb-4">User List</h2>

      {/* Responsive Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-200">
              <th className="border border-gray-300 px-4 py-2">Username</th>
              <th className="border border-gray-300 px-4 py-2">Full Name</th>
              <th className="border border-gray-300 px-4 py-2">Email</th>
              <th className="border border-gray-300 px-4 py-2">Gender</th>
              <th className="border border-gray-300 px-4 py-2">Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map(
              (
                user: {
                  id: number;
                  username: string;
                  fullname: string;
                  email: string;
                  gender: string;
                  role: string;
                },
                index: number
              ) => (
                <tr
                  key={`${user.id}-${index}`}
                  className="hover:bg-gray-100"
                >
                  <td className="border border-gray-300 px-4 py-2">
                    {user.username}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {user.fullname}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {user.email}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {user.gender}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {user.role}
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center mt-4 space-y-2 md:space-y-0">
        {/* Previous Button */}
        <button
          onClick={() => paginate(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          Previous
        </button>

        {/* Page Numbers */}
        <div className="flex gap-2 flex-wrap justify-center">
          {Array.from({ length: totalPages }, (_, index) => (
            <button
              key={index + 1}
              onClick={() => paginate(index + 1)}
              className={`px-4 py-2 rounded ${
                currentPage === index + 1
                  ? "bg-blue-500 text-black"
                  : "bg-gray-200"
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>

        {/* Next Button */}
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