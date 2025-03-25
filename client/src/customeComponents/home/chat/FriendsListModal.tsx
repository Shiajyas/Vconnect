import { X, Search } from "lucide-react";
import { useState, useEffect, useMemo } from "react";

interface User {
  _id: string;
  username: string;
  avatar?: string;
}

interface FriendsListModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  onSelectUser: (userId: string) => void;
  darkMode?: boolean;
}

const FriendsListModal: React.FC<FriendsListModalProps> = ({
  isOpen,
  onClose,
  users,
  onSelectUser,
  darkMode = false,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  // Close modal on Escape key press
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Memoized filtered users
  const filteredUsers = useMemo(
    () =>
      searchTerm
        ? users.filter((user) =>
            user.username.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : users,
    [searchTerm, users]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-40 z-50">
      <div
        className={`w-full max-w-md shadow-lg rounded-lg p-4 border transition-all
          ${darkMode ? "bg-gray-800 text-white border-gray-700" : "bg-white text-black border-gray-300"}
        `}
        role="dialog"
        aria-modal="true"
      >
        {/* Header with Close Button */}
        <div className="flex justify-between items-center border-b pb-2 mb-2">
          <h3 className="text-md font-semibold">Friends List</h3>
          <button onClick={onClose} aria-label="Close modal">
            <X className="w-5 h-5 text-gray-500 hover:text-red-500 transition-all" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-3">
          <div className="flex items-center bg-gray-200 dark:bg-gray-800 rounded-md px-2">
            <Search className="w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search friends..."
              className="flex-1 p-2 bg-transparent focus:outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Users List */}
        <div className="max-h-60 overflow-y-auto space-y-2">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <div
                key={user._id}
                className={`p-3 flex items-center justify-between rounded-lg cursor-pointer transition-all 
                  ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
                onClick={() => {
                  onSelectUser(user._id);
                  onClose(); // Close after selecting a user
                }}
                tabIndex={0} // Allows keyboard navigation
                role="button"
                aria-label={`Select ${user.username}`}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={user.avatar || "/user.png"}
                    className="w-10 h-10 rounded-full"
                    alt={user.username}
                  />
                  <p className="font-medium">{user.username}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-400 py-4">No users found</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FriendsListModal;
