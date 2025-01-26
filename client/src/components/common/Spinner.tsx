import React from 'react';

const Spinner = () => {
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="w-16 h-16 border-4 border-t-4 border-blue-500 border-dashed rounded-full animate-spin-slow"></div>
    </div>
  );
};

export default Spinner;
