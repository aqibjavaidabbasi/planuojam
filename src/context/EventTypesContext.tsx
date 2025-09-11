'use client';

import { fetchEventTypes } from '@/services/common';
import { EventTypes } from '@/types/pagesTypes';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocale } from 'next-intl';

interface EventTypesContextProps {
  eventTypes: EventTypes[];
  getEventTypeBySlug: (slug: string) => EventTypes | undefined;
  getEventTypeByDocId: (docId: string) => EventTypes | undefined;
  localizedEventTypes: EventTypes[];
}

const EventTypesContext = createContext<EventTypesContextProps | undefined>(undefined);

export const useEventTypes = () => {
  const context = useContext(EventTypesContext);
  if (!context) throw new Error('useEventTypes must be used within EventTypesProvider');
  return context;
};

export const EventTypesProvider = ({ children }: { children: ReactNode }) => {
  const [eventTypes, setEventTypes] = useState<EventTypes[]>([]);
  const locale = useLocale();

  useEffect(() => {
    const fetchEvent = async () => {
     const res = await fetchEventTypes('en'); //always fetch data in english for ease of use
      setEventTypes(res);
    };

    fetchEvent();
  }, [locale]);

  const getEventTypeBySlug = (slug: string) =>{
    return eventTypes.find(type => type.slug === slug);
  }

  const getEventTypeByDocId = (docId: string) => {
   return eventTypes.find(type => type.documentId === docId);
  }

  const localizedEventTypes = eventTypes.map(eventType => {
    const localized = eventType.localizations.find(loc => loc.locale === locale);
    return localized ? { ...eventType, ...localized } : eventType;
  });

  return (
    <EventTypesContext.Provider value={{ 
      eventTypes, 
      getEventTypeBySlug, 
      getEventTypeByDocId,
      localizedEventTypes
    }}>
      {children}
    </EventTypesContext.Provider>
  );
};
