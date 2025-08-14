import React from "react";

function ReviewsTab() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Reviews</h1>
        <p className="text-gray-600 mt-2">
          View and manage your property reviews.
        </p>
      </div>

      <div className="space-y-6">
        <div className="border border-gray-200 rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-[#cc922f] rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">SM</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">Sarah Miller</h4>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className="w-4 h-4 text-yellow-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
            </div>
            <span className="text-sm text-gray-500">2 days ago</span>
          </div>
          <p className="text-gray-700 mb-4">
            "Excellent property! The apartment was clean, well-maintained, and
            exactly as described. The landlord was very responsive and helpful
            throughout our stay."
          </p>
          <div className="text-sm text-gray-600">
            <span className="font-medium">Property:</span> Modern Downtown
            Apartment
          </div>
        </div>

        <div className="border border-gray-200 rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-[#cc922f] rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">MJ</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">Mike Johnson</h4>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4].map((star) => (
                    <svg
                      key={star}
                      className="w-4 h-4 text-yellow-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                  <svg
                    className="w-4 h-4 text-gray-300"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
              </div>
            </div>
            <span className="text-sm text-gray-500">1 week ago</span>
          </div>
          <p className="text-gray-700 mb-4">
            "Good location and decent amenities. The place was mostly clean,
            though there were some minor maintenance issues that could be
            addressed."
          </p>
          <div className="text-sm text-gray-600">
            <span className="font-medium">Property:</span> Cozy Studio in
            Midtown
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReviewsTab;
