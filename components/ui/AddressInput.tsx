"use client";

import { useState, useRef, useEffect } from "react";
import { Loader2 } from "lucide-react";

type Suggestion = {
  display_name: string;
  lat: string;
  lon: string;
  address: {
    road?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    postcode?: string;
  };
};

type Props = {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onSelect: (data: {
    address: string;
    city: string;
    lat: number;
    lng: number;
  }) => void;
  style?: React.CSSProperties;
};

export default function AddressInput({
  placeholder,
  value,
  onChange,
  onSelect,
  style,
}: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function fetchSuggestions(query: string) {
    if (query.length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    setLoading(true);
    try {
      const encoded = encodeURIComponent(`${query}, South Africa`);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=5&addressdetails=1&countrycodes=za`,
        { headers: { "User-Agent": "MoveOn-Logistics-App" } }
      );
      const data = await res.json();
      setSuggestions(data);
      setOpen(data.length > 0);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    onChange(val);

    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => fetchSuggestions(val), 400);
  }

  function handleSelect(suggestion: Suggestion) {
    const addr = suggestion.address;
    const street = addr.road || "";
    const city =
      addr.city || addr.town || addr.village || addr.suburb || "";

    onSelect({
      address: street || suggestion.display_name.split(",")[0],
      city,
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon),
    });

    onChange(suggestion.display_name.split(",").slice(0, 2).join(","));
    setOpen(false);
    setSuggestions([]);
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={handleChange}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="w-full rounded-xl px-3 py-2 text-sm outline-none focus:ring-1"
          style={{
            ...style,
            paddingRight: loading ? "2.5rem" : undefined,
          }}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2
              size={14}
              className="animate-spin"
              style={{ color: "var(--muted-foreground)" }}
            />
          </div>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <div
          className="absolute z-50 w-full mt-1 rounded-xl overflow-hidden shadow-lg"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
          }}
        >
          {suggestions.map((s, i) => {
            const parts = s.display_name.split(",");
            const main = parts.slice(0, 2).join(",").trim();
            const sub = parts.slice(2, 4).join(",").trim();

            return (
              <button
                key={i}
                type="button"
                onClick={() => handleSelect(s)}
                className="w-full text-left px-4 py-3 transition hover:bg-white/5"
                style={{ borderBottom: i < suggestions.length - 1 ? "1px solid var(--border)" : "none" }}
              >
                <p className="text-sm text-white font-medium">{main}</p>
                {sub && (
                  <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                    {sub}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}