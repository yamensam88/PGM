"use client";

import React, { useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import multiMonthPlugin from "@fullcalendar/multimonth";
import frLocale from "@fullcalendar/core/locales/fr";

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date | string;
  end?: Date | string;
  allDay?: boolean;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  extendedProps?: any;
}

interface GlobalCalendarProps {
  events: CalendarEvent[];
}

export function GlobalCalendar({ events }: GlobalCalendarProps) {
  const calendarRef = useRef<FullCalendar>(null);

  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm calendar-wrapper relative z-10">
      <style dangerouslySetInnerHTML={{__html: `
        .calendar-wrapper .fc-theme-standard td, .calendar-wrapper .fc-theme-standard th { border-color: var(--color-slate-200); }
        .dark .calendar-wrapper .fc-theme-standard td, .dark .calendar-wrapper .fc-theme-standard th { border-color: var(--color-slate-800); }
        .calendar-wrapper .fc-col-header-cell { padding: 8px 0; background-color: var(--color-slate-50); color: var(--color-slate-600); font-size: 0.875rem; text-transform: uppercase; font-weight: 700; }
        .dark .calendar-wrapper .fc-col-header-cell { background-color: var(--color-slate-800); color: var(--color-slate-300); }
        .calendar-wrapper .fc-event { border: none !important; margin: 1px 2px; }
        .calendar-wrapper .fc-button-primary { background-color: #3b82f6 !important; border-color: #3b82f6 !important; text-transform: capitalize; font-weight: 600; }
        .calendar-wrapper .fc-button-primary:hover { background-color: #2563eb !important; }
        .calendar-wrapper .fc-button-active { background-color: #1d4ed8 !important; }
        .calendar-wrapper .fc-multimonth-title { font-weight: bold; color: var(--color-slate-700); }
        .dark .calendar-wrapper .fc-multimonth-title { color: var(--color-slate-200); }
      `}} />
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, multiMonthPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "multiMonthYear,dayGridMonth"
        }}
        buttonText={{
          year: "Année",
          month: "Mois",
          today: "Aujourd'hui"
        }}
        locales={[frLocale]}
        locale="fr"
        events={events}
        height="auto"
        selectable={true}
        eventClassNames="rounded px-2 py-1 text-xs font-bold text-white shadow-sm overflow-hidden"
        dayMaxEvents={true}
      />
    </div>
  );
}
