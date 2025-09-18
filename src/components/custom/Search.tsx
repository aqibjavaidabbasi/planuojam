'use client'
import { useTranslations } from 'next-intl';
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { IoSearchOutline } from 'react-icons/io5'
import { Link, usePathname } from '@/i18n/navigation';
import { fetchListingSuggestions } from '@/services/common';

type Suggestion = { title: string; slug: string };

function Search() {
    const [isFocused, setIsFocused] = useState(false);
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<Suggestion[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [noHitPrefix, setNoHitPrefix] = useState<string>('');
    const t = useTranslations('Search');
    const pathname = usePathname();
    const containerRef = useRef<HTMLDivElement>(null);

    // Detect current locale from the first URL segment
    const currentLocale = useMemo(() => {
        const seg = pathname.split('/')[1] || 'en';
        return seg;
    }, [pathname]);

    // Close dropdown on outside click
    useEffect(() => {
        function onDocClick(e: MouseEvent) {
            if (!containerRef.current) return;
            if (!containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', onDocClick);
        return () => document.removeEventListener('mousedown', onDocClick);
    }, []);

    // Debounced fetch of suggestions
    useEffect(() => {
        const q = query.trim();
        if (!isFocused) return; // only fetch while focused

        if (q.length < 3) {
            setResults([]);
            setOpen(false);
            setNoHitPrefix('');
            return;
        }

        // If we already got no results for a prefix and user keeps extending it, skip requests
        if (noHitPrefix && q.startsWith(noHitPrefix) && q.length >= noHitPrefix.length) {
            setResults([]);
            setOpen(true);
            return;
        }

        setLoading(true);
        setError(null);
        const handle = setTimeout(async () => {
            try {
                const res = await fetchListingSuggestions(q, currentLocale, 8);
                setResults(res);
                setOpen(true);
                if (!res || res.length === 0) {
                    // Record this prefix to avoid further requests until user deletes
                    setNoHitPrefix(q);
                } else if (noHitPrefix) {
                    // Clear no-hit lockout if we now have data
                    setNoHitPrefix('');
                }
            } catch (err) {
                setError('failed');
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(handle);
    }, [query, isFocused, currentLocale, noHitPrefix]);

    const onInputFocus = () => {
        setIsFocused(true);
        if (query.trim().length >= 3) setOpen(true);
    };
    const onInputBlur = () => {
        setIsFocused(false);
        // Do not force close here; outside click handler will manage it
    };

    return (
        <div className='relative w-full' ref={containerRef}>
            <input
                type="search"
                className="bg-white w-full p-1 border border-border rounded-lg h-9 pl-8 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={t('searchListings') || t('search')}
                value={query}
                onChange={(e) => {
                    const val = e.target.value;
                    // If user deletes such that it no longer starts with noHitPrefix, clear it
                    if (noHitPrefix && !val.startsWith(noHitPrefix)) {
                        setNoHitPrefix('');
                    }
                    setQuery(val);
                }}
                onFocus={onInputFocus}
                onBlur={onInputBlur}
                onKeyDown={(e) => {
                    if (e.key === 'Escape') setOpen(false);
                }}
            />
            <div className='absolute left-1 top-1/2 -translate-y-1/2 h-full flex items-center justify-center'>
                <IoSearchOutline
                    className={isFocused ? 'text-primary' : 'text-gray-400'}
                    size={24}
                />
            </div>

            {open && (
                <div className="absolute mt-1 left-0 right-0 bg-white border border-border rounded-md shadow-lg z-50 overflow-hidden">
                    {loading && (
                        <div className="px-3 py-2 text-sm text-gray-500">{t('loading')}</div>
                    )}
                    {!loading && error && (
                        <div className="px-3 py-2 text-sm text-red-500">{t('error')}</div>
                    )}
                    {!loading && !error && results.length === 0 && (
                        <div className="px-3 py-2 text-sm text-gray-500">{t('noResults')}</div>
                    )}
                    {!loading && !error && results.length > 0 && (
                        <ul className="max-h-72 overflow-y-auto">
                            {results.map(({ title, slug }, idx) => (
                                <li key={`${slug}-${idx}`} className="border-b border-gray-100 last:border-0">
                                    <Link
                                        href={`/listing/${slug}`}
                                        className="block px-3 py-2 text-sm hover:bg-gray-50"
                                        onClick={() => {
                                            setOpen(false);
                                        }}
                                    >
                                        <span className="truncate block max-w-full" title={title}>
                                            {title}
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    )

}

export default Search