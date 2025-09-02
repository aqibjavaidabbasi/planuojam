'use client'
import { header as HeaderType } from '@/types/pagesTypes';
import Image from 'next/image';
import React, { useState } from 'react'
import Search from '../custom/Search';
import { getCompleteImageUrl } from '@/utils/helpers';
import { FaBars } from 'react-icons/fa';
import { IoMdClose } from 'react-icons/io';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import ProfileBtn from './ProfileBtn';
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchLikedListing } from '@/store/thunks/likedListing';
import { fetchUser } from '@/services/auth';
import { logout, setUser } from '@/store/slices/authSlice';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, LOCALE_OPTIONS } from '@/config/i18n';

function Header({ headerData }: { headerData: HeaderType }) {
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const { siteSettings } = useSiteSettings()
    const imageUrl = getCompleteImageUrl(siteSettings.siteLogo.url);
    const router = useRouter();
    const pathname = usePathname();
    const dispatch = useAppDispatch();
    const isNavActive = (url: string) => pathname === url;
    const isHotDealActive = () => pathname === '/hot-deal';
    const isMapActive = () => pathname === '/map';
    const isEventTypeActive = (slug: string) => pathname === `/event-types/${slug}`;
    const user = useAppSelector((state) => state.auth.user);
    const [loading, setLoading] = useState(false);
    const [selectedLocale, setSelectedLocale] = useState<string>(DEFAULT_LOCALE);


    useEffect(() => {
        const validateUser = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    setLoading(true);
                    const res = await fetchUser(token);
                    if (res) {
                        dispatch(setUser(res));
                    }
                } catch (error) {
                    console.error('Failed to fetch user:', error);
                    dispatch(logout())
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
        dispatch(fetchLikedListing(user.documentId)).unwrap().catch(() => {});
    }, [dispatch, user?.documentId]);

    // Initialize selected locale from localStorage or URL segment
    useEffect(() => {
        const stored = typeof window !== 'undefined' ? localStorage.getItem('locale') : null;
        if (stored && SUPPORTED_LOCALES.includes(stored)) {
            setSelectedLocale(stored);
            return;
        }
        // Detect from URL: '/{locale}/...' => first segment
        const seg = typeof window !== 'undefined' ? window.location.pathname.split('/')[1] : '';
        if (seg && SUPPORTED_LOCALES.includes(seg)) {
            setSelectedLocale(seg);
        } else {
            setSelectedLocale(DEFAULT_LOCALE);
        }
    }, []);

    // Keep selector in sync if user navigates to a different locale elsewhere
    useEffect(() => {
        const seg = typeof window !== 'undefined' ? window.location.pathname.split('/')[1] : '';
        if (seg && SUPPORTED_LOCALES.includes(seg) && seg !== selectedLocale) {
            setSelectedLocale(seg);
        }
    }, [pathname, selectedLocale]);

    const handleLocaleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const next = e.target.value;
        if (!SUPPORTED_LOCALES.includes(next)) return;
        setSelectedLocale(next);
        try {
            localStorage.setItem('locale', next);
        } catch {}
        // Navigate to same path under the new locale
        router.replace(pathname, { locale: next });
    };

    return (
        <header className='sticky top-0 z-30'>
            <div className="w-full bg-white shadow-sm px-4 py-2 flex items-center justify-between">
                {/* Left: Logo and Nav */}
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <Image
                        src={imageUrl}
                        alt="Planuojam Logo"
                        width={100}
                        height={100}
                        onClick={() => router.push('/')}
                        className="w-10 h-10 md:w-[95px] md:h-[60px] object-contain cursor-pointer"
                        priority
                    />

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-3 md:ml-10">
                        {headerData?.nav.item.map((navItem) => {
                            const isActive = isNavActive(navItem.relativeUrl);

                            return (
                                <Link
                                    key={navItem.id}
                                    href={navItem.relativeUrl}
                                    className={`cursor-pointer px-3 py-2 rounded-sm transition-colors text-sm md:text-base capitalize 
                                        ${isActive ? "bg-primary text-white" : "text-primary bg-white hover:bg-primary hover:text-white"}`}
                                >
                                    {navItem.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Right: Language, Search, User, Mobile Toggle */}
                <div className="flex items-center gap-2 md:gap-3">
                    <select
                        className="bg-white border border-border rounded-md h-9 px-2 text-sm md:text-base"
                        value={selectedLocale}
                        onChange={handleLocaleChange}
                    >
                        {LOCALE_OPTIONS.map((opt: { code: string; label: string }) => (
                            <option key={opt.code} value={opt.code}>
                                {opt.label}
                            </option>
                        ))}
                    </select>

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
                    <div className="fixed inset-0 z-40 bg-black bg-opacity-40 flex">
                        <div className="bg-white w-4/5 max-w-xs h-full p-5 flex flex-col gap-4 animate-slide-in-left overflow-y-auto">
                            <div className="flex items-center justify-between mb-4">
                                <Image
                                    src={imageUrl}
                                    alt="Planuojam Logo"
                                    width={40}
                                    height={40}
                                    className="w-10 h-10 object-contain"
                                />
                                <button
                                    className="p-2 rounded hover:bg-gray-100"
                                    aria-label="Close navigation menu"
                                    onClick={() => setMobileNavOpen(false)}
                                >
                                    <IoMdClose className="text-2xl text-primary" />
                                </button>
                            </div>
                            <nav className="flex flex-col gap-2">
                                {/* Main Navigation */}
                                {headerData?.nav.item.map(navItem => {
                                    const isActive = isNavActive(navItem.relativeUrl);
                                    return (
                                        <Link
                                            href={navItem.relativeUrl}
                                            className={`cursor-pointer p-2.5 rounded-sm transition-colors text-primary bg-white hover:bg-primary hover:text-white
                                                ${isActive ? "bg-primary text-white" : ""}`}
                                            key={navItem.id}
                                        >
                                            {navItem.label}
                                        </Link>
                                    );
                                })}

                                {/* Event Types Section */}
                                {Array.isArray(headerData?.eventTypes) && headerData.eventTypes.length > 0 && (
                                    <>
                                        <hr className="my-3 border-gray-300" />
                                        <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide mb-1">
                                            Event Types
                                        </p>
                                        {headerData.eventTypes.map(({ id, eventType }) => {
                                            const isActive = isEventTypeActive(eventType.slug);
                                            return (
                                                <Link
                                                    href={`/event-types/${eventType.slug}`}
                                                    className={`cursor-pointer p-2.5 rounded-sm transition-colors text-primary bg-gray-100 hover:bg-primary hover:text-white
                                                        ${isActive ? "bg-primary text-white" : ""}`}
                                                    key={id}
                                                >
                                                    {eventType.eventName}
                                                </Link>
                                            );
                                        })}
                                        <Link
                                            className={`cursor-pointer text-sm px-3 py-1 rounded-sm transition-colors not-only:${isHotDealActive() ? "bg-primary text-white" : "text-primary hover:bg-primary hover:text-white"}`}
                                            href="/hot-deal"
                                        >
                                            Hot Deal
                                        </Link>
                                        <Link
                                            className={`cursor-pointer text-sm px-3 py-1 rounded-sm transition-colors not-only:${isMapActive() ? "bg-primary text-white" : "text-primary hover:bg-primary hover:text-white"}`}
                                            href="/map"
                                        >
                                            Map
                                        </Link>
                                    </>
                                )}
                            </nav>

                            <div className="mt-4 flex flex-col gap-2">
                                <select
                                    className="bg-white border border-border rounded-md h-9 px-2 text-sm"
                                    value={selectedLocale}
                                    onChange={(e) => {
                                        handleLocaleChange(e);
                                        setMobileNavOpen(false);
                                    }}
                                >
                                    {LOCALE_OPTIONS.map((opt: { code: string; label: string }) => (
                                        <option key={opt.code} value={opt.code}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                                <Search />
                            </div>
                        </div>
                        {/* Click outside to close */}
                        <div className="flex-1" onClick={() => setMobileNavOpen(false)} />
                    </div>
                )}

                {/* Slide animation */}
                <style jsx global>{`
                @keyframes slide-in-left {
                    from { transform: translateX(-100%); }
                    to { transform: translateX(0); }
                }
                .animate-slide-in-left {
                    animation: slide-in-left 0.2s ease;
                }
            `}</style>
            </div>
            {/* Subnav Bar: Desktop only */}
            {Array.isArray(headerData?.eventTypes) && headerData.eventTypes.length > 0 && (
                <div className="hidden md:flex w-full bg-gray-50 border-t border-b border-border px-4 py-2 gap-2 z-20">
                    {headerData.eventTypes.map(({ id, eventType }) => {
                        const isActive = isEventTypeActive(eventType.slug);
                        return (
                            <Link
                                key={id}
                                href={`/event-types/${eventType.slug}`}
                                className={`cursor-pointer text-sm px-3 py-1 rounded-sm transition-colors
                                    ${isActive ? "bg-primary text-white" : "text-primary hover:bg-primary hover:text-white"}`}
                            >
                                {eventType.eventName}
                            </Link>
                        );
                    })}
                    <Link
                        className={`cursor-pointer text-sm px-3 py-1 rounded-sm transition-colors ${isHotDealActive() ? "bg-primary text-white" : "text-primary hover:bg-primary hover:text-white"}`}
                        href="/hot-deal"
                    >
                        Hot Deal
                    </Link>
                    <Link
                        className={`cursor-pointer text-sm px-3 py-1 rounded-sm transition-colors ${isMapActive() ? "bg-primary text-white" : "text-primary hover:bg-primary hover:text-white"}`}
                        href="/map"
                    >
                        Map
                    </Link>
                </div>
            )}

        </header>
    );
}

export default Header;
