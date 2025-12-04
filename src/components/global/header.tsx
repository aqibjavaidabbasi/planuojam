"use client";
import { header as HeaderType } from "@/types/pagesTypes";
import React, { useState } from "react";
import Search from "../custom/Search";
import Select from "../custom/Select";
import { FaBars } from "react-icons/fa";
import { IoMdClose } from "react-icons/io";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import ProfileBtn from "./ProfileBtn";
import Logo from "./Logo";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchLikedListing } from "@/store/thunks/likedListing";
import { fetchUser } from "@/services/auth";
import { logout, setUser } from "@/store/slices/authSlice";
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
} from "@/config/i18n";
import { useTranslations } from "next-intl";
import { RootState } from "@/store";
import { useSearchParams } from "next/navigation";

function Header({ headerData }: { headerData: HeaderType }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const isHotDealActive = () => pathname.endsWith("/hot-deal");
  const isMapActive = () => pathname.endsWith("/map");
  const user = useAppSelector((state: RootState) => state.auth.user);
  const likedListings = useAppSelector((state: RootState) => state.likedListings);
  const [loading, setLoading] = useState(false);
  const [selectedLocale, setSelectedLocale] = useState<string>(DEFAULT_LOCALE);
  const [selected, setSelected] = useState("");
  const handleSelect = (val: string) => {
    setSelected(val);
  };
  const t = useTranslations("hotdealstatic")
  const tLocales = useTranslations("Global.Locales")
  const tHeader = useTranslations("Global.Header")
  const eventTypeQuery = searchParams?.get("eventType") || "";

  useEffect(() => {
    const validateUser = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          setLoading(true);
          const res = await fetchUser(token);
          if (res) {
            dispatch(setUser(res));
          }
        } catch (error) {
          console.error("Failed to fetch user:", error);
          dispatch(logout());
        } finally {
          setLoading(false);
        }
      }
    };
    validateUser();
  }, [dispatch]);

  //set liked listing state in header to set state globally on mount
  useEffect(() => {
    if (!user?.id) return;

    // Check if we already have liked listings and they were fetched recently (within 5 minutes)
    const hasRecentData = likedListings.items.length > 0 &&
                         likedListings.lastFetched &&
                         (Date.now() - likedListings.lastFetched) < 300000; // 5 minutes

    // Only fetch if we don't have recent data
    if (!hasRecentData) {
      dispatch(fetchLikedListing({ userId: user.id, locale: 'en' }))
        .unwrap()
        .catch(() => { });
    }
    //eslint-disable-next-line
  }, [dispatch, user?.id]);

  // Initialize selected locale
  useEffect(() => {
    // First check localStorage
    const stored = localStorage.getItem("locale");
    if (stored && SUPPORTED_LOCALES.includes(stored)) {
      setSelectedLocale(stored);
      return;
    }

    // Then check URL segment
    const seg = window.location.pathname.split("/")[1];
    if (seg && SUPPORTED_LOCALES.includes(seg)) {
      setSelectedLocale(seg);
      localStorage.setItem("locale", seg);
      return;
    }

    // Fallback to default
    setSelectedLocale(DEFAULT_LOCALE);
    localStorage.setItem("locale", DEFAULT_LOCALE);
  }, []);

  // Keep selector in sync if user navigates to a different locale elsewhere
  useEffect(() => {
    const seg =
      typeof window !== "undefined"
        ? window.location.pathname.split("/")[1]
        : "";
    if (seg && SUPPORTED_LOCALES.includes(seg) && seg !== selectedLocale) {
      setSelectedLocale(seg);
    }
  }, [pathname, selectedLocale]);

  //lock body scroll when mobile nav opens
  useEffect(function () {
    if (mobileNavOpen) {
      // Prevent scrolling on body and html
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.top = `-${window.scrollY}px`;
      document.body.style.width = "100%";
      document.documentElement.style.overflow = "hidden";
    } else {
      // Restore scrolling
      const scrollY = document.body.style.top;
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.documentElement.style.overflow = "";
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || "0") * -1);
      }
    }

    // Cleanup function to restore scroll on unmount
    return () => {
      if (mobileNavOpen) {
        document.body.style.overflow = "";
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        document.documentElement.style.overflow = "";
      }
    };
  }, [mobileNavOpen])

  const handleLocaleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value;
    if (!SUPPORTED_LOCALES.includes(next)) return;
    setSelectedLocale(next);
    try {
      localStorage.setItem("locale", next);
    } catch { }
    // Force a full page reload to the new locale path
    window.location.href = `/${next}${pathname}`;
  };

  function getServiceUrl(docId: string) {
    const category = headerData?.nav.categories.find((cat) => cat.documentId === docId);
    if (!category) return;
    if (category.locale === 'en') return `/service/${category.slug}`;
    if (category.locale !== 'en') {
      const enEntry = category.localizations.find(loc => loc.locale === 'en');
      return enEntry ? `/service/${enEntry.slug}` : `/service/${category.slug}`;
    }
  }


  function getEventTypeUrl(docId: string) {
    const eventType = headerData?.eventTypes.find((et) => et.eventType.documentId === docId);
    if (!eventType) return;
    if (eventType.eventType.locale === 'en') return `/event-types/${eventType.eventType.slug}`;
    if (eventType.eventType.locale !== 'en') {
      const enEntry = eventType.eventType.localizations.find(loc => loc.locale === 'en');
      return enEntry ? `/event-types/${enEntry.slug}` : `/event-types/${eventType.eventType.slug}`;
    }
  }

  const isEventTypeActive = (docId: string) => {
    let active = false;
    const eventType = headerData?.eventTypes.find((et) => et.eventType.documentId === docId);
    if (!eventType) return false;
    // Active when on the event type landing page
    if (eventType.eventType.locale === 'en') active = pathname.endsWith(`/event-types/${eventType.eventType.slug}`);
    if (eventType.eventType.locale !== 'en') {
      const enEntry = eventType.eventType.localizations.find(loc => loc.locale === 'en');
      if (enEntry ? pathname.endsWith(`/event-types/${enEntry.slug}`) : pathname.endsWith(`/event-types/${eventType.eventType.slug}`)) active = true;
    }

    // Also consider service pages filtered by eventType query param
    if (eventTypeQuery && pathname.includes('/service/')) {
      const q = decodeURIComponent(eventTypeQuery);
      const nameLocal = eventType.eventType.eventName;
      const enLoc = eventType.eventType.locale === 'en' ? eventType.eventType : eventType.eventType.localizations.find(l => l.locale === 'en');
      const nameEn = enLoc?.eventName || "";
      if (q && (q === nameLocal || q === nameEn || nameLocal.includes(q) || nameEn.includes(q))) active = true;
    }
    return active;
  };

  return (
    <header className="sticky top-0 z-30">
      <div className="w-full bg-white shadow-sm px-2.5 md:px-4 py-2 ">
        <div className="max-w-screen lg:max-w-[1700px] mx-auto flex items-center justify-between">
          {/* Left: Logo and Nav */}
          <div className="flex items-center gap-3 md:w-auto">
            <Logo
              variant="md"
              onClick={() => router.push("/")}
              priority
            />

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-3 md:ml-10">
              {headerData?.nav.categories.map((navItem) => {
                const href = getServiceUrl(navItem.documentId) as string;
                const isActive = pathname.endsWith(href);

                return (
                  <Link
                    key={navItem.id}
                    href={href}
                    className={`cursor-pointer px-3 py-2 rounded-sm transition-colors text-sm md:text-base capitalize ${isActive
                      ? "bg-primary text-white"
                      : "text-primary bg-white hover:bg-primary hover:text-white"
                      }`}
                  >
                    {navItem.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right: Language, Search, User, Mobile Toggle */}
          <div className="flex items-center gap-2 md:gap-4 lg:gap-5">
            <Select
              className="text-xs sm:text-sm md:text-base flex-1"
              value={selectedLocale}
              onChange={handleLocaleChange}
              options={SUPPORTED_LOCALES.map((code: string) => ({
                value: code,
                label: tLocales.has(code) ? tLocales(code) : code.toUpperCase(),
              }))}
            />
            {/* Search: hidden on xs, visible from sm */}
            <div className="hidden sm:block max-w-[140px] md:max-w-[200px] lg:max-w-full">
              <Search />
            </div>

            {/* User Icon */}
            <ProfileBtn loading={loading} user={user} />

            {/* Mobile Nav Toggle */}
            <button
              className="md:hidden flex items-center justify-center p-2 rounded focus:outline-none"
              aria-label={tHeader('openNav')}
              onClick={() => setMobileNavOpen(true)}
            >
              <FaBars className="text-xl text-primary" />
            </button>
          </div>

          {/* Mobile Nav Drawer */}
          {mobileNavOpen && (
            <div className="fixed inset-0 z-40 bg-black/40 flex overflow-hidden" style={{ height: '100dvh' }}>
              <div className="bg-white w-[90%] max-w-xs flex flex-col animate-slide-in-left" style={{ height: '100dvh' }}>
                <div className="p-4 md:p-5 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <Logo variant="sm" />
                    <button
                      className="p-2 rounded hover:bg-gray-100"
                      aria-label={tHeader('closeNav')}
                      onClick={() => setMobileNavOpen(false)}
                    >
                      <IoMdClose className="text-2xl text-primary" />
                    </button>
                  </div>
                  <div className="flex flex-col gap-2 mt-3 md:mt-4">
                    <Search />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 md:p-5 pt-0">
                  <nav className="flex flex-col gap-1">
                    {/* Main Navigation */}
                    {headerData?.nav.categories.map((navItem) => {
                      const href = getServiceUrl(navItem.documentId) as string;
                      const isActive = pathname.endsWith(href);
                      return (
                        <Link
                          href={href}
                          onClick={() => {
                            //close mobile menu
                            setMobileNavOpen(false)
                          }}
                          className={`cursor-pointer px-2.5 py-1.5 rounded-sm transition-colors text-primary capitalize bg-white hover:bg-primary hover:text-white ${isActive
                            ? "bg-primary"
                            : ""
                            }`}
                          key={navItem.id}
                        >
                          {navItem.name}
                        </Link>
                      );
                    })}

                    {/* Event Types Section */}
                    {Array.isArray(headerData?.eventTypes) &&
                      headerData.eventTypes.length > 0 && (
                        <>
                          <hr className="my-3 border-gray-300" />
                          <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide mb-1">
                            {tHeader('eventTypes')}
                          </p>
                          {headerData.eventTypes.map(({ id, eventType }) => {
                            const isActive = isEventTypeActive(eventType.documentId);
                            return (
                              <Link
                                onClick={() => {
                                  handleSelect("")
                                  //close mobile menu
                                  setMobileNavOpen(false)
                                }}
                                href={getEventTypeUrl(eventType.documentId) as string}
                                className={`cursor-pointer p-2.5 my-1 rounded-sm transition-colors text-primary bg-gray-100 hover:bg-primary hover:text-white ${isActive ? "bg-primary text-white" : ""}`}
                                key={id}
                              >
                                {eventType.eventName}
                              </Link>
                            );
                          })}

                          <Link onClick={() => {
                            handleSelect("Hot Deal")
                            //close mobile menu
                            setMobileNavOpen(false)
                          }}
                            className={`cursor-pointer p-2.5 my-1 rounded-sm transition-colors text-primary bg-gray-100 hover:bg-primary hover:text-white ${selected == "Hot Deal"
                              ? "bg-primary text-white"
                              : ""
                              }
                             
                          `}
                            href="/hot-deal"
                          >
                            {t('HotDeal')}
                          </Link>


                          <Link onClick={() => {
                            handleSelect("Map")
                            //close mobile menu
                            setMobileNavOpen(false)
                          }}
                            className={`cursor-pointer p-2.5 my-1 rounded-sm transition-colors text-primary bg-gray-100 hover:bg-primary hover:text-white ${selected == "Map" ? "bg-primary text-white" : ""
                              }
                             `}
                            href="/map"
                          >
                            {t('Map')}
                          </Link>


                        </>
                      )}
                  </nav>
                </div>
              </div>
              {/* Click outside to close */}
              <div className="flex-1" onClick={() => setMobileNavOpen(false)} />
            </div>
          )}

          {/* Slide animation */}
          <style jsx global>{`
          @keyframes slide-in-left {
            from {
              transform: translateX(-100%);
            }
            to {
              transform: translateX(0);
            }
          }
          .animate-slide-in-left {
            animation: slide-in-left 0.2s ease;
          }
        `}</style>
        </div>
      </div>
      {/* Subnav Bar: Desktop only */}
      {Array.isArray(headerData?.eventTypes) &&
        headerData.eventTypes.length > 0 && (
          <div className="hidden md:block w-full bg-gray-50 border-t border-b border-border px-2.5 md:px-4 py-2 z-20 overflow-x-auto">
            <div className="max-w-screen lg:max-w-[1700px] mx-auto flex flex-wrap items-center gap-1 md:gap-2">
              {headerData.eventTypes.map(({ id, eventType }) => {
                const isActive = isEventTypeActive(eventType.documentId);
                return (
                  <Link
                    key={id}
                    href={getEventTypeUrl(eventType.documentId) as string}
                    className={`cursor-pointer text-xs md:text-sm px-2 md:px-3 py-1 rounded-sm transition-colors whitespace-nowrap flex-shrink-0
                                    ${isActive
                        ? "bg-primary text-white"
                        : "text-primary hover:bg-primary hover:text-white"
                      }`}
                  >
                    {eventType.eventName}
                  </Link>
                );
              })}
              <Link
                className={`cursor-pointer text-xs md:text-sm px-2 md:px-3 py-1 rounded-sm transition-colors whitespace-nowrap flex-shrink-0 ${isHotDealActive()
                  ? "bg-primary text-white"
                  : "text-primary hover:bg-primary hover:text-white"
                  }`}
                href="/hot-deal"
              >
                {t('HotDeal')}
              </Link>
              <Link
                className={`cursor-pointer text-xs md:text-sm px-2 md:px-3 py-1 rounded-sm transition-colors whitespace-nowrap flex-shrink-0 ${isMapActive()
                  ? "bg-primary text-white"
                  : "text-primary hover:bg-primary hover:text-white"
                  }`}
                href="/map"
              >
                {t('Map')}
              </Link>
            </div>
          </div>
        )}
    </header>
  );
}

export default Header;
