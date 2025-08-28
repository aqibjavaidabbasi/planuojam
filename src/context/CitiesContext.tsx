"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { fetchCities } from "@/services/common";

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

  useEffect(() => {
    const run = async () => {
      setIsLoading(true);
      try {
        const res = await fetchCities();
        // Normalize result -> expecting array of items with { documentId, name }
        const normalized: City[] = (res || []).map((c: any) => ({
          documentId: c.documentId ?? c.id ?? c?.city?.documentId,
          name: c.name ?? c?.city?.name ?? c?.attributes?.name,
        })).filter((c: City) => c.documentId && c.name);
        setCities(normalized);
      } catch (e: any) {
        setError(e?.message || "Failed to load cities");
      } finally {
        setIsLoading(false);
      }
    };
    run();
  }, []);

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
