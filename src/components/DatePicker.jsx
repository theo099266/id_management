import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { FaChevronLeft, FaChevronRight, FaCalendarAlt } from "react-icons/fa";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const POPUP_WIDTH = 320;
const VIEWPORT_MARGIN = 8;

// value / onChange use "YYYY-MM-DD" strings, same as a native date input
export default function DatePicker({ value, onChange, error, placeholder = "MM/DD/YYYY" }) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() =>
    value ? new Date(value + "T00:00:00") : new Date()
  );
  const [typedValue, setTypedValue] = useState("");
  const [showYearGrid, setShowYearGrid] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const wrapperRef = useRef(null);
  const popupRef = useRef(null);
  const inputRef = useRef(null);

  const selected = value ? new Date(value + "T00:00:00") : null;

  // keep the visible text in sync with the stored value (e.g. after picking from calendar)
  useEffect(() => {
    if (selected) {
      const mm = String(selected.getMonth() + 1).padStart(2, "0");
      const dd = String(selected.getDate()).padStart(2, "0");
      const yyyy = selected.getFullYear();
      setTypedValue(`${mm}/${dd}/${yyyy}`);
      setViewDate(selected);
    } else {
      setTypedValue("");
    }
  }, [value]);

  // position the popup relative to the input, fully clamped inside the viewport
  const updatePosition = () => {
    const el = wrapperRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();

    // use the real rendered height once available, otherwise a sane estimate
    const popupHeight = popupRef.current?.offsetHeight || 460;
    const popupWidth = popupRef.current?.offsetWidth || POPUP_WIDTH;

    // --- horizontal: prefer aligning to the input's left edge, then clamp ---
    let left = rect.left;
    const maxLeft = window.innerWidth - popupWidth - VIEWPORT_MARGIN;
    left = Math.min(left, maxLeft);
    left = Math.max(VIEWPORT_MARGIN, left);

    // --- vertical: prefer below, flip above if not enough room, then clamp ---
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    let top;
    if (spaceBelow >= popupHeight + VIEWPORT_MARGIN) {
      top = rect.bottom + VIEWPORT_MARGIN;
    } else if (spaceAbove >= popupHeight + VIEWPORT_MARGIN) {
      top = rect.top - popupHeight - VIEWPORT_MARGIN;
    } else {
      // neither side fully fits — pick whichever side has more room, then clamp
      top = spaceBelow >= spaceAbove ? rect.bottom + VIEWPORT_MARGIN : rect.top - popupHeight - VIEWPORT_MARGIN;
    }
    const maxTop = window.innerHeight - popupHeight - VIEWPORT_MARGIN;
    top = Math.min(top, maxTop);
    top = Math.max(VIEWPORT_MARGIN, top);

    setCoords({ top, left });
  };

  useLayoutEffect(() => {
    if (!open) return;
    // measure twice: once before paint (estimate), once after the popup has
    // actually rendered so we clamp against its real height, not a guess
    updatePosition();
    const raf = requestAnimationFrame(updatePosition);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, showYearGrid]);

  useEffect(() => {
    if (!open) return;
    const handleReposition = () => updatePosition();
    window.addEventListener("scroll", handleReposition, true);
    window.addEventListener("resize", handleReposition);
    return () => {
      window.removeEventListener("scroll", handleReposition, true);
      window.removeEventListener("resize", handleReposition);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    const handleClick = (e) => {
      const insideWrapper = wrapperRef.current?.contains(e.target);
      const insidePopup = popupRef.current?.contains(e.target);
      if (!insideWrapper && !insidePopup) {
        setOpen(false);
        setShowYearGrid(false);
        commitTyped(typedValue);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typedValue]);

  const startOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const startWeekday = startOfMonth.getDay();

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const toValue = (day) => {
    const y = viewDate.getFullYear();
    const m = String(viewDate.getMonth() + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const isSelected = (day) =>
    selected &&
    selected.getFullYear() === viewDate.getFullYear() &&
    selected.getMonth() === viewDate.getMonth() &&
    selected.getDate() === day;

  const isToday = (day) => {
    const t = new Date();
    return (
      t.getFullYear() === viewDate.getFullYear() &&
      t.getMonth() === viewDate.getMonth() &&
      t.getDate() === day
    );
  };

  const changeMonth = (delta) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + delta, 1));
  };

  const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);

  // Parse whatever the user typed. Accepts MM/DD/YYYY, MM-DD-YYYY, or YYYY-MM-DD.
  const parseTyped = (raw) => {
    const str = raw.trim();
    if (!str) return "";

    let m, d, y;

    let match = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (match) {
      [, m, d, y] = match;
    } else {
      match = str.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
      if (match) {
        [, y, m, d] = match;
      }
    }

    if (!match) return null;

    const mm = String(m).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    const test = new Date(`${y}-${mm}-${dd}T00:00:00`);
    if (
      test.getFullYear() !== Number(y) ||
      test.getMonth() !== Number(m) - 1 ||
      test.getDate() !== Number(d)
    ) {
      return null; // e.g. 02/31/2026 doesn't exist
    }

    return `${y}-${mm}-${dd}`;
  };

  const commitTyped = (raw) => {
    if (!raw.trim()) {
      onChange("");
      return;
    }
    const parsed = parseTyped(raw);
    if (parsed) {
      onChange(parsed);
    } else {
      // invalid text — revert display back to last valid value
      if (selected) {
        const mm = String(selected.getMonth() + 1).padStart(2, "0");
        const dd = String(selected.getDate()).padStart(2, "0");
        setTypedValue(`${mm}/${dd}/${selected.getFullYear()}`);
      } else {
        setTypedValue("");
      }
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div
        className={`w-full flex items-center rounded-lg border bg-white transition
          ${error ? "border-red-500" : "border-gray-300"}
          focus-within:ring-2 focus-within:ring-green-500 focus-within:border-green-500`}
      >
        <input
          ref={inputRef}
          type="text"
          value={typedValue}
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          onChange={(e) => setTypedValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              commitTyped(typedValue);
              setOpen(false);
              setShowYearGrid(false);
              inputRef.current?.blur();
            } else if (e.key === "Escape") {
              setOpen(false);
              setShowYearGrid(false);
              inputRef.current?.blur();
            }
          }}
          className="w-full p-2 rounded-l-lg focus:outline-none text-gray-800"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => {
            setOpen((o) => !o);
            inputRef.current?.focus();
          }}
          className="px-3 text-green-700 hover:text-green-900"
        >
          <FaCalendarAlt />
        </button>
      </div>

      {open &&
        createPortal(
          <div
            ref={popupRef}
            style={{
              position: "fixed",
              top: coords.top,
              left: coords.left,
              width: POPUP_WIDTH,
              maxHeight: `calc(100vh - ${VIEWPORT_MARGIN * 2}px)`,
            }}
            className="z-9999 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-y-auto"
          >
            {/* header */}
            <div className="bg-green-700 px-5 py-4">
              <p className="text-green-100 text-xs font-medium tracking-wide uppercase">
                {selected ? "Selected date" : "Pick a date"}
              </p>
              <p className="text-white text-lg font-semibold mt-0.5 leading-snug">
                {selected
                  ? selected.toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })
                  : `${MONTHS[viewDate.getMonth()]} ${viewDate.getFullYear()}`}
              </p>
            </div>

            <div className="p-5">
              {/* month/year nav */}
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={() => changeMonth(-1)}
                  className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-green-50 text-green-700 transition"
                >
                  <FaChevronLeft size={14} />
                </button>

                <button
                  type="button"
                  onClick={() => setShowYearGrid((s) => !s)}
                  className="flex items-center gap-1.5 font-semibold text-gray-800 px-3 py-1.5 rounded-lg hover:bg-green-50 transition"
                >
                  {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
                </button>

                <button
                  type="button"
                  onClick={() => changeMonth(1)}
                  className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-green-50 text-green-700 transition"
                >
                  <FaChevronRight size={14} />
                </button>
              </div>

              {showYearGrid ? (
                /* year picker grid */
                <div className="h-64 overflow-y-auto grid grid-cols-4 gap-2 pr-1">
                  {years.map((y) => (
                    <button
                      type="button"
                      key={y}
                      onClick={() => {
                        setViewDate(new Date(y, viewDate.getMonth(), 1));
                        setShowYearGrid(false);
                      }}
                      className={`py-2 rounded-lg text-sm font-medium transition
                        ${
                          y === viewDate.getFullYear()
                            ? "bg-green-700 text-white"
                            : "hover:bg-green-50 text-gray-700"
                        }`}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              ) : (
                <>
                  {/* weekday labels */}
                  <div className="grid grid-cols-7 text-center text-[11px] font-medium text-gray-400 mb-2">
                    {DAYS.map((d) => (
                      <div key={d}>{d.slice(0, 2)}</div>
                    ))}
                  </div>

                  {/* day grid */}
                  <div className="grid grid-cols-7 gap-y-2">
                    {cells.map((day, i) =>
                      day === null ? (
                        <div key={`empty-${i}`} />
                      ) : (
                        <div key={day} className="flex justify-center">
                          <button
                            type="button"
                            onClick={() => {
                              onChange(toValue(day));
                              setOpen(false);
                            }}
                            className={`h-9 w-9 rounded-full text-sm font-medium transition
                              ${
                                isSelected(day)
                                  ? "bg-green-700 text-white shadow-sm"
                                  : isToday(day)
                                    ? "border-2 border-green-500 text-green-700"
                                    : "hover:bg-green-100 text-gray-700"
                              }`}
                          >
                            {day}
                          </button>
                        </div>
                      )
                    )}
                  </div>
                </>
              )}

              {/* footer */}
              <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    onChange("");
                    setOpen(false);
                    setShowYearGrid(false);
                  }}
                  className="text-sm text-gray-500 hover:text-red-600 font-medium transition"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const t = new Date();
                    setViewDate(t);
                    onChange(t.toISOString().slice(0, 10));
                    setOpen(false);
                    setShowYearGrid(false);
                  }}
                  className="text-sm text-white bg-green-700 hover:bg-green-800 font-medium px-4 py-1.5 rounded-lg transition"
                >
                  Today
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}