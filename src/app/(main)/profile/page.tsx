"use client";

import FavouriteListings from "@/components/profile/FavouriteListings";
import Messages from "@/components/profile/Messages";
import Mylistings from "@/components/profile/Mylistings";
import ProfileTab from "@/components/profile/ProfileTab";
import ReviewsTab from "@/components/profile/ReviewsTab";
import Button from "@/components/custom/Button";
import { useAppSelector } from "@/store/hooks";
import React, { useEffect, useState } from "react";
import { CgProfile } from "react-icons/cg";
import { FaArrowCircleDown, FaList } from "react-icons/fa";
import { LuMessageSquareText } from "react-icons/lu";
import { MdOutlineFavorite, MdStarBorderPurple500 } from "react-icons/md";
import { useRouter } from "next/navigation";

function ProfilePage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const user = useAppSelector((state) => state.auth.user);
  const router = useRouter()
  const showTab = (tabName: string) => {
    setActiveTab(tabName);
    // Close sidebar on mobile after selecting a tab
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  // Check if user is logged in
  useEffect(() => {
    if (!user) {
      router.push("/");
    }
  }, [user, router]);

  return (
    <div className="bg-gray-50 min-h-screen font-inter">
      {!user && <p>Please login to view your profile. Redirecting...</p> }
      {/* Main Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8 min-h-[calc(100vh-200px)]">
          {/* Left Sidebar */}
          <div
            className={`w-full lg:w-80 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 transition-all duration-300`}
          >
            <div className="flex justify-between items-center lg:justify-center mx-2 mb-2">
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-15 h-15 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-2xl">
                      {user?.username?.slice(0, 2)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2 items-center">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {user?.username}
                    </h3>
                    <p className="text-gray-600">{user?.email}</p>
                    {user?.serviceType !== null && (
                      <span className="inline-block bg-primary text-white px-3 py-1 rounded-full text-sm mt-2 w-fit">
                        {user?.serviceType}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="lg:hidden">
                <Button style="secondary">
                  <FaArrowCircleDown
                    size={20}
                    className={`transition-transform ${
                      sidebarOpen ? "rotate-180" : ""
                    }`}
                  />
                </Button>
              </div>
            </div>

            <nav
              className={`space-y-2 ${
                sidebarOpen ? "block" : "hidden lg:block"
              }`}
            >
              <button
                onClick={() => showTab("profile")}
                className={`w-full flex items-center px-4 py-3 text-left rounded-lg font-medium transition-colors cursor-pointer ${
                  activeTab === "profile"
                    ? "text-white bg-[#cc922f]"
                    : "text-gray-600 hover:text-[#cc922f] hover:bg-gray-50"
                }`}
              >
                <CgProfile size={20} className="mr-3" />
                Profile
              </button>

              {user?.serviceType !== null && (
                <button
                  onClick={() => showTab("my-listings")}
                  className={`w-full flex items-center px-4 py-3 text-left rounded-lg font-medium transition-colors cursor-pointer ${
                    activeTab === "my-listings"
                      ? "text-white bg-[#cc922f]"
                      : "text-gray-600 hover:text-[#cc922f] hover:bg-gray-50"
                  }`}
                >
                  <FaList size={20} className="mr-3" />
                  My Listings
                </button>
              )}

                <button
                  onClick={() => showTab("favourite-listings")}
                  className={`w-full flex items-center px-4 py-3 text-left rounded-lg font-medium transition-colors cursor-pointer ${
                    activeTab === "favourite-listings"
                      ? "text-white bg-[#cc922f]"
                      : "text-gray-600 hover:text-[#cc922f] hover:bg-gray-50"
                  }`}
                >
                  <MdOutlineFavorite size={20} className="mr-3" />
                  Favourite Listings
                </button>

              <button
                onClick={() => showTab("messages")}
                className={`w-full flex items-center px-4 py-3 text-left rounded-lg font-medium transition-colors cursor-pointer ${
                  activeTab === "messages"
                    ? "text-white bg-[#cc922f]"
                    : "text-gray-600 hover:text-[#cc922f] hover:bg-gray-50"
                }`}
              >
                <LuMessageSquareText size={20} className="mr-3" />
                Messages
              </button>

              {!user?.serviceType === null && (
                <button
                  onClick={() => showTab("reviews")}
                  className={`w-full flex items-center px-4 py-3 text-left rounded-lg font-medium transition-colors cursor-pointer ${
                    activeTab === "reviews"
                      ? "text-white bg-[#cc922f]"
                      : "text-gray-600 hover:text-[#cc922f] hover:bg-gray-50"
                  }`}
                >
                  <MdStarBorderPurple500 size={20} className="mr-3" />
                  Reviews
                </button>
              )}
            </nav>
          </div>

          {/* Right Content Area */}
          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100">
            {activeTab === "profile" && <ProfileTab user={user} />}
            {activeTab === "my-listings" && <Mylistings />}
            {activeTab === "favourite-listings" && <FavouriteListings />}
            {activeTab === "messages" && <Messages />}
            {activeTab === "reviews" && <ReviewsTab />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
