"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { DatesSetArg } from "@fullcalendar/core";
import { getListingBookingsPublic, BookingItem } from "@/services/booking";
import { useLocale, useTranslations } from "next-intl";
import timeGridPlugin from "@fullcalendar/timegrid";
import multiMonthPlugin from "@fullcalendar/multimonth";


interface ListingCalendarProps {
  listingDocumentId: string;
}

type BackgroundEvent = { start: string; end: string; display: "background"; allDay: boolean };

// Expand a booking into per-day background events (shades the entire day)
function expandBookingToDayBackgrounds(b: BookingItem): BackgroundEvent[] {
  try {
    const start = new Date(b.startDateTime);
    const end = new Date(b.endDateTime); // exclusive logic handled per-day below
    // Generate each date between start and end-1 day
    const days: { start: string; end: string; display: "background"; allDay: boolean }[] = [];
    const cur = new Date(start);
    cur.setHours(0, 0, 0, 0);
    // iterate until cur < end
    while (cur.getTime() < end.getTime()) {
      const dayStart = new Date(cur);
      const dayEnd = new Date(cur);
      dayEnd.setDate(dayEnd.getDate() + 1);
      days.push({
        start: dayStart.toISOString(),
        end: dayEnd.toISOString(),
        display: "background",
        allDay: true,
      });
      cur.setDate(cur.getDate() + 1);
    }
    return days;
  } catch {
    return [];
  }
}

const ListingCalendar: React.FC<ListingCalendarProps> = ({ listingDocumentId }) => {
  const [events, setEvents] = useState<BackgroundEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const currentRange = useRef<{ start: string; end: string } | null>(null);
  const t = useTranslations("Listing.Calendar");
  const locale = useLocale();

  const fetchRange = useCallback(async (rangeStartISO: string, rangeEndISO: string) => {
    try {
      setLoading(true);
      const bookings = await getListingBookingsPublic(listingDocumentId, rangeStartISO, rangeEndISO);
      const backgroundEvents = (bookings || []).flatMap(expandBookingToDayBackgrounds);
      setEvents(backgroundEvents);
    } catch {
      // if public fetch fails (e.g., 401), show empty calendar gracefully
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [listingDocumentId]);

  const onDatesSet = useCallback((arg: DatesSetArg) => {
    const startISO = arg.start.toISOString();
    const endISO = arg.end.toISOString();
    currentRange.current = { start: startISO, end: endISO };
    fetchRange(startISO, endISO);
  }, [fetchRange]);

  // initial fetch safeguard
  useEffect(() => {
    if (!currentRange.current) return;
    fetchRange(currentRange.current.start, currentRange.current.end);
  }, [listingDocumentId, fetchRange]);

  // responsive media listener
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(max-width: 640px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    // initialize
    setIsMobile(mql.matches);
    // subscribe
    mql.addEventListener('change', handler);
    return () => {
      mql.removeEventListener('change', handler);
    }; 
  }, []);

  const headerToolbar = useMemo(() => (
    isMobile
      ? {
          left: 'prev,next',
          center: 'title',
          right: 'today',
        }
      : {
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay,multiMonthYear',
        }
  ), [isMobile]);

  return (
    <div className="bg-white rounded-xl shadow-sm p-3 md:p-4 lg:p-6">
      <h2 className="text-2xl font-semibold text-primary mb-4">{t("availability", { default: "Availability" })}</h2>
      <div className="w-full overflow-x-auto">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, multiMonthPlugin, interactionPlugin]}
          initialView={isMobile ? 'dayGridMonth' : 'dayGridMonth'}
          headerToolbar={headerToolbar}
          locale={locale}
          height="auto"
          expandRows
          events={events}
          selectable={false}
          selectMirror={false}
          dayMaxEvents={true}
          datesSet={onDatesSet}
          // soften background color via CSS variable
          eventBackgroundColor="#cc922f" // red-200
          eventColor="#cc922f"
          eventDisplay="auto"
          buttonText={{
            today: t("today"),
            month: t("month"),
            week: t("week"),
            day: t("day"),
            year: t("year")
          }}

        />
      </div>
      {loading && (
        <div className="text-sm text-gray-500 mt-2">{t("loading", { default: "Loading calendar..." })}</div>
      )}
    </div>
  );
};

export default ListingCalendar;
