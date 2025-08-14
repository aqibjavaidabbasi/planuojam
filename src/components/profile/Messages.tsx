import React from "react";

function Messages() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Messages</h1>
        <p className="text-gray-600 mt-2">
          Coming soon - Stay tuned for messaging features!
        </p>
      </div>
      <div className="text-center py-16">
        <div className="w-24 h-24 bg-[#cc922f] rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-12 h-12 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          Messages Coming Soon
        </h3>
        <p className="text-gray-600 max-w-md mx-auto">
          We're working on bringing you a powerful messaging system to connect
          with property owners and renters.
        </p>
      </div>
    </div>
  );
}

export default Messages;
