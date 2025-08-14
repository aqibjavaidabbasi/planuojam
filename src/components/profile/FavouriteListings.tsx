import React from "react";

function FavouriteListings() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Favourite Listings</h1>
        <p className="text-gray-600 mt-2">
          Your saved and favourite properties.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
          <div className="mb-4">
            <div className="w-full h-48 bg-gray-200 rounded-lg mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-800">
              Beachfront Condo
            </h3>
            <p className="text-gray-600 text-sm">
              2 bed • 2 bath • 1,500 sq ft
            </p>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-[#cc922f]">
              $3,200/month
            </span>
            <button className="text-red-500 hover:text-red-700">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          </div>
          <div className="mt-4">
            <button className="w-full bg-[#cc922f] text-white px-3 py-2 rounded-lg text-sm hover:bg-[#d4a03a] transition-colors">
              Contact Owner
            </button>
          </div>
        </div>

        <div className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
          <div className="mb-4">
            <div className="w-full h-48 bg-gray-200 rounded-lg mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-800">
              Mountain View Cabin
            </h3>
            <p className="text-gray-600 text-sm">
              3 bed • 2 bath • 1,800 sq ft
            </p>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-[#cc922f]">
              $2,800/month
            </span>
            <button className="text-red-500 hover:text-red-700">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          </div>
          <div className="mt-4">
            <button className="w-full bg-[#cc922f] text-white px-3 py-2 rounded-lg text-sm hover:bg-[#d4a03a] transition-colors">
              Contact Owner
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FavouriteListings;
