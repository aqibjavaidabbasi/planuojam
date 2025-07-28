
'use client';

import { fetchEventTypes } from '@/services/common';
import { eventType } from '@/types/pagesTypes';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface EventTypesContextProps {
  eventTypes: eventType[];
  getEventTypeBySlug: (slug: string) => eventType | undefined;
}

const EventTypesContext = createContext<EventTypesContextProps | undefined>(undefined);

export const useEventTypes = () => {
  const context = useContext(EventTypesContext);
  if (!context) throw new Error('useEventTypes must be used within EventTypesProvider');
  return context;
};

export const EventTypesProvider = ({ children }: { children: ReactNode }) => {
  const [eventTypes, setEventTypes] = useState<eventType[]>([]);

  useEffect(() => {
    const fetchEvent = async () => {
     const res = await fetchEventTypes();
      setEventTypes(res);
    };

    fetchEvent();
  }, []);

  const getEventTypeBySlug = (slug: string) =>
    eventTypes.find((type) => type.slug === slug);

  return (
    <EventTypesContext.Provider value={{ eventTypes, getEventTypeBySlug }}>
      {children}
    </EventTypesContext.Provider>
  );
};
