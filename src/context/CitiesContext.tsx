"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { fetchCities } from "@/services/common";
import { useLocale } from "next-intl";

export type City = {
  documentId: string;
  name: string;
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
        // Normalize result -> expecting array of items with { documentId, name }
        const array = Array.isArray(res) ? res : [];
        const normalized: City[] = array
          .map((c: unknown) => {
            if (c && typeof c === 'object') {
              const obj = c as Record<string, unknown>;
              const nestedCity = (obj.city && typeof obj.city === 'object') ? (obj.city as Record<string, unknown>) : undefined;
              const attributes = (obj.attributes && typeof obj.attributes === 'object') ? (obj.attributes as Record<string, unknown>) : undefined;
              const documentId = String(obj.documentId ?? obj.id ?? nestedCity?.documentId ?? "");
              const name = String(obj.name ?? nestedCity?.name ?? attributes?.name ?? "");
              return { documentId, name } as City;
            }
            return { documentId: "", name: "" } as City;
          })
          .filter((c) => Boolean(c.documentId) && Boolean(c.name));
        setCities(normalized);
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

