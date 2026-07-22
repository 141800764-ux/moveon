"use client";

import { useEffect, useState } from "react";
import { Cloud, Sun, CloudRain, Wind, Thermometer } from "lucide-react";

type Weather = {
  temperature_2m: number;
  weathercode: number;
  windspeed_10m: number;
};

export default function DriverClock() {
  const [time, setTime] = useState(new Date());
  const [weather, setWeather] = useState<Weather | null>(null);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [locationStatus, setLocationStatus] = useState<"loading" | "denied" | "ok" | "idle">("idle");

  // Accurate clock — updates every second
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Weather — get location then fetch
  useEffect(() => {
    setLocationStatus("loading");

    if (!("geolocation" in navigator)) {
      setWeatherError("Location not supported");
      setLocationStatus("denied");
      fetchWeatherForCity(-33.9249, 18.4241); // Default to Cape Town
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setLocationStatus("ok");
        await fetchWeatherForCity(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        console.warn("Geolocation denied:", err.message);
        setLocationStatus("denied");
        // Default to Cape Town if location denied
        fetchWeatherForCity(-33.9249, 18.4241);
      },
      { timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  async function fetchWeatherForCity(lat: number, lng: number) {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weathercode,windspeed_10m&timezone=auto`;
      const res = await fetch(url);

      if (!res.ok) {
        throw new Error(`Weather API returned ${res.status}`);
      }

      const data = await res.json();

      if (data?.current) {
        setWeather(data.current);
        setWeatherError(null);
      } else {
        throw new Error("No weather data in response");
      }
    } catch (err: any) {
      console.error("Weather fetch failed:", err.message);
      setWeatherError("Weather unavailable");
    }
  }

  function getWeatherIcon(code: number) {
    if (code === 0) return <Sun size={24} style={{ color: "#eab308" }} />;
    if (code <= 3) return <Cloud size={24} style={{ color: "#94a3b8" }} />;
    if (code <= 67) return <CloudRain size={24} style={{ color: "#3b82f6" }} />;
    return <Wind size={24} style={{ color: "#94a3b8" }} />;
  }

  function getWeatherLabel(code: number) {
    if (code === 0) return "Clear sky";
    if (code <= 3) return "Partly cloudy";
    if (code <= 9) return "Fog";
    if (code <= 19) return "Drizzle";
    if (code <= 29) return "Rain";
    if (code <= 39) return "Snow";
    if (code <= 49) return "Fog";
    if (code <= 59) return "Drizzle";
    if (code <= 67) return "Rain";
    if (code <= 77) return "Snow";
    if (code <= 82) return "Showers";
    if (code <= 99) return "Thunderstorm";
    return "Unknown";
  }

  const hours = time.getHours();
  const greeting =
    hours < 12 ? "Morning" : hours < 17 ? "Afternoon" : "Evening";

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center justify-between">
        {/* Clock */}
        <div>
          <p
            className="text-4xl font-bold text-white tabular-nums tracking-tight"
            suppressHydrationWarning
          >
            {time.toLocaleTimeString("en-ZA", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: false,
            })}
          </p>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--muted-foreground)" }}
            suppressHydrationWarning
          >
            {time.toLocaleDateString("en-ZA", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        {/* Weather */}
        <div className="text-right">
          {locationStatus === "loading" ? (
            <div className="flex items-center gap-2 justify-end">
              <div
                className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
                style={{
                  borderColor: "var(--gold)",
                  borderTopColor: "transparent",
                }}
              />
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                Getting weather...
              </p>
            </div>
          ) : weather ? (
            <div className="flex items-center gap-3">
              {getWeatherIcon(weather.weathercode)}
              <div>
                <p className="text-2xl font-bold text-white">
                  {Math.round(weather.temperature_2m)}°C
                </p>
                <p
                  className="text-xs"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {getWeatherLabel(weather.weathercode)}
                </p>
                <p
                  className="text-xs"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Wind {Math.round(weather.windspeed_10m)} km/h
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Thermometer
                size={20}
                style={{ color: "var(--muted-foreground)" }}
              />
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                {weatherError || "Weather unavailable"}
              </p>
            </div>
          )}
          {locationStatus === "denied" && weather && (
            <p
              className="text-xs mt-1"
              style={{ color: "var(--muted-foreground)" }}
            >
              📍 Cape Town (default)
            </p>
          )}
        </div>
      </div>
    </div>
  );
}