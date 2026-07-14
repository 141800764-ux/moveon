"use client";

import { useEffect, useRef, useState } from "react";
import { Truck, MapPin, Phone, Package, RefreshCw } from "lucide-react";

type DriverMapData = {
  routeId: string;
  driver: { id?: string; name?: string; phone?: string };
  vehicle: { registration?: string; make?: string; model?: string };
  hub: { name: string; latitude: number; longitude: number };
  progress: { total: number; completed: number; remaining: number };
  nextStop: {
    id: string;
    sequence: number;
    address?: string;
    city?: string;
    latitude: number;
    longitude: number;
    contactName?: string;
    contactPhone?: string;
  } | null;
  allStops: {
    id: string;
    sequence: number;
    type: string;
    status: string;
    address?: string;
    city?: string;
    latitude: number;
    longitude: number;
  }[];
};

export default function LiveMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [drivers, setDrivers] = useState<DriverMapData[]>([]);
  const [selected, setSelected] = useState<DriverMapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  async function fetchDrivers() {
    try {
      const res = await fetch("/api/map/drivers");
      const data = await res.json();
      if (data.success) {
        setDrivers(data.drivers);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error("Failed to fetch drivers:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDrivers();
    const interval = setInterval(fetchDrivers, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    async function initMap() {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      // Fix default marker icons
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current!, {
        center: [-29.0, 25.0],
        zoom: 6,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || drivers.length === 0) return;

    async function updateMarkers() {
      const L = (await import("leaflet")).default;
      const map = mapInstanceRef.current;

      // Clear existing markers
      map.eachLayer((layer: any) => {
        if (layer instanceof L.Marker || layer instanceof L.CircleMarker) {
          map.removeLayer(layer);
        }
      });

      const bounds: [number, number][] = [];

      drivers.forEach((driver) => {
        // Hub marker
        if (driver.hub.latitude && driver.hub.longitude) {
          const hubIcon = L.divIcon({
            html: `<div style="background:#1a1a1a;border:2px solid #c8922a;border-radius:8px;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:16px;">🏭</div>`,
            className: "",
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          });

          L.marker([driver.hub.latitude, driver.hub.longitude], {
            icon: hubIcon,
          })
            .addTo(map)
            .bindPopup(`<b>${driver.hub.name}</b><br/>Hub`);

          bounds.push([driver.hub.latitude, driver.hub.longitude]);
        }

        // Next stop marker
        if (driver.nextStop?.latitude && driver.nextStop?.longitude) {
          const stopIcon = L.divIcon({
            html: `<div style="background:#c8922a;border:2px solid white;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:12px;">${driver.nextStop.sequence}</div>`,
            className: "",
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          });

          L.marker(
            [driver.nextStop.latitude, driver.nextStop.longitude],
            { icon: stopIcon }
          )
            .addTo(map)
            .bindPopup(`
              <b>Stop ${driver.nextStop.sequence}</b><br/>
              ${driver.nextStop.address || ""}<br/>
              ${driver.nextStop.city || ""}<br/>
              ${driver.nextStop.contactName ? `👤 ${driver.nextStop.contactName}` : ""}
            `);

          bounds.push([driver.nextStop.latitude, driver.nextStop.longitude]);
        }

        // All completed/pending stops
        driver.allStops.forEach((stop) => {
          if (!stop.latitude || !stop.longitude) return;
          if (stop.id === driver.nextStop?.id) return;

          const color = stop.status === "COMPLETED"
            ? "#10b981"
            : stop.status === "FAILED"
            ? "#ef4444"
            : "#6b7280";

          L.circleMarker([stop.latitude, stop.longitude], {
            radius: 6,
            fillColor: color,
            color: "white",
            weight: 1,
            fillOpacity: 0.8,
          })
            .addTo(map)
            .bindPopup(`
              <b>Stop ${stop.sequence} — ${stop.status}</b><br/>
              ${stop.address || ""}, ${stop.city || ""}
            `);

          bounds.push([stop.latitude, stop.longitude]);
        });
      });

      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [40, 40] });
      }
    }

    updateMarkers();
  }, [drivers]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Live Map</h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
            {loading
              ? "Loading..."
              : `${drivers.length} active route${drivers.length !== 1 ? "s" : ""} · Updated ${lastUpdated.toLocaleTimeString("en-ZA")}`}
          </p>
        </div>
        <button
          onClick={fetchDrivers}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition hover:bg-white/5"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            color: "var(--muted-foreground)",
          }}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Map */}
        <div
          className="lg:col-span-2 rounded-2xl overflow-hidden"
          style={{
            border: "1px solid var(--border)",
            height: "500px",
          }}
        >
          {drivers.length === 0 && !loading ? (
            <div
              className="h-full flex flex-col items-center justify-center"
              style={{ background: "var(--card)" }}
            >
              <Truck
                size={48}
                className="mb-4"
                style={{ color: "var(--muted-foreground)" }}
              />
              <p className="text-white font-semibold">No active routes</p>
              <p
                className="text-sm mt-1"
                style={{ color: "var(--muted-foreground)" }}
              >
                Routes with status IN_PROGRESS will appear here
              </p>
            </div>
          ) : (
            <div ref={mapRef} style={{ height: "100%", width: "100%" }} />
          )}
        </div>

        {/* Driver list */}
        <div className="space-y-3 overflow-y-auto" style={{ maxHeight: "500px" }}>
          {loading ? (
            <div
              className="rounded-2xl p-6 text-center"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            >
              <p style={{ color: "var(--muted-foreground)" }}>Loading...</p>
            </div>
          ) : drivers.length === 0 ? (
            <div
              className="rounded-2xl p-6 text-center"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            >
              <p style={{ color: "var(--muted-foreground)" }}>
                No drivers currently on route
              </p>
            </div>
          ) : (
            drivers.map((driver) => (
              <div
                key={driver.routeId}
                className="rounded-2xl p-4 cursor-pointer transition hover:border-orange-500/30"
                style={{
                  background: "var(--card)",
                  border:
                    selected?.routeId === driver.routeId
                      ? "1px solid rgba(200,146,42,0.5)"
                      : "1px solid var(--border)",
                }}
                onClick={() =>
                  setSelected(
                    selected?.routeId === driver.routeId ? null : driver
                  )
                }
              >
                {/* Driver info */}
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
                    style={{
                      background: "rgba(200,146,42,0.15)",
                      color: "var(--gold)",
                    }}
                  >
                    {driver.driver.name?.[0] ?? "D"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold truncate">
                      {driver.driver.name ?? "Unknown Driver"}
                    </p>
                    <p
                      className="text-xs truncate"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      {driver.vehicle.make} {driver.vehicle.model} ·{" "}
                      {driver.vehicle.registration}
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: "var(--muted-foreground)" }}>
                      Progress
                    </span>
                    <span style={{ color: "var(--gold)" }}>
                      {driver.progress.completed}/{driver.progress.total} stops
                    </span>
                  </div>
                  <div
                    className="h-1.5 rounded-full overflow-hidden"
                    style={{ background: "var(--border)" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${driver.progress.total > 0
                          ? (driver.progress.completed / driver.progress.total) * 100
                          : 0}%`,
                        background: "var(--gold)",
                      }}
                    />
                  </div>
                </div>

                {/* Next stop */}
                {driver.nextStop && (
                  <div
                    className="rounded-xl p-3"
                    style={{ background: "var(--background)" }}
                  >
                    <p
                      className="text-xs font-semibold uppercase mb-1"
                      style={{ color: "var(--gold)" }}
                    >
                      Next Stop
                    </p>
                    <div className="flex items-start gap-2">
                      <MapPin
                        size={12}
                        className="shrink-0 mt-0.5"
                        style={{ color: "var(--muted-foreground)" }}
                      />
                      <div className="min-w-0">
                        <p className="text-white text-sm truncate">
                          {driver.nextStop.address}
                        </p>
                        <p
                          className="text-xs truncate"
                          style={{ color: "var(--muted-foreground)" }}
                        >
                          {driver.nextStop.city}
                        </p>
                      </div>
                    </div>
                    {driver.nextStop.contactName && (
                      <div className="flex items-center gap-2 mt-2">
                        <Phone
                          size={12}
                          style={{ color: "var(--muted-foreground)" }}
                        />
                        <span
                          className="text-xs"
                          style={{ color: "var(--muted-foreground)" }}
                        >
                          {driver.nextStop.contactName}{" "}
                          {driver.nextStop.contactPhone &&
                            `· ${driver.nextStop.contactPhone}`}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Hub */}
                <div className="flex items-center gap-2 mt-2">
                  <Package
                    size={12}
                    style={{ color: "var(--muted-foreground)" }}
                  />
                  <span
                    className="text-xs"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    Hub: {driver.hub.name}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Legend */}
      <div
        className="rounded-2xl p-4 flex items-center gap-6 flex-wrap"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <p
          className="text-xs font-semibold uppercase"
          style={{ color: "var(--muted-foreground)" }}
        >
          Legend
        </p>
        {[
          { color: "#c8922a", label: "Next Stop" },
          { color: "#10b981", label: "Completed" },
          { color: "#ef4444", label: "Failed" },
          { color: "#6b7280", label: "Pending" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ background: item.color }}
            />
            <span
              className="text-xs"
              style={{ color: "var(--muted-foreground)" }}
            >
              {item.label}
            </span>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <span className="text-sm">🏭</span>
          <span
            className="text-xs"
            style={{ color: "var(--muted-foreground)" }}
          >
            Hub
          </span>
        </div>
        <p
          className="text-xs ml-auto"
          style={{ color: "var(--muted-foreground)" }}
        >
          Auto-refreshes every 30 seconds
        </p>
      </div>
    </div>
  );
}