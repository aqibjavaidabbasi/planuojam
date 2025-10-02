"use client";

import FavouriteListings from "@/components/profile/FavouriteListings";
import MyBookings from "@/components/profile/MyBookings";
import Messages from "@/components/profile/Messages";
import Mylistings from "@/components/profile/Mylistings";
import ProfileTab from "@/components/profile/ProfileTab";
import ReviewsTab from "@/components/profile/ReviewsTab";
import Button from "@/components/custom/Button";
import { useAppSelector } from "@/store/hooks";
import React, { useEffect, useState } from "react";
import { CgProfile } from "react-icons/cg";
import { FaArrowCircleDown, FaList, FaCalendarAlt, FaCalendarCheck } from "react-icons/fa";
import { LuMessageSquareText } from "react-icons/lu";
import { MdEditCalendar, MdOutlineFavorite, MdStarBorderPurple500 } from "react-icons/md";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import ManageBookings from "@/components/profile/ManageBookings";
import ProviderCalendar from "@/components/profile/ProviderCalendar";
import { fetchUnreadForReceiver } from "@/services/messages";

function ProfilePage() {
  const t = useTranslations("Profile");
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const initialTab = searchParams?.get("tab") || "profile";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const user = useAppSelector((state) => state.auth.user);
  const router = useRouter()
  const showTab = (tabName: string) => {
    setActiveTab(tabName);
    // reflect tab in URL without full reload
    if (pathname) {
      const url = `${pathname}?tab=${encodeURIComponent(tabName)}`;
      router.push(url);
    }
    // Close sidebar on mobile after selecting a tab
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  // Check if user is logged in. If there's a token, wait for hydration instead of redirecting.
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!user && !token) {
      router.push("/auth/login");
    }
  }, [user, router]);

  // Keep activeTab in sync with the URL query string
  useEffect(() => {
    const tab = searchParams?.get("tab");
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [searchParams, activeTab]);

  // Compute unread messages once on profile load (respect local reads)
  useEffect(() => {
    (async () => {
      try {
        const uid = user?.id;
        if (!uid) return;
        const res = await fetchUnreadForReceiver(uid, 1, 200);
        const localIdsRaw = typeof window !== 'undefined' ? sessionStorage.getItem('locallyReadMessageIds') : null;
        const locallyRead = new Set<string>(localIdsRaw ? JSON.parse(localIdsRaw) : []);
        const adjusted = res.data.filter((m) => !locallyRead.has(String(m.id)));
        setUnreadCount(adjusted.length);
      } catch {
        // ignore silently
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresh unread count when tab changes or window regains focus
  useEffect(() => {
    const refresh = async () => {
      try {
        const uid = user?.id;
        if (!uid) return;
        const res = await fetchUnreadForReceiver(uid, 1, 200);
        const localIdsRaw = typeof window !== 'undefined' ? sessionStorage.getItem('locallyReadMessageIds') : null;
        const locallyRead = new Set<string>(localIdsRaw ? JSON.parse(localIdsRaw) : []);
        const adjusted = res.data.filter((m) => !locallyRead.has(String(m.id)));
        setUnreadCount(adjusted.length);
      } catch {}
    };
    // On tab change
    refresh();
    // On window focus
    const onFocus = () => { refresh(); };
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', onFocus);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') refresh();
      });
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', onFocus);
        document.removeEventListener('visibilitychange', () => {});
      }
    };
  }, [activeTab, user?.id]);

  return (
    <div className="bg-gray-50 min-h-screen font-inter">
      {!user && <p>{t("loginPrompt")}</p> }
      {/* Main Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8 min-h-[calc(100vh-200px)]">
          {/* Left Sidebar */}
          <div
            className={`w-full lg:w-80 bg-white rounded-2xl shadow-sm border border-gray-100 p-3 md:p-6 transition-all duration-300`}
          >
            <div className="flex justify-between items-center lg:justify-center mx-2 mb-2">
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex flex-row lg:flex-col items-center space-y-2 gap-2.5 lg:gap-0">
                  <div className="w-12 sm:w-15 h-12 sm:h-15 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-2xl">
                      {user?.username?.slice(0, 2)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 sm:gap-2 items-center">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {user?.username}
                    </h3>
                    <p className="text-gray-600 hidden sm:block">{user?.email}</p>
                    {user?.serviceType !== null && (
                      <span className="inline-block bg-primary text-white px-3 py-1 rounded-full text-sm mt-2 w-fit">
                        {user?.serviceType}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="lg:hidden" onClick={()=>setSidebarOpen(!sidebarOpen)}>
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
                {t("tabs.profile")}
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
                  {t("tabs.myListings")}
                </button>
              )}

              {user?.serviceType !== null && (
                <button
                  onClick={() => showTab("manage-bookings")}
                  className={`w-full flex items-center px-4 py-3 text-left rounded-lg font-medium transition-colors cursor-pointer ${
                    activeTab === "manage-bookings"
                      ? "text-white bg-[#cc922f]"
                      : "text-gray-600 hover:text-[#cc922f] hover:bg-gray-50"
                  }`}
                >
                  <FaCalendarAlt size={20} className="mr-3" />
                  {t("tabs.manageBookings", { default: "Manage Bookings" })}
                </button>
              )}

              {user?.serviceType !== null && (
                <button
                  onClick={() => showTab("calendar")}
                  className={`w-full flex items-center px-4 py-3 text-left rounded-lg font-medium transition-colors cursor-pointer ${
                    activeTab === "calendar"
                      ? "text-white bg-[#cc922f]"
                      : "text-gray-600 hover:text-[#cc922f] hover:bg-gray-50"
                  }`}
                >
                  <MdEditCalendar size={20} className="mr-3" />
                  {t("tabs.calendar", { default: "Calendar" })}
                </button>
              )}

              <button
                onClick={() => showTab("bookings")}
                className={`w-full flex items-center px-4 py-3 text-left rounded-lg font-medium transition-colors cursor-pointer ${
                  activeTab === "bookings"
                    ? "text-white bg-[#cc922f]"
                    : "text-gray-600 hover:text-[#cc922f] hover:bg-gray-50"
                }`}
              >
                <FaCalendarCheck size={20} className="mr-3" />
                {t("tabs.bookings", { default: "Bookings" })}
              </button>

              <button
                onClick={() => showTab("favourite-listings")}
                className={`w-full flex items-center px-4 py-3 text-left rounded-lg font-medium transition-colors cursor-pointer ${
                  activeTab === "favourite-listings"
                    ? "text-white bg-[#cc922f]"
                    : "text-gray-600 hover:text-[#cc922f] hover:bg-gray-50"
                }`}
              >
                <MdOutlineFavorite size={20} className="mr-3" />
                {t("tabs.favouriteListings")}
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
                <span className="relative">
                  {t("tabs.messages")}
                  {unreadCount > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center min-w-5 h-5 px-1 text-xs rounded-full bg-red-600 text-white">
                      {unreadCount}
                    </span>
                  )}
                </span>
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
                  {t("tabs.reviews")}
                </button>
              )}
            </nav>
          </div>

          {/* Right Content Area */}
          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100">
            {activeTab === "profile" && <ProfileTab user={user} />}
            {activeTab === "my-listings" && <Mylistings />}
            {activeTab === "manage-bookings" && <ManageBookings />}
            {activeTab === "calendar" && <ProviderCalendar />}
            {activeTab === "bookings" && <MyBookings />}
            {activeTab === "favourite-listings" && <FavouriteListings />}
            {activeTab === "messages" && (
              <Messages
                initialUserId={Number(searchParams?.get("withUser") || 0) || undefined}
                onUnreadChange={(total) => setUnreadCount(total)}
              />
            )}
            {activeTab === "reviews" && <ReviewsTab />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
