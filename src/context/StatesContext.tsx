"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { fetchStates } from "@/services/common";

export type StateItem = {
  documentId: string;
  name: string;
  id: number;
  localizations: StateItem[];
  locale: string;
  priority: number;
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
        const res = await fetchStates('lt');
        setStates(res);
      } catch (e: unknown) {
        const message = e && typeof e === 'object' && 'message' in e ? String((e as { message?: unknown }).message) : "Failed to load states";
        setError(message);
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

