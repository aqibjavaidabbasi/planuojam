'use client'
import { header as HeaderType } from '@/types/pagesTypes';
import { strapiImage } from '@/types/common';
import Image from 'next/image';
import React, { useState } from 'react'
import Search from '../custom/Search';
import { getCompleteImageUrl } from '@/utils/helpers';
import { FaRegUser, FaBars } from 'react-icons/fa';
import { IoMdClose } from 'react-icons/io';
import { usePathname, useRouter } from 'next/navigation';

function Header({ logo, headerData }: { logo: strapiImage; headerData: HeaderType }) {
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const imageUrl = getCompleteImageUrl(logo.url);
    const router = useRouter();
    const pathname = usePathname();

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
                        onClick={()=>router.push('/home')}
                        className="w-10 h-10 md:w-[95px] md:h-[60px] object-contain cursor-pointer"
                        priority
                    />

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-3 md:ml-10">
                        {headerData?.nav.item.map((navItem) => {
                            const openInNewTab = navItem.target?.toLowerCase().includes("_blank");
                            const isActive = pathname === navItem.relativeUrl;

                            const handleClick = () => {
                                if (openInNewTab) {
                                    window.open(navItem.relativeUrl, "_blank");
                                } else {
                                    router.push(navItem.relativeUrl);
                                }
                            };

                            return (
                                <div
                                    key={navItem.id}
                                    className={`cursor-pointer px-3 py-2 rounded-sm transition-colors text-sm md:text-base capitalize 
                                        ${isActive ? "bg-primary text-white" : "text-primary bg-white hover:bg-primary hover:text-white"}`}
                                    onClick={handleClick}
                                >
                                    {navItem.label}
                                </div>
                            );
                        })}
                    </nav>
                </div>

                {/* Right: Language, Search, User, Mobile Toggle */}
                <div className="flex items-center gap-2 md:gap-3">
                    {/* Language Selector */}
                    <select className="bg-white border custom-border-color rounded-md h-9 px-2 text-sm md:text-base">
                        <option value="">English</option>
                        <option value="">Lietuvių</option>
                    </select>

                    {/* Search: hidden on xs, visible from sm */}
                    <div className="hidden sm:block max-w-[160px] md:max-w-full">
                        <Search />
                    </div>

                    {/* User Icon */}
                    <div className="border border-primary rounded-full p-2 cursor-pointer group hover:bg-primary transition-colors">
                        <FaRegUser className="text-primary group-hover:text-white text-sm md:text-base" />
                    </div>

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
                                {headerData?.nav.item.map(navItem => (
                                    <div
                                        className="cursor-pointer text-primary bg-white hover:bg-primary hover:text-white p-2.5 rounded-sm transition-colors"
                                        key={navItem.id}
                                        onClick={() => setMobileNavOpen(false)}
                                    >
                                        {navItem.label}
                                    </div>
                                ))}

                                {/* Event Types Section */}
                                {Array.isArray(headerData?.eventTypes) && headerData.eventTypes.length > 0 && (
                                    <>
                                        <hr className="my-3 border-gray-300" />
                                        <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide mb-1">
                                            Event Types
                                        </p>
                                        {headerData.eventTypes.map(({ id, eventType }) => (
                                            <div
                                                className="cursor-pointer text-primary bg-gray-100 hover:bg-primary hover:text-white p-2.5 rounded-sm transition-colors"
                                                key={id}
                                                onClick={() => {
                                                    router.push(`/event-types/${eventType.slug}`)
                                                    setMobileNavOpen(false)
                                                }}
                                            >
                                                {eventType.eventName}
                                            </div>
                                        ))}
                                    </>
                                )}
                            </nav>

                            <div className="mt-4 flex flex-col gap-2">
                                <select className="bg-white border custom-border-color rounded-md h-9 px-2 text-sm">
                                    <option value="">English</option>
                                    <option value="">Lietuvių</option>
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
                <div className="hidden md:flex w-full bg-gray-50 border-t border-b custom-border-color px-4 py-2 gap-2 z-20">
                    {headerData.eventTypes.map(({ id, eventType }) => (
                        <div
                            key={id}
                            className="cursor-pointer text-sm text-primary hover:bg-primary hover:text-white px-3 py-1 rounded-sm transition-colors"
                            onClick={() => {
                                router.push(`/event-types/${eventType.slug}`)
                                setMobileNavOpen(false)
                            }}
                        >
                            {eventType.eventName}
                        </div>
                    ))}
                </div>
            )}
        </header>
    );
}

export default Header;
