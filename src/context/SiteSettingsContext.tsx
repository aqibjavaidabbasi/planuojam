'use client'

import { fetchSiteSettings } from "@/services/siteSettings";
import { SiteSettings } from "@/types/siteSettings";
import { createContext, ReactNode, useContext, useEffect, useState } from "react"

interface SiteSettingsContextProps {
    siteSettings: SiteSettings | undefined;
}


const SiteSettingsContext = createContext<SiteSettingsContextProps | undefined>(undefined);

export const SiteSettingsProvider = ({
    children,
    initialSiteSettings,
}: {
    children: ReactNode;
    initialSiteSettings?: SiteSettings;
}) => {
    const [siteSettings, setSiteSettings] = useState<SiteSettings | undefined>(initialSiteSettings);

    // Only needed when the server render couldn't supply settings (e.g. Strapi unreachable).
    useEffect(function () {
        if (siteSettings) return;
        fetchSiteSettings()
            .then(setSiteSettings)
            .catch((error) => console.error('Failed to fetch site settings:', error));
    }, [siteSettings])

    // This used to `return null` until a client-side fetch resolved. Because the provider
    // wraps the whole app, every page's server-rendered <body> was empty — no headings, no
    // links, no text for crawlers. Always render children; consumers handle undefined.
    return (
        <SiteSettingsContext.Provider value={{ siteSettings }}>
            {children}
        </SiteSettingsContext.Provider>
    );
}

export const useSiteSettings = () => {
    const context = useContext(SiteSettingsContext);
    if (!context) throw new Error('Site Settings context must be used within site settings context provider');
    return context;
}
