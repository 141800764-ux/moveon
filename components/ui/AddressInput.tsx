"use client";

import { useState, useRef, useEffect } from "react";
import { Loader2, MapPin, PenLine } from "lucide-react";

type GeoapifyFeature = {
  properties: {
    formatted: string;
    housenumber?: string;
    street?: string;
    suburb?: string;
    district?: string;
    city?: string;
    county?: string;
    state?: string;
    postcode?: string;
    lat: number;
    lon: number;
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

const GEOAPIFY_KEY = process.env.NEXT_PUBLIC_GEOAPIFY_KEY;

export default function AddressInput({
  placeholder,
  value,
  onChange,
  onSelect,
  style,
}: Props) {
  const [suggestions, setSuggestions] = useState<GeoapifyFeature[]>([]);
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
    if (query.length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    if (!GEOAPIFY_KEY) {
      console.error("Missing NEXT_PUBLIC_GEOAPIFY_KEY");
      return;
    }

    setLoading(true);
    try {
      const encoded = encodeURIComponent(query);
      const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encoded}&filter=countrycode:za&format=geojson&limit=8&apiKey=${GEOAPIFY_KEY}`;

      const res = await fetch(url);

      if (!res.ok) {
        setSuggestions([]);
        setOpen(false);
        return;
      }

      const data = await res.json();
      const features: GeoapifyFeature[] = data?.features || [];
      setSuggestions(features);
      setOpen(features.length > 0);
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

  function getCity(props: GeoapifyFeature["properties"]): string {
    return props.city || props.district || props.county || props.state || "";
  }

  function getStreetAddress(props: GeoapifyFeature["properties"]): string {
    const parts = [];
    if (props.housenumber) parts.push(props.housenumber);
    if (props.street) parts.push(props.street);
    if (parts.length === 0 && props.suburb) parts.push(props.suburb);
    return parts.join(" ");
  }

  function handleSelect(feature: GeoapifyFeature) {
    const props = feature.properties;
    const streetAddress = getStreetAddress(props);
    const city = getCity(props);

    onSelect({
      address: streetAddress || props.formatted.split(",")[0]?.trim() || props.formatted,
      city,
      lat: props.lat,
      lng: props.lon,
      fullAddress: props.formatted,
    });

    const parts = props.formatted.split(",");
    onChange(parts.slice(0, 3).join(",").trim());
    setOpen(false);
    setSuggestions([]);
  }

  async function handleManualSubmit() {
    if (!value || !manualCity) return;

    setLoading(true);
    try {
      const query = encodeURIComponent(`${value}, ${manualCity}, South Africa`);
      const res = await fetch(
        `https://api.geoapify.com/v1/geocode/search?text=${query}&filter=countrycode:za&format=json&limit=1&apiKey=${GEOAPIFY_KEY}`
      );
      const data = await res.json();

      if (data?.results && data.results.length > 0) {
        const result = data.results[0];
        onSelect({
          address: value,
          city: result.city || manualCity,
          lat: result.lat,
          lng: result.lon,
          fullAddress: `${value}, ${manualCity}, South Africa`,
        });
      } else {
        // Last resort — geocode just the city center so pricing still works
        const cityQuery = encodeURIComponent(`${manualCity}, South Africa`);
        const res2 = await fetch(
          `https://api.geoapify.com/v1/geocode/search?text=${cityQuery}&filter=countrycode:za&format=json&limit=1&apiKey=${GEOAPIFY_KEY}`
        );
        const data2 = await res2.json();

        if (data2?.results && data2.results.length > 0) {
          onSelect({
            address: value,
            city: manualCity,
            lat: data2.results[0].lat,
            lng: data2.results[0].lon,
            fullAddress: `${value}, ${manualCity}, South Africa`,
          });
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
            const props = s.properties;
            const street = getStreetAddress(props);
            const city = getCity(props);
            const main = street || props.formatted.split(",")[0]?.trim();
            const sub = city
              ? `${city}${props.postcode ? ` ${props.postcode}` : ""}`
              : props.formatted.split(",").slice(1, 3).join(",").trim();

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