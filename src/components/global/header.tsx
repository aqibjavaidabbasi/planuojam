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

function Header({ headerData }: { headerData: HeaderType }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const isHotDealActive = () => pathname.endsWith("/hot-deal");
  const isMapActive = () => pathname.endsWith("/map");
  const user = useAppSelector((state: RootState) => state.auth.user);
  const [loading, setLoading] = useState(false);
  const [selectedLocale, setSelectedLocale] = useState<string>(DEFAULT_LOCALE);
  const [selected, setSelected] = useState("");
  const handleSelect = (val: string) => {
    setSelected(val);
  };
  const t = useTranslations("hotdealstatic")
  const tLocales = useTranslations("Global.Locales")
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
    if (!user?.documentId) return;
    // Fetch liked listings when user id becomes available
    dispatch(fetchLikedListing({ userId: user.documentId, locale: 'en' }))
      .unwrap()
      .catch(() => { });
  }, [dispatch, user?.documentId]);

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
    document.body.style.overflow = mobileNavOpen ? "hidden" : "auto";
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
    const eventType = headerData?.eventTypes.find((et) => et.eventType.documentId === docId);
    if (!eventType) return false;
    if (eventType.eventType.locale === 'en') return pathname.endsWith(`/event-types/${eventType.eventType.slug}`);
    if (eventType.eventType.locale !== 'en') {
      const enEntry = eventType.eventType.localizations.find(loc => loc.locale === 'en');
      return enEntry ? pathname.endsWith(`/event-types/${enEntry.slug}`) : pathname.endsWith(`/event-types/${eventType.eventType.slug}`);
    }
  };

  return (
    <header className="sticky top-0 z-30">
      <div className="w-full bg-white shadow-sm px-2.5 md:px-4 py-2 ">
        <div className="max-w-screen lg:max-w-[1700px] mx-auto flex items-center justify-between">
          {/* Left: Logo and Nav */}
          <div className="flex items-center gap-3 w-full md:w-auto">
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
          <div className="flex items-center gap-2 md:gap-3">
            <div>
              <Select
                className="text-sm md:text-base"
                value={selectedLocale}
                onChange={handleLocaleChange}
                options={SUPPORTED_LOCALES.map((code: string) => ({
                  value: code,
                  label: tLocales.has(code) ? tLocales(code) : code.toUpperCase(),
                }))}
              />
            </div>
            {/* Search: hidden on xs, visible from sm */}
            <div className="hidden sm:block max-w-[160px] md:max-w-full">
              <Search />
            </div>

            {/* User Icon */}
            <ProfileBtn loading={loading} user={user} />

            {/* Mobile Nav Toggle */}
            <button
              className="md:hidden flex items-center justify-center p-2 rounded focus:outline-none"
              aria-label="Open navigation menu"
              onClick={() => setMobileNavOpen(true)}
            >
              <FaBars className="text-xl text-primary" />
            </button>
          </div>

          {/* Mobile Nav Drawer */}
          {mobileNavOpen && (
            <div className="fixed inset-0 z-40 bg-black/40 flex overflow-y-hidden">
              <div className="bg-white w-[90%] max-w-xs h-full p-5 flex flex-col gap-4 animate-slide-in-left overflow-y-auto">
                <div className="flex items-center justify-between">
                  <Logo variant="sm" />
                  <button
                    className="p-2 rounded hover:bg-gray-100"
                    aria-label="Close navigation menu"
                    onClick={() => setMobileNavOpen(false)}
                  >
                    <IoMdClose className="text-2xl text-primary" />
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  <Search />
                </div>
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
                          Event Types
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
          <div className="hidden md:flex w-full bg-gray-50 border-t border-b border-border px-4 py-2 gap-2 z-20">
            <div className="max-w-screen lg:max-w-[1700px] mx-auto">
              {headerData.eventTypes.map(({ id, eventType }) => {
                const isActive = isEventTypeActive(eventType.documentId);
                return (
                  <Link
                    key={id}
                    href={getEventTypeUrl(eventType.documentId) as string}
                    className={`cursor-pointer text-sm px-3 mx-1 py-1 rounded-sm transition-colors
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
                className={`cursor-pointer text-sm px-3  mx-1 py-1 rounded-sm transition-colors ${isHotDealActive()
                  ? "bg-primary text-white"
                  : "text-primary hover:bg-primary hover:text-white"
                  }`}
                href="/hot-deal"
              >
                {t('HotDeal')}
              </Link>
              <Link
                className={`cursor-pointer text-sm px-3 py-1 rounded-sm transition-colors ${isMapActive()
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
