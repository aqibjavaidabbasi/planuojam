"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { fetchStates } from "@/services/common";

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

  useEffect(() => {
    const run = async () => {
      setIsLoading(true);
      try {
        const res = await fetchStates();
        const normalized: StateItem[] = (res || []).map((s: any) => ({
          documentId: s.documentId ?? s.id ?? s?.state?.documentId,
          name: s.name ?? s?.state?.name ?? s?.attributes?.name,
        })).filter((s: StateItem) => s.documentId && s.name);
        setStates(normalized);
      } catch (e: any) {
        setError(e?.message || "Failed to load states");
      } finally {
        setIsLoading(false);
      }
    };
    run();
  }, []);

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
