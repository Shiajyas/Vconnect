import React from 'react';
import { useUserAuth } from '../../hooks/useUserAuth';


function Home() {

  const {logout,user} = useUserAuth()

  const handleLogout = () => {
    logout()
  
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Welcome to the Home Page</h1>
        <h3 className="text-2xl font-bold text-green-800 mb-4 text-center">{user.username}</h3>
        <p className="text-gray-600 mb-6"> Feel free to explore.</p>

        <button
          onClick={handleLogout}
          className="w-full py-2 text-white bg-red-500 rounded-md hover:bg-red-600 focus:outline-none focus:ring focus:ring-red-200"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default Home;
