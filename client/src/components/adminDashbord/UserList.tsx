import React from "react";
import { useQuery } from "@tanstack/react-query";
import { authService } from "../../services/authService";
import Spinner from "../common/Spinner";

const UserList = () => {
  const { data: users, isLoading, isError } = useQuery({
    queryKey: ["users"],
    queryFn: authService.getAllUsers,
  });

  if (isLoading) return <Spinner />;
  if (isError) return <div>Error fetching user list.</div>;

  return (
    <div className="bg-white shadow rounded p-4">
      <h2 className="text-xl font-bold mb-4">User List</h2>
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
            (user: {
              id: number;
              username: string;
              fullName: string;
              email: string;
              gender: string;
              role: string;
            }, index: number) => (
              <tr
                key={`${user.id}-${index}`} // Combines id and index for uniqueness
                className="hover:bg-gray-100"
              >
                <td className="border border-gray-300 px-4 py-2">{user.username}</td>
                <td className="border border-gray-300 px-4 py-2">{user.fullName}</td>
                <td className="border border-gray-300 px-4 py-2">{user.email}</td>
                <td className="border border-gray-300 px-4 py-2">{user.gender}</td>
                <td className="border border-gray-300 px-4 py-2">{user.role}</td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  );
};

export default UserList;
