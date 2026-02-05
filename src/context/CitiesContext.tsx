"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { fetchCities } from "@/services/common";
import { useLocale } from "next-intl";

export type City = {
  documentId: string;
  name: string;
  id: number;
  locale: string;
  localizations: City[]
  priority: number;
};

interface CitiesContextProps {
  cities: City[];
  isLoading: boolean;
  error: string | null;
}

const CitiesContext = createContext<CitiesContextProps | undefined>(undefined);

export const CitiesProvider: React.FC<React.PropsWithChildren<object>> = ({ children }) => {
  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const locale = useLocale();

  useEffect(() => {
    const run = async () => {
      setIsLoading(true);
      try {
        const res = await fetchCities(locale);
        setCities(res);
      } catch (e: unknown) {
        const message = e && typeof e === 'object' && 'message' in e ? String((e as { message?: unknown }).message) : "Failed to load cities";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };
    run();
  }, [locale]);

  return (
    <CitiesContext.Provider value={{ cities, isLoading, error }}>
      {children}
    </CitiesContext.Provider>
  );
};

export const useCities = () => {
  const ctx = useContext(CitiesContext);
  if (!ctx) throw new Error("useCities must be used within CitiesProvider");
  return ctx;
};

