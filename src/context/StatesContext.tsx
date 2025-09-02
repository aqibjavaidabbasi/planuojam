"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { fetchStates } from "@/services/common";
import { useLocale } from "next-intl";

export type StateItem = {
  documentId: string;
  name: string;
};

interface StatesContextProps {
  states: StateItem[];
  isLoading: boolean;
  error: string | null;
}

const StatesContext = createContext<StatesContextProps | undefined>(undefined);

export const StatesProvider: React.FC<React.PropsWithChildren<object>> = ({ children }) => {
  const [states, setStates] = useState<StateItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const locale = useLocale();

  useEffect(() => {
    const run = async () => {
      setIsLoading(true);
      try {
        const res = await fetchStates(locale);
        const array = Array.isArray(res) ? res : [];
        const normalized: StateItem[] = array
          .map((s: unknown) => {
            if (s && typeof s === 'object') {
              const obj = s as Record<string, unknown>;
              const nested = (obj.state && typeof obj.state === 'object') ? (obj.state as Record<string, unknown>) : undefined;
              const attributes = (obj.attributes && typeof obj.attributes === 'object') ? (obj.attributes as Record<string, unknown>) : undefined;
              const documentId = String(obj.documentId ?? obj.id ?? nested?.documentId ?? "");
              const name = String(obj.name ?? nested?.name ?? attributes?.name ?? "");
              return { documentId, name } as StateItem;
            }
            return { documentId: "", name: "" } as StateItem;
          })
          .filter((s) => Boolean(s.documentId) && Boolean(s.name));
        setStates(normalized);
      } catch (e: unknown) {
        const message = e && typeof e === 'object' && 'message' in e ? String((e as { message?: unknown }).message) : "Failed to load states";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };
    run();
  }, [locale]);

  return (
    <StatesContext.Provider value={{ states, isLoading, error }}>
      {children}
    </StatesContext.Provider>
  );
};

export const useStates = () => {
  const ctx = useContext(StatesContext);
  if (!ctx) throw new Error("useStates must be used within StatesProvider");
  return ctx;
};

