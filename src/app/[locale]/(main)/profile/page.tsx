"use client";
import dynamic from "next/dynamic";

const ProfileTab = dynamic(() => import("@/components/profile/ProfileTab"), { ssr: false });
const Mylistings = dynamic(() => import("@/components/profile/Mylistings"), { ssr: false });
const PromotionsTab = dynamic(() => import("@/components/profile/PromotionsTab"), { ssr: false });
const ManageBookings = dynamic(() => import("@/components/profile/ManageBookings"), { ssr: false });
const ProviderCalendar = dynamic(() => import("@/components/profile/ProviderCalendar"), { ssr: false });
const MyBookings = dynamic(() => import("@/components/profile/MyBookings"), { ssr: false });
const FavouriteListings = dynamic(() => import("@/components/profile/FavouriteListings"), { ssr: false });
const Messages = dynamic(() => import("@/components/profile/Messages"), { ssr: false, loading: () => <div /> });
const ReviewsTab = dynamic(() => import("@/components/profile/ReviewsTab"), { ssr: false });

import Button from "@/components/custom/Button";
import { useAppSelector } from "@/store/hooks";
import React, { useEffect, useState } from "react";
import { CgProfile } from "react-icons/cg";
import { FaArrowCircleDown, FaList, FaCalendarAlt, FaCalendarCheck, FaBullhorn } from "react-icons/fa";
import { LuMessageSquareText } from "react-icons/lu";
import { MdEditCalendar, MdOutlineFavorite, MdStarBorderPurple500 } from "react-icons/md";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { fetchUnreadForReceiver } from "@/services/messages";
import { RootState } from "@/store";
import { fetchListingsByUserLeastPopulated } from "@/services/listing";
import { fetchPromotionsByUser } from "@/services/promotion";
import type { Promotion } from "@/types/promotion";
import type { ListingItem } from "@/types/pagesTypes";
import { useLocale } from "next-intl";

