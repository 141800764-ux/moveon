"use client";

import { useState, useRef, useEffect } from "react";
import { Loader2, MapPin, PenLine } from "lucide-react";

type Suggestion = {
  display_name: string;
  lat: string;
  lon: string;
  address: {
    house_number?: string;
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
  const [manualMode, setManualMode] = useState(false);
  const [manualCity, setManualCity] = useState("");
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
      const key = process.env.NEXT_PUBLIC_LOCATIONIQ_API_KEY;
      const encoded = encodeURIComponent(query + " South Africa");

      const res = await fetch(
        `https://us1.locationiq.com/v1/autocomplete?key=${key}&q=${encoded}&limit=8&dedupe=1&countrycodes=za&normalizeaddress=1&normalizecity=1&addressdetails=1&accept-language=en`,
        { headers: { Accept: "application/json" } }
      );

      if (!res.ok) throw new Error("LocationIQ error");

      const data = await res.json();
      setSuggestions(Array.isArray(data) ? data : []);
      setOpen(Array.isArray(data) && data.length > 0);
    } catch {
      try {
        const encoded = encodeURIComponent(query + " South Africa");
        const res2 = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=8&addressdetails=1&countrycodes=za`,
          { headers: { "User-Agent": "MoveOn-Logistics-App/1.0" } }
        );
        const data2 = await res2.json();
        setSuggestions(Array.isArray(data2) ? data2 : []);
        setOpen(Array.isArray(data2) && data2.length > 0);
      } catch {
        setSuggestions([]);
      }
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

  function getStreetAddress(addr: Suggestion["address"]): string {
    const parts = [];
    if (addr.house_number) parts.push(addr.house_number);
    if (addr.road) parts.push(addr.road);
    if (parts.length === 0 && addr.suburb) parts.push(addr.suburb);
    return parts.join(" ");
  }

  function handleSelect(suggestion: Suggestion) {
    const addr = suggestion.address;
    const streetAddress = getStreetAddress(addr);
    const city = getCity(addr);
    const parts = suggestion.display_name.split(",");
    const displayValue = parts.slice(0, 3).join(",").trim();

    onSelect({
      address: streetAddress || parts[0]?.trim() || suggestion.display_name,
      city,
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon),
      fullAddress: suggestion.display_name,
    });

    onChange(displayValue);
    setOpen(false);
    setSuggestions([]);
  }

  async function handleManualSubmit() {
    if (!value || !manualCity) return;

    setLoading(true);
    try {
      const key = process.env.NEXT_PUBLIC_LOCATIONIQ_API_KEY;
      const query = encodeURIComponent(`${value}, ${manualCity}, South Africa`);

      const res = await fetch(
        `https://us1.locationiq.com/v1/search?key=${key}&q=${query}&format=json&limit=1&addressdetails=1`,
        { headers: { Accept: "application/json" } }
      );

      const data = await res.json();

      if (Array.isArray(data) && data.length > 0) {
        const result = data[0];
        const addr = result.address;
        const city =
          addr.city ||
          addr.town ||
          addr.municipality ||
          addr.village ||
          addr.suburb ||
          manualCity;

        onSelect({
          address: value,
          city,
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
          fullAddress: `${value}, ${manualCity}, South Africa`,
        });
      } else {
        // Fallback to Nominatim
        const encoded = encodeURIComponent(
          `${value}, ${manualCity}, South Africa`
        );
        const res2 = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1`,
          { headers: { "User-Agent": "MoveOn-Logistics-App/1.0" } }
        );
        const data2 = await res2.json();

        if (Array.isArray(data2) && data2.length > 0) {
          onSelect({
            address: value,
            city: manualCity,
            lat: parseFloat(data2[0].lat),
            lng: parseFloat(data2[0].lon),
            fullAddress: `${value}, ${manualCity}, South Africa`,
          });
        } else {
          // Last resort — geocode just the city center
          const cityQuery = encodeURIComponent(`${manualCity}, South Africa`);
          const res3 = await fetch(
            `https://us1.locationiq.com/v1/search?key=${key}&q=${cityQuery}&format=json&limit=1`,
            { headers: { Accept: "application/json" } }
          );
          const data3 = await res3.json();

          if (Array.isArray(data3) && data3.length > 0) {
            onSelect({
              address: value,
              city: manualCity,
              lat: parseFloat(data3[0].lat),
              lng: parseFloat(data3[0].lon),
              fullAddress: `${value}, ${manualCity}, South Africa`,
            });
          }
        }
      }
    } catch (err) {
      console.error("Manual geocode failed:", err);
    } finally {
      setLoading(false);
      setManualMode(false);
      setOpen(false);
    }
  }

  if (manualMode) {
    return (
      <div className="space-y-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Street address (e.g. 12 Main Street)"
          autoComplete="off"
          className="w-full rounded-xl px-3 py-2 text-sm outline-none"
          style={style}
        />
        <input
          type="text"
          value={manualCity}
          onChange={(e) => setManualCity(e.target.value)}
          placeholder="City / Suburb (e.g. Cape Town)"
          autoComplete="off"
          className="w-full rounded-xl px-3 py-2 text-sm outline-none"
          style={style}
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleManualSubmit}
            disabled={loading || !value || !manualCity}
            className="flex-1 py-2 rounded-xl text-sm font-semibold text-white transition flex items-center justify-center gap-2"
            style={{
              background: "var(--gold)",
              opacity: loading || !value || !manualCity ? 0.7 : 1,
            }}
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading ? "Finding location..." : "Use This Address"}
          </button>
          <button
            type="button"
            onClick={() => setManualMode(false)}
            className="px-4 py-2 rounded-xl text-sm transition"
            style={{
              background: "var(--input)",
              border: "1px solid var(--border)",
              color: "var(--muted-foreground)",
            }}
          >
            Back
          </button>
        </div>
      </div>
    );
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
            maxHeight: "300px",
            overflowY: "auto",
          }}
        >
          {suggestions.map((s, i) => {
            const addr = s.address;
            const street = getStreetAddress(addr);
            const city = getCity(addr);
            const parts = s.display_name.split(",");
            const main = street || parts[0]?.trim();
            const sub = city
              ? `${city}${addr.postcode ? ` ${addr.postcode}` : ""}`
              : parts.slice(1, 3).join(",").trim();

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

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setManualMode(true);
            }}
            className="w-full text-left px-4 py-3 transition hover:bg-white/5 flex items-center gap-3"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <PenLine size={14} style={{ color: "var(--muted-foreground)" }} />
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              Can't find your address? Enter it manually
            </p>
          </button>
        </div>
      )}

      {!open && !loading && value.length >= 2 && suggestions.length === 0 && (
        <button
          type="button"
          onClick={() => setManualMode(true)}
          className="mt-1 flex items-center gap-2 text-xs transition hover:underline"
          style={{ color: "var(--gold)" }}
        >
          <PenLine size={12} />
          Can't find your address? Enter it manually
        </button>
      )}
    </div>
  );
}