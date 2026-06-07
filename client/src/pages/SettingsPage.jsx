import { useState, useEffect } from "react";
import { Settings, MapPin, CheckCircle, AlertCircle, Loader2, RefreshCw, Server, Database, Zap } from "lucide-react";
import { useGetOfficeLocationQuery, useSetOfficeLocationMutation, useGetHealthQuery } from "../app/api/baseApi";

export default function SettingsPage() {
  const { data, isLoading, error } = useGetOfficeLocationQuery();
  const [setOfficeLocation, { isLoading: isSaving }] = useSetOfficeLocationMutation();

  const office = data?.office ?? data ?? null;

  const [form, setForm] = useState({ latitude: "", longitude: "", radius: "100" });
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (office) {
      setForm({
        latitude: office.latitude != null ? String(office.latitude) : "",
        longitude: office.longitude != null ? String(office.longitude) : "",
        radius: office.radius != null ? String(office.radius) : "100"
      });
    }
  }, [office]);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setMessage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    const lat = parseFloat(form.latitude);
    const lng = parseFloat(form.longitude);
    const radius = parseInt(form.radius, 10);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      setMessage({ type: "error", text: "Latitude must be a number between -90 and 90." }); return;
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      setMessage({ type: "error", text: "Longitude must be a number between -180 and 180." }); return;
    }
    if (isNaN(radius) || radius < 1) {
      setMessage({ type: "error", text: "Radius must be a positive number in metres." }); return;
    }
    try {
      await setOfficeLocation({
        latitude: lat,
        longitude: lng,
        radius
      }).unwrap();
      setMessage({ type: "success", text: "Office location saved successfully." });
    } catch (err) {
      setMessage({ type: "error", text: err?.data?.message || "Failed to save settings." });
    }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6)
        }));
        setMessage(null);
      },
      () => setMessage({ type: "error", text: "Could not get your location. Check browser permissions." })
    );
  };

  const { data: health, isLoading: isHealthLoading, refetch: refetchHealth } = useGetHealthQuery();

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header card */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
            <Settings size={18} className="text-indigo-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#0f172a]">System Settings</h2>
            <p className="text-xs text-[#64748b]">Configure the geofence used for punch-in / punch-out validation.</p>
          </div>
        </div>
      </div>

      {/* System status */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server size={16} className="text-[#4f46e5]" />
            <h3 className="text-sm font-bold text-[#0f172a]">System Status</h3>
          </div>
          <button type="button" onClick={refetchHealth}
            className="flex items-center gap-1.5 text-xs text-[#64748b] font-medium border border-[#e2e8f0] rounded-xl px-3 py-1.5 bg-white cursor-pointer hover:bg-[#f8fafc] transition-colors">
            <RefreshCw size={12} className={isHealthLoading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>

        {isHealthLoading && (
          <div className="flex items-center gap-2 text-sm text-[#94a3b8]">
            <Loader2 size={14} className="animate-spin" /> Checking services…
          </div>
        )}

        {health && (
          <div className="space-y-2">
            {[
              { key: "server",  label: "API Server", icon: Server,   value: health.services?.server },
              { key: "mongodb", label: "MongoDB",    icon: Database, value: health.services?.mongodb },
              { key: "redis",   label: "Redis",      icon: Zap,      value: health.services?.redis }
            ].map(({ key, label, icon: Icon, value }) => {
              const isOk = value === "up" || value?.ok === true || value?.status === "connected";
              const statusText = typeof value === "string" ? value : (value?.status ?? "unknown");
              return (
                <div key={key} className="flex items-center justify-between bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <Icon size={15} className={isOk ? "text-emerald-500" : "text-red-400"} />
                    <span className="text-sm font-medium text-[#0f172a]">{label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${
                      isOk ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"
                    }`}>{statusText}</span>
                    {isOk
                      ? <CheckCircle size={14} className="text-emerald-500" />
                      : <AlertCircle size={14} className="text-red-400" />}
                  </div>
                </div>
              );
            })}

            {health.timestamp && (
              <p className="text-[10px] text-[#94a3b8] text-right pt-1">
                Last checked: {new Date(health.timestamp).toLocaleTimeString()}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Office location form */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-6 space-y-5">
        <div className="flex items-center gap-2">
          <MapPin size={16} className="text-[#4f46e5]" />
          <h3 className="text-sm font-bold text-[#0f172a]">Office Location</h3>
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-[#64748b]">
            <Loader2 size={14} className="animate-spin" /> Loading current settings…
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
            <AlertCircle size={14} /> {error?.data?.message || "Failed to load current settings."}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Lat / Lng row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1.5">Latitude</label>
              <input
                type="number"
                name="latitude"
                value={form.latitude}
                onChange={handleChange}
                placeholder="28.6139"
                step="any"
                className="w-full border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/30 focus:border-[#4f46e5] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1.5">Longitude</label>
              <input
                type="number"
                name="longitude"
                value={form.longitude}
                onChange={handleChange}
                placeholder="77.2090"
                step="any"
                className="w-full border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/30 focus:border-[#4f46e5] transition-colors"
              />
            </div>
          </div>

          {/* Use my location */}
          <button
            type="button"
            onClick={useMyLocation}
            className="flex items-center gap-1.5 text-xs text-[#4f46e5] font-medium cursor-pointer border-0 bg-transparent hover:underline"
          >
            <MapPin size={12} /> Use my current location
          </button>

          {/* Radius */}
          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1.5">
              Allowed Radius (metres)
            </label>
            <input
              type="number"
              name="radius"
              value={form.radius}
              onChange={handleChange}
              min="1"
              placeholder="100"
              className="w-full border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/30 focus:border-[#4f46e5] transition-colors"
            />
            <p className="text-xs text-[#94a3b8] mt-1">
              Employees must be within this distance to punch in or out.
            </p>
          </div>

          {/* Feedback */}
          {message && (
            <div className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm border ${
              message.type === "error"
                ? "bg-red-50 border-red-200 text-red-600"
                : "bg-emerald-50 border-emerald-200 text-emerald-700"
            }`}>
              {message.type === "error" ? <AlertCircle size={15} /> : <CheckCircle size={15} />}
              {message.text}
            </div>
          )}

          {/* Save */}
          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isSaving || isLoading}
              className="flex items-center gap-2 bg-[#4f46e5] text-white rounded-xl px-6 py-2.5 text-sm font-semibold cursor-pointer border-0 hover:bg-[#4338ca] transition-colors disabled:opacity-50"
            >
              {isSaving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : "Save Settings"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
