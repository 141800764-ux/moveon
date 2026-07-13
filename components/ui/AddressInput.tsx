"use client";

import { useState, useRef, useEffect } from "react";
import { Loader2, MapPin } from "lucide-react";

type Suggestion = {
  display_name: string;
  lat: string;
  lon: string;
  address: {
    road?: string;
    suburb?: string;
    neighbourhood?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    postcode?: string;
    state?: string;
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
    fullAddress: string;
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
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function fetchSuggestions(query: string) {
    if (query.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    setLoading(true);
    try {
      // Try with South Africa first, then without country restriction
      const encoded = encodeURIComponent(query);
      const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=8&addressdetails=1&countrycodes=za&accept-language=en`;

      const res = await fetch(url, {
        headers: { "User-Agent": "MoveOn-Logistics-App/1.0" },
      });
      const data = await res.json();

      if (data.length === 0) {
        // Retry without country restriction
        const res2 = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encoded}+South+Africa&format=json&limit=8&addressdetails=1&accept-language=en`,
          { headers: { "User-Agent": "MoveOn-Logistics-App/1.0" } }
        );
        const data2 = await res2.json();
        setSuggestions(data2);
        setOpen(data2.length > 0);
      } else {
        setSuggestions(data);
        setOpen(data.length > 0);
      }
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
    timeoutRef.current = setTimeout(() => fetchSuggestions(val), 350);
  }

  function getCity(addr: Suggestion["address"]): string {
    return (
      addr.city ||
      addr.town ||
      addr.municipality ||
      addr.village ||
      addr.suburb ||
      addr.neighbourhood ||
      addr.state ||
      ""
    );
  }

  function getStreet(addr: Suggestion["address"]): string {
    return addr.road || addr.suburb || addr.neighbourhood || "";
  }

  function handleSelect(suggestion: Suggestion) {
    const addr = suggestion.address;
    const street = getStreet(addr);
    const city = getCity(addr);
    const fullAddress = suggestion.display_name;

    // Show a clean version in the input
    const parts = suggestion.display_name.split(",");
    const displayValue = parts.slice(0, 3).join(",").trim();

    onSelect({
      address: street || parts[0]?.trim() || fullAddress,
      city,
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon),
      fullAddress,
    });

    onChange(displayValue);
    setOpen(false);
    setSuggestions([]);
  }

  function formatDisplayName(suggestion: Suggestion) {
    const parts = suggestion.display_name.split(",");
    const main = parts.slice(0, 2).join(",").trim();
    const sub = parts.slice(2, 5).join(",").trim();
    return { main, sub };
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
          autoComplete="off"
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
          className="absolute z-50 w-full mt-1 rounded-xl overflow-hidden shadow-xl"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            maxHeight: "280px",
            overflowY: "auto",
          }}
        >
          {suggestions.map((s, i) => {
            const { main, sub } = formatDisplayName(s);
            return (
              <button
                key={i}
                type="button"
                onClick={() => handleSelect(s)}
                className="w-full text-left px-4 py-3 transition hover:bg-white/5 flex items-start gap-3"
                style={{
                  borderBottom:
                    i < suggestions.length - 1
                      ? "1px solid var(--border)"
                      : "none",
                }}
              >
                <MapPin
                  size={14}
                  className="shrink-0 mt-0.5"
                  style={{ color: "var(--gold)" }}
                />
                <div className="min-w-0">
                  <p className="text-sm text-white font-medium truncate">
                    {main}
                  </p>
                  {sub && (
                    <p
                      className="text-xs mt-0.5 truncate"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      {sub}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}