function ProfilePage() {
  const t = useTranslations("Profile");
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const initialTab = searchParams?.get("tab") || "profile";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const user = useAppSelector((state: RootState) => state.auth.user);
  const router = useRouter()
  const locale = useLocale();
  const [promotionHintListingId, setPromotionHintListingId] = useState<string | null>(null);
  const [promotionHintTitle, setPromotionHintTitle] = useState<string | null>(null);
  const storageKeySeen = "promotionHint.seenListingIds";

  const computeAndSetPromotionHint = async () => {
    try {
      if (!user?.documentId) {
        setPromotionHintListingId(null);
        return;
      }
      const listings: ListingItem[] = await fetchListingsByUserLeastPopulated(String(user.documentId), "published", locale as string);
      type MinimalListingRef = { documentId?: string | number; id?: string | number; title?: string; slug?: string };
      const listingsArr: MinimalListingRef[] = listings as unknown as MinimalListingRef[];
      const seenRaw = typeof window !== 'undefined' ? localStorage.getItem(storageKeySeen) : null;
      const seenIds = new Set<string>(seenRaw ? JSON.parse(seenRaw) : []);

      // Load promotions to ensure we don't show the hint if the listing already has an active promotion
      const promos: Promotion[] = await fetchPromotionsByUser(String(user.documentId));
      const now = new Date();
      const activeByListingDocId = new Set<string>();
      for (const p of Array.isArray(promos) ? promos : []) {
        const status = String(p?.promotionStatus || '').toLowerCase();
        const endDateStr = p?.endDate as string | undefined;
        const listingDocId = String(p?.listingDocumentId || p?.listing?.documentId || '');
        if (!listingDocId) continue;
        const hasEnded = (() => {
          if (!endDateStr) return false;
          const end = new Date(endDateStr);
          return isFinite(end.getTime()) && end < now;
        })();
        const isCompleted = status === 'completed' || status === 'ended' || status === 'finished';
        const isActive = !isCompleted && !hasEnded;
        if (isActive) activeByListingDocId.add(listingDocId);
      }

      // Find a listing that is new (not seen) and not actively promoted
      const candidate = listingsArr.find((l) => {
        const docId = String(l?.documentId ?? l?.id ?? '');
        if (!docId) return false;
        return !seenIds.has(docId) && !activeByListingDocId.has(docId);
      });

      if (candidate) {
        setPromotionHintListingId(String(candidate.documentId ?? candidate.id));
        setPromotionHintTitle(String(candidate.title ?? candidate.slug ?? ''));
      } else {
        setPromotionHintListingId(null);
        setPromotionHintTitle(null);
      }
    } catch {
      // fail silently; do not block UI
      setPromotionHintListingId(null);
      setPromotionHintTitle(null);
    }
  };

  const markListingHintSeen = (listingId: string | null) => {
    if (!listingId || typeof window === 'undefined') return;
    const seenRaw = localStorage.getItem(storageKeySeen);
    const seen: string[] = seenRaw ? JSON.parse(seenRaw) : [];
    if (!seen.includes(listingId)) {
      seen.push(listingId);
      localStorage.setItem(storageKeySeen, JSON.stringify(seen));
    }
  };
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

  // Re-compute hint visibility when user/locale/tab changes
  useEffect(() => {
    computeAndSetPromotionHint();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.documentId, locale, activeTab]);

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
      } catch { }
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
        document.removeEventListener('visibilitychange', () => { });
      }
    };
  }, [activeTab, user?.id]);

  return (
    <div className="bg-gray-50 min-h-screen font-inter">
      {!user && <p>{t("loginPrompt")}</p>}
      {/* Main Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8 min-h-[calc(100vh-200px)]">
          {/* Left Sidebar */}
          <div
            className={`w-full lg:w-80 bg-white rounded-2xl shadow-sm border border-gray-100 p-3 md:p-6 transition-all duration-300`}
          >
            <div className="flex justify-between items-center lg:justify-center mx-2 mb-2">
              <div className="">
                <div className="bg-gray-50 rounded-xl p-6 flex flex-row lg:flex-col items-center space-y-2 gap-2.5 lg:gap-0">
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
                        {t(String(user?.serviceType || ""))}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="lg:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
                <Button style="secondary">
                  <FaArrowCircleDown
                    size={20}
                    className={`transition-transform ${sidebarOpen ? "rotate-180" : ""
                      }`}
                  />
                </Button>
              </div>
            </div>

            <nav
              className={`space-y-2 ${sidebarOpen ? "block" : "hidden lg:block"
                }`}
            >
              <button
                onClick={() => showTab("profile")}
                className={`w-full flex items-center px-4 py-3 text-left rounded-lg font-medium transition-colors cursor-pointer ${activeTab === "profile"
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
                  className={`w-full flex items-center px-4 py-3 text-left rounded-lg font-medium transition-colors cursor-pointer ${activeTab === "my-listings"
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
                  onClick={() => showTab("promotions")}
                  className={`w-full flex items-center px-4 py-3 text-left rounded-lg font-medium transition-colors cursor-pointer ${activeTab === "promotions"
                      ? "text-white bg-[#cc922f]"
                      : "text-gray-600 hover:text-[#cc922f] hover:bg-gray-50"
                    }`}
                >
                  <FaBullhorn size={20} className="mr-3" />
                  {t("tabs.promotions", { default: "Promotions" })}
                </button>
              )}

              {user?.serviceType !== null && (
                <button
                  onClick={() => showTab("manage-bookings")}
                  className={`w-full flex items-center px-4 py-3 text-left rounded-lg font-medium transition-colors cursor-pointer ${activeTab === "manage-bookings"
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
                  className={`w-full flex items-center px-4 py-3 text-left rounded-lg font-medium transition-colors cursor-pointer ${activeTab === "calendar"
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
                className={`w-full flex items-center px-4 py-3 text-left rounded-lg font-medium transition-colors cursor-pointer ${activeTab === "bookings"
                    ? "text-white bg-[#cc922f]"
                    : "text-gray-600 hover:text-[#cc922f] hover:bg-gray-50"
                  }`}
              >
                <FaCalendarCheck size={20} className="mr-3" />
                {t("tabs.bookings", { default: "Bookings" })}
              </button>

              <button
                onClick={() => showTab("favourite-listings")}
                className={`w-full flex items-center px-4 py-3 text-left rounded-lg font-medium transition-colors cursor-pointer ${activeTab === "favourite-listings"
                    ? "text-white bg-[#cc922f]"
                    : "text-gray-600 hover:text-[#cc922f] hover:bg-gray-50"
                  }`}
              >
                <MdOutlineFavorite size={20} className="mr-3" />
                {t("tabs.favouriteListings")}
              </button>

              <button
                onClick={() => showTab("messages")}
                className={`w-full flex items-center px-4 py-3 text-left rounded-lg font-medium transition-colors cursor-pointer ${activeTab === "messages"
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
                  className={`w-full flex items-center px-4 py-3 text-left rounded-lg font-medium transition-colors cursor-pointer ${activeTab === "reviews"
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
            {activeTab === "my-listings" && (
              <div className="w-full h-full">
                {/* Promotion hint banner (only for newly created, not-promoted listings) */}
                {promotionHintListingId && (
                  <div className="mx-4 mt-4 mb-1 rounded-xl border border-amber-200 bg-amber-50 p-4 flex flex-col gap-2">
                    <div className="text-sm text-amber-900">
                      {promotionHintTitle
                        ? t("promoteHintWithTitle", { title: promotionHintTitle })
                        : t("promoteHint")}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        style="secondary"
                        onClick={() => {
                          markListingHintSeen(promotionHintListingId);
                          setPromotionHintListingId(null);
                          setPromotionHintTitle(null);
                          showTab("promotions");
                        }}
                      >
                        {t("promoteCta", { default: "Promote listing" })}
                      </Button>
                      <Button
                        style="ghost"
                        onClick={() => {
                          markListingHintSeen(promotionHintListingId);
                          setPromotionHintListingId(null);
                          setPromotionHintTitle(null);
                        }}
                      >
                        {t("promoteLater", { default: "Later" })}
                      </Button>
                    </div>
                  </div>
                )}
                <Mylistings />
              </div>
            )}
            {activeTab === "promotions" && <PromotionsTab />}
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
