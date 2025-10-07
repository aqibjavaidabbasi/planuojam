'use client'

import { fetchSiteSettings } from "@/services/siteSettings";
import { SiteSettings } from "@/types/siteSettings";
import { createContext, ReactNode, useContext, useEffect, useState } from "react"

interface SiteSettingsContextProps {
    siteSettings: SiteSettings;
}


const SiteSettingsContext = createContext<SiteSettingsContextProps | undefined>(undefined);

export const SiteSettingsProvider = ({ children }: { children: ReactNode }) => {
    const [siteSettings, setSiteSettings] = useState<SiteSettings | undefined>();

    useEffect(function () {
        async function fetchSettings() {
            const res = await fetchSiteSettings();
            setSiteSettings(res);
        }
        fetchSettings();
    }, [])

    if (!siteSettings) {
        // Optionally, you can render a loading state or null
        return null;
    }

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