"use client";

import { useEffect, useState } from "react";
import { Cloud, Sun, CloudRain, Wind } from "lucide-react";

export default function DriverClock() {
  const [time, setTime] = useState(new Date());
  const [weather, setWeather] = useState<any>(null);

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weathercode,windspeed_10m&timezone=auto`
          );
          const data = await res.json();
          setWeather(data.current);
        } catch {
          console.error("Weather fetch failed");
        }
      });
    }
  }, []);

  function getWeatherIcon(code: number) {
    if (code === 0) return <Sun size={20} style={{ color: "#eab308" }} />;
    if (code <= 3) return <Cloud size={20} style={{ color: "#94a3b8" }} />;
    if (code <= 67) return <CloudRain size={20} style={{ color: "#3b82f6" }} />;
    return <Wind size={20} style={{ color: "#94a3b8" }} />;
  }

  function getWeatherDesc(code: number) {
    if (code === 0) return "Clear";
    if (code <= 3) return "Cloudy";
    if (code <= 67) return "Rain";
    return "Windy";
  }

  return (
    <div className="rounded-2xl p-5 flex items-center justify-between" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      {/* Clock */}
      <div>
        <p className="text-3xl font-bold text-white tabular-nums">
          {time.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </p>
        <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>
          {time.toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {/* Weather */}
      {weather && (
        <div className="flex items-center gap-3">
          {getWeatherIcon(weather.weathercode)}
          <div className="text-right">
            <p className="text-2xl font-bold text-white">
              {Math.round(weather.temperature_2m)}°C
            </p>
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              {getWeatherDesc(weather.weathercode)} · {Math.round(weather.windspeed_10m)} km/h
            </p>
          </div>
        </div>
      )}
    </div>
  );
}