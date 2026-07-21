"use client";

import { useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { DayPicker } from "react-day-picker";
import { es } from "react-day-picker/locale";
import "react-day-picker/style.css";
import { IconCalendar } from "@/components/icons";

// Fecha y hora con Radix Popover (portal, sin recortes, cierra por click-fuera/
// Esc) + react-day-picker. Emite "YYYY-MM-DDTHH:mm" (compatible con el countdown).
const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const MINUTES = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];
const pad = (n: number) => String(n).padStart(2, "0");

function parse(v: string): { date: Date; h: number; mi: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(v || "");
  return m ? { date: new Date(+m[1], +m[2] - 1, +m[3]), h: +m[4], mi: +m[5] } : null;
}
const compose = (d: Date, h: number, mi: number) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(h)}:${pad(mi)}`;

export function DateTimeField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const parsed = parse(value);
  const [date, setDate] = useState<Date | undefined>(parsed?.date);
  const [h, setH] = useState(parsed?.h ?? 20);
  const [mi, setMi] = useState(parsed?.mi ?? 0);

  const emit = (d: Date | undefined, nh: number, nmi: number) => {
    if (d) onChange(compose(d, nh, nmi));
  };

  const h12 = ((h + 11) % 12) + 1;
  const ampm = h < 12 ? "AM" : "PM";
  const setTime = (nh12: number, nmi: number, nap: string) => {
    const h24 = nap === "PM" ? (nh12 % 12) + 12 : nh12 % 12;
    setH(h24);
    setMi(nmi);
    emit(date, h24, nmi);
  };

  const label = date ? `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()} · ${h12}:${pad(mi)} ${ampm}` : "Selecciona fecha y hora";
  const selectCls = "rounded-lg border border-line px-2 py-1.5 text-sm outline-none focus:border-coral";

  return (
    <Popover.Root>
      <Popover.Trigger className="flex w-full items-center gap-2 rounded-xl border border-line px-3 py-2 text-left outline-none focus:border-coral">
        <IconCalendar className="h-4 w-4 text-ink/50" />
        <span className={date ? "" : "text-ink/40"}>{label}</span>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={8}
          className="dd-content z-50 rounded-2xl border border-line bg-white p-3 shadow-xl"
          style={
            {
              "--rdp-accent-color": "var(--color-coral)",
              "--rdp-accent-background-color": "var(--color-lilac)",
              "--rdp-today-color": "var(--color-coral-deep)",
              "--rdp-day-width": "2.25rem",
              "--rdp-day-height": "2.25rem",
            } as React.CSSProperties
          }
        >
          <DayPicker
            mode="single"
            locale={es}
            selected={date}
            defaultMonth={date}
            onSelect={(d) => {
              setDate(d);
              emit(d, h, mi);
            }}
          />

          <div className="flex items-center gap-2 border-t border-line pt-3">
            <span className="text-xs font-medium text-ink/60">Hora:</span>
            <select value={h12} onChange={(e) => setTime(+e.target.value, mi, ampm)} className={selectCls}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <select value={pad(mi)} onChange={(e) => setTime(h12, +e.target.value, ampm)} className={selectCls}>
              {MINUTES.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <select value={ampm} onChange={(e) => setTime(h12, mi, e.target.value)} className={selectCls}>
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
          </div>

          <Popover.Close className="mt-3 w-full rounded-full bg-coral px-4 py-2 text-sm font-semibold text-white hover:bg-coral-deep">
            Listo
          </Popover.Close>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
