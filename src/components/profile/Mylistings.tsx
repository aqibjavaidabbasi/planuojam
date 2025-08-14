import React from "react";

function Mylistings() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Listings</h1>
        <p className="text-gray-600 mt-2">Manage all your property listings.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
          <div className="mb-4">
            <div className="w-full h-48 bg-gray-200 rounded-lg mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-800">
              Modern Downtown Apartment
            </h3>
            <p className="text-gray-600 text-sm">
              2 bed • 2 bath • 1,200 sq ft
            </p>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-[#cc922f]">
              $2,500/month
            </span>
            <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
              Active
            </span>
          </div>
          <div className="mt-4 flex space-x-2">
            <button className="flex-1 bg-[#cc922f] text-white px-3 py-2 rounded-lg text-sm hover:bg-[#d4a03a] transition-colors">
              Edit
            </button>
            <button className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-200 transition-colors">
              View
            </button>
          </div>
        </div>

        <div className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
          <div className="mb-4">
            <div className="w-full h-48 bg-gray-200 rounded-lg mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-800">
              Cozy Studio in Midtown
            </h3>
            <p className="text-gray-600 text-sm">1 bed • 1 bath • 600 sq ft</p>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-[#cc922f]">
              $1,800/month
            </span>
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
              Pending
            </span>
          </div>
          <div className="mt-4 flex space-x-2">
            <button className="flex-1 bg-[#cc922f] text-white px-3 py-2 rounded-lg text-sm hover:bg-[#d4a03a] transition-colors">
              Edit
            </button>
            <button className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-200 transition-colors">
              View
            </button>
          </div>
        </div>

        <div className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
          <div className="mb-4">
            <div className="w-full h-48 bg-gray-200 rounded-lg mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-800">
              Luxury Penthouse Suite
            </h3>
            <p className="text-gray-600 text-sm">
              3 bed • 2.5 bath • 2,000 sq ft
            </p>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-[#cc922f]">
              $4,200/month
            </span>
            <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
              Rented
            </span>
          </div>
          <div className="mt-4 flex space-x-2">
            <button className="flex-1 bg-[#cc922f] text-white px-3 py-2 rounded-lg text-sm hover:bg-[#d4a03a] transition-colors">
              Edit
            </button>
            <button className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-200 transition-colors">
              View
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Mylistings;
