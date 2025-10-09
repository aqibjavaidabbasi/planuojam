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


type Day = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

interface ListingCalendarProps {
  listingDocumentId: string;
  workingSchedule?: { day: Day; start: string; end: string }[];
}

type BackgroundEvent = { start: string; end: string; display: "background"; allDay: boolean; backgroundColor?: string };

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

const ListingCalendar: React.FC<ListingCalendarProps> = ({ listingDocumentId, workingSchedule = [] }) => {
  const [events, setEvents] = useState<BackgroundEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const currentRange = useRef<{ start: string; end: string } | null>(null);
  const currentViewType = useRef<string>("dayGridMonth");
  const t = useTranslations("Listing.Calendar");
  const locale = useLocale();

  const fetchRange = useCallback(async (rangeStartISO: string, rangeEndISO: string) => {
    try {
      setLoading(true);
      const bookings = await getListingBookingsPublic(listingDocumentId, rangeStartISO, rangeEndISO);
      const bookedBackgrounds = (bookings || []).flatMap(expandBookingToDayBackgrounds);

      // Build a set of booked day timestamps (midnight) to avoid overlaying availability on booked days
      const bookedDays = new Set<number>();
      bookedBackgrounds.forEach((ev) => {
        const d = new Date(ev.start);
        d.setHours(0,0,0,0);
        bookedDays.add(d.getTime());
      });

      // Compute availability/unavailability for each day in visible range
      const start = new Date(rangeStartISO);
      const end = new Date(rangeEndISO);
      const availabilityEvents: BackgroundEvent[] = [];

      const dayKey = (d: Date): Day => ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"][d.getDay()] as Day;
      const windowsForDay = (d: Date) => (workingSchedule || []).filter(w => w.day === dayKey(d));
      const hasWindows = (d: Date) => windowsForDay(d).length > 0;

      const red = "rgba(255, 99, 132, 0.6)"; // unavailable
      const green = "rgba(40, 167, 69, 0.6)"; // available

      const cur = new Date(start);
      // FullCalendar provides end as exclusive; iterate until cur < end
      while (cur.getTime() < end.getTime()) {
        const dayStart = new Date(cur);
        dayStart.setHours(0,0,0,0);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);
        const ts = dayStart.getTime();
        const inBooked = bookedDays.has(ts);
        // Month/year views: shade whole day green/red (unless booked which will overlay later)
        if (currentViewType.current === 'dayGridMonth' || currentViewType.current === 'multiMonthYear') {
          if (!inBooked) {
            const available = hasWindows(dayStart);
            availabilityEvents.push({
              start: dayStart.toISOString(),
              end: dayEnd.toISOString(),
              display: "background",
              allDay: true,
              backgroundColor: available ? green : red,
            });
          }
        } else {
          // Week/day views: create green blocks only for schedule windows; if no windows, full-day red
          const win = windowsForDay(dayStart);
          if (win.length === 0) {
            if (!inBooked) {
              availabilityEvents.push({
                start: dayStart.toISOString(),
                end: dayEnd.toISOString(),
                display: "background",
                allDay: true,
                backgroundColor: red,
              });
            }
          } else {
            // Add a background event per window for this day with green color
            for (const w of win) {
              const [sh, sm] = (w.start || '00:00').split(':').map(Number);
              const [eh, em] = (w.end || '00:00').split(':').map(Number);
              if ([sh, sm, eh, em].some(n => Number.isNaN(n))) continue;
              const wStart = new Date(dayStart);
              wStart.setHours(sh, sm || 0, 0, 0);
              const wEnd = new Date(dayStart);
              wEnd.setHours(eh, em || 0, 0, 0);
              availabilityEvents.push({
                start: wStart.toISOString(),
                end: wEnd.toISOString(),
                display: "background",
                allDay: false,
                backgroundColor: green,
              });
            }
          }
        }
        cur.setDate(cur.getDate() + 1);
      }

      setEvents([...availabilityEvents, ...bookedBackgrounds]);
    } catch {
      // if public fetch fails (e.g., 401), show empty calendar gracefully
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [listingDocumentId, workingSchedule]);

  const onDatesSet = useCallback((arg: DatesSetArg) => {
    const startISO = arg.start.toISOString();
    const endISO = arg.end.toISOString();
    currentViewType.current = arg.view?.type || currentViewType.current;
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
      <div className="flex items-center gap-3 mb-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="inline-block w-4 h-4 rounded-sm" style={{ backgroundColor: "rgba(0, 123, 255, 0.7)" }} />
          <span className="text-gray-600">{t("legend.booked", { default: "Booked (shaded days)" })}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-4 h-4 rounded-sm" style={{ backgroundColor: "rgba(255, 99, 132, 0.6)" }} />
          <span className="text-gray-600">{t("legend.unavailable", { default: "Unavailable (no working schedule)" })}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-4 h-4 rounded-sm" style={{ backgroundColor: "rgba(40, 167, 69, 0.6)" }} />
          <span className="text-gray-600">{t("legend.available", { default: "Available (has working schedule)" })}</span>
        </div>
      </div>
      <div className="w-full overflow-x-auto">
        <div className="calendar-center">
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
          eventBackgroundColor="rgba(0, 123, 255, 0.7)"
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
      </div>
      {loading && (
        <div className="text-sm text-gray-500 mt-2">{t("loading", { default: "Loading calendar..." })}</div>
      )}
    </div>
  );
};

export default ListingCalendar;
