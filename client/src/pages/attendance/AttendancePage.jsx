import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import {
  Camera, CameraOff, MapPin, LogIn, LogOut,
  RefreshCw, CheckCircle, AlertCircle, Clock, Users, X,
  Search, Eye, MessageSquare, Loader2, CalendarDays, XCircle,
  ChevronLeft, ChevronRight
} from "lucide-react";
import {
  useGetTodayAttendanceQuery,
  useGetMyAttendanceQuery,
  useGetAllAttendanceQuery,
  useGetOfficeLocationQuery,
  usePunchInMutation,
  usePunchOutMutation
} from "../../app/api/baseApi";
import {
  AttendanceRecordDrawer,
  ValidationIcon,
  statusOf,
  avatarColor,
  getInitials,
  fmtTime,
  fmtHours
} from "../../components/AttendanceRecordDrawer";

// ─── helpers ────────────────────────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

// ─── Attendance Calendar ─────────────────────────────────────────────────────

const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function dotCls(rec) {
  if (!rec) return null;
  if (rec.validationStatus === "invalid") return "bg-red-400";
  if (!rec.punchIn) return "bg-red-400";
  if (!rec.punchOut) return "bg-emerald-400";
  if (rec.status === "incomplete" && rec.validationStatus === "valid") return "bg-purple-500";
  if (rec.status === "incomplete") return "bg-amber-400";
  return "bg-[#4f46e5]";
}

function MonthCalendar({ calMonth, recordMap, selectedDate, onSelectDate }) {
  const [year, month] = calMonth.split("-").map(Number);
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const todayISO = todayStr();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div>
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-[#94a3b8] py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, idx) => {
          if (!day) return <div key={`e${idx}`} />;
          const dateStr = `${calMonth}-${String(day).padStart(2, "0")}`;
          const rec = recordMap[dateStr];
          const isToday = dateStr === todayISO;
          const isSelected = dateStr === selectedDate;
          const isFuture = dateStr > todayISO;
          const dot = dotCls(rec);

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => !isFuture && onSelectDate(isSelected ? null : dateStr)}
              className={`flex flex-col items-center py-1.5 rounded-xl text-xs transition-all border-0 ${
                isFuture ? "cursor-default" : "cursor-pointer"
              } ${
                isSelected
                  ? "bg-[#4f46e5] text-white"
                  : isToday
                  ? "bg-[#e0e7ff] text-[#4f46e5] font-bold"
                  : rec
                  ? "hover:bg-[#f1f5f9] text-[#0f172a]"
                  : "text-[#cbd5e1]"
              }`}
            >
              <span className="font-medium text-xs leading-none">{day}</span>
              <span className={`w-1.5 h-1.5 rounded-full mt-1 ${
                dot && !isFuture
                  ? (isSelected ? "bg-white" : dot)
                  : "bg-transparent"
              }`} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DayDetailCard({ date, rec, onClose }) {
  const { label, cls } = statusOf(rec);
  const dayLabel = new Date(date + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  });

  return (
    <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-[#0f172a]">{dayLabel}</p>
        <button type="button" onClick={onClose}
          className="text-[#94a3b8] hover:text-[#0f172a] border-0 bg-transparent cursor-pointer">
          <X size={15} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Punch In",  value: fmtTime(rec.punchIn?.time),  color: "text-emerald-600" },
          { label: "Punch Out", value: fmtTime(rec.punchOut?.time), color: "text-rose-500" },
          { label: "Hours",     value: fmtHours(rec.workingHours),  color: "text-[#4f46e5]" }
        ].map(({ label: l, value, color }) => (
          <div key={l} className="bg-white border border-[#e2e8f0] rounded-xl p-2 text-center">
            <p className="text-[10px] text-[#94a3b8] mb-0.5">{l}</p>
            <p className={`text-xs font-bold font-mono ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cls}`}>{label}</span>
        {rec.validationStatus === "valid" && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1">
            <CheckCircle size={10} /> Valid
          </span>
        )}
        {rec.validationStatus === "invalid" && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600 flex items-center gap-1">
            <XCircle size={10} /> Invalid
          </span>
        )}
      </div>

      {rec.earlyExitReason && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider mb-1">Early Exit Reason</p>
          <p className="text-xs text-amber-800">{rec.earlyExitReason}</p>
        </div>
      )}

      {rec.remarks && (
        <div className="bg-white border border-[#e2e8f0] rounded-xl p-3">
          <p className="text-[10px] font-semibold text-[#64748b] uppercase tracking-wider mb-1">Remarks</p>
          <p className="text-xs text-[#475569]">{rec.remarks}</p>
        </div>
      )}
    </div>
  );
}

// ─── Admin view ──────────────────────────────────────────────────────────────

function AdminAttendanceView() {
  const [date, setDate] = useState(todayStr());
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);

  const { data, isLoading, error, refetch, isFetching } =
    useGetAllAttendanceQuery({ date, limit: 200 });

  const records = (data?.records ?? []).map(r => ({
    ...r,
    name: r.userId?.name ?? r.userName ?? "Unknown",
    department: r.userId?.department ?? ""
  }));

  const total     = records.length;
  const present   = records.filter(r => statusOf(r).label === "Checked In").length;
  const completed = records.filter(r => statusOf(r).label === "Completed").length;
  const absent    = records.filter(r => statusOf(r).label === "Absent").length;
  const pending   = records.filter(r => r.validationStatus === "pending").length;

  const filtered = records.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = r.name.toLowerCase().includes(q) || r.department.toLowerCase().includes(q);
    if (!matchSearch) return false;
    if (filter === "present")   return statusOf(r).label === "Checked In";
    if (filter === "completed") return statusOf(r).label === "Completed";
    if (filter === "absent")    return statusOf(r).label === "Absent";
    if (filter === "pending")   return r.validationStatus === "pending";
    return true;
  });

  return (
    <div className="space-y-6">
      {selected && <AttendanceRecordDrawer rec={selected} onClose={() => setSelected(null)} />}

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: "Total",      value: total,     icon: Users,        bg: "bg-indigo-50",  ic: "text-indigo-600",  vc: "text-indigo-700" },
          { label: "Checked In", value: present,   icon: Clock,        bg: "bg-emerald-50", ic: "text-emerald-600", vc: "text-emerald-700" },
          { label: "Completed",  value: completed, icon: CheckCircle,  bg: "bg-blue-50",    ic: "text-blue-600",    vc: "text-blue-700" },
          { label: "Absent",     value: absent,    icon: AlertCircle,  bg: "bg-red-50",     ic: "text-red-500",     vc: "text-red-600" },
          { label: "Pending",    value: pending,   icon: Clock,        bg: "bg-amber-50",   ic: "text-amber-500",   vc: "text-amber-600" }
        ].map(({ label, value, icon: Icon, bg, ic, vc }) => (
          <div key={label} className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
              <Icon size={18} className={ic} />
            </div>
            <div>
              <p className={`text-xl font-bold ${vc}`}>{value}</p>
              <p className="text-xs text-[#64748b]">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-[#f1f5f9]">
          <div>
            <h3 className="text-base font-bold text-[#0f172a]">All Attendance Records</h3>
            <p className="text-xs text-[#64748b] mt-0.5">System-wide · {data?.total ?? 0} total</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Date picker */}
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="border border-[#e2e8f0] rounded-xl px-3 py-1.5 text-xs text-[#0f172a] bg-[#f8fafc] focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5] cursor-pointer"
            />
            {/* Filter tabs */}
            <div className="flex bg-[#f1f5f9] rounded-xl p-1 gap-0.5">
              {[
                { key: "all",       label: "All" },
                { key: "present",   label: "In" },
                { key: "completed", label: "Done" },
                { key: "absent",    label: "Absent" },
                { key: "pending",   label: "Pending" }
              ].map(({ key, label }) => (
                <button key={key} type="button" onClick={() => setFilter(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-0 cursor-pointer transition-all ${
                    filter === key ? "bg-white text-[#0f172a] shadow-sm" : "text-[#64748b] bg-transparent hover:text-[#0f172a]"
                  }`}>
                  {label}
                </button>
              ))}
            </div>
            {/* Search */}
            <div className="relative">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
              <input type="text" placeholder="Search…" value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-[#e2e8f0] rounded-xl bg-[#f8fafc] focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5] w-36"
              />
            </div>
            {/* Refresh */}
            <button type="button" onClick={refetch}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#64748b] border border-[#e2e8f0] rounded-xl bg-white cursor-pointer hover:bg-[#f8fafc] transition-colors">
              <RefreshCw size={12} className={isFetching ? "animate-spin" : ""} /> Refresh
            </button>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-[#4f46e5]" />
          </div>
        )}
        {error && (
          <div className="m-6 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
            {error?.data?.message || "Failed to load records."}
          </div>
        )}
        {!isLoading && !error && filtered.length === 0 && (
          <div className="text-center py-16">
            <Users size={32} className="text-[#cbd5e1] mx-auto mb-3" />
            <p className="text-sm text-[#64748b]">
              {search || filter !== "all" ? "No records match your filter." : "No attendance records for this date."}
            </p>
          </div>
        )}

        {!isLoading && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 px-6 py-3 bg-[#f8fafc] border-b border-[#e2e8f0]">
              {["Employee", "Punch In", "Punch Out", "Hours", "Status", ""].map(h => (
                <p key={h} className="text-xs font-semibold text-[#64748b] uppercase tracking-wider whitespace-nowrap">{h}</p>
              ))}
            </div>
            {filtered.map((rec, idx) => {
              const { label, cls } = statusOf(rec);
              return (
                <div key={rec._id ?? idx}
                  className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 items-center px-6 py-4 border-b border-[#f1f5f9] last:border-0 hover:bg-[#fafafa] transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-full ${avatarColor(rec.name)} flex items-center justify-center text-xs font-bold text-white shrink-0`}>
                      {getInitials(rec.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-[#0f172a] truncate">{rec.name}</p>
                        <ValidationIcon vs={rec.validationStatus} adminLocked={rec.adminLocked} />
                      </div>
                      {rec.department && <p className="text-xs text-[#94a3b8] truncate">{rec.department}</p>}
                      {rec.earlyExitReason && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 font-medium mt-0.5">
                          <MessageSquare size={10} /> Has reason
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm font-mono text-[#0f172a] whitespace-nowrap">{fmtTime(rec.punchIn?.time)}</p>
                  <p className="text-sm font-mono text-[#64748b] whitespace-nowrap">{fmtTime(rec.punchOut?.time)}</p>
                  <p className="text-sm font-mono text-[#64748b] whitespace-nowrap">{fmtHours(rec.workingHours)}</p>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${cls}`}>{label}</span>
                  <button type="button" onClick={() => setSelected(rec)}
                    className="flex items-center gap-1 text-xs text-[#4f46e5] font-medium cursor-pointer border-0 bg-transparent hover:underline whitespace-nowrap">
                    <Eye size={13} /> Review
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Employee / Manager view ─────────────────────────────────────────────────

function EmployeeAttendanceView() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [cameraError, setCameraError] = useState("");

  const [location, setLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState("idle"); // idle | getting | done | error
  const [locationError, setLocationError] = useState("");

  const [message, setMessage] = useState(null);

  // Early-exit reason modal
  const [reasonModal, setReasonModal] = useState(false);
  const [reason, setReason] = useState("");
  const [workedHours, setWorkedHours] = useState(null);
  const [modalError, setModalError] = useState("");

  const [calMonth, setCalMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedDate, setSelectedDate] = useState(null);

  const { data: todayData, refetch: refetchToday } = useGetTodayAttendanceQuery();
  const { data: historyData, refetch: refetchHistory } = useGetMyAttendanceQuery(calMonth);
  const { data: officeData } = useGetOfficeLocationQuery();

  const recordMap = useMemo(() => {
    const map = {};
    (historyData?.records ?? []).forEach(r => { map[r.date] = r; });
    return map;
  }, [historyData]);

  const prevMonth = () => {
    const [y, m] = calMonth.split("-").map(Number);
    const d = new Date(y, m - 2, 1);
    setCalMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    setSelectedDate(null);
  };
  const nextMonth = () => {
    const [y, m] = calMonth.split("-").map(Number);
    const d = new Date(y, m, 1);
    setCalMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    setSelectedDate(null);
  };
  const [punchIn, { isLoading: isPunchingIn }] = usePunchInMutation();
  const [punchOut, { isLoading: isPunchingOut }] = usePunchOutMutation();

  const refetch = () => { refetchToday(); refetchHistory(); };

  // Today's record — only valid if it belongs to today's date
  const todayRecord = (() => {
    const rec = todayData?.attendance ?? null;
    if (!rec) return null;
    // If the record's date is not today (e.g. yesterday's incomplete), ignore it
    return rec.date === todayStr() ? rec : null;
  })();
  const isPunchedIn = !!todayRecord?.punchIn;
  const isPunchedOut = !!todayRecord?.punchOut;

  // Assign stream to video element
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Stop camera on unmount
  useEffect(() => {
    return () => stopCamera();
  }, []);

  const stopCamera = useCallback(() => {
    setStream((prev) => {
      prev?.getTracks().forEach((t) => t.stop());
      return null;
    });
  }, []);

  const startCamera = async () => {
    setCameraError("");
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false
      });
      setStream(mediaStream);
      // Auto-fetch location as soon as camera opens
      if (locationStatus === "idle" || locationStatus === "error") {
        getLocation();
      }
    } catch (err) {
      setCameraError(
        err.name === "NotAllowedError"
          ? "Camera permission denied. Please allow camera access in your browser."
          : "Could not access camera: " + err.message
      );
    }
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("error");
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }
    setLocationStatus("getting");
    setLocationError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setLocationStatus("done");
      },
      (err) => {
        setLocationStatus("error");
        setLocationError(
          err.code === 1
            ? "Location permission denied. Please allow location access."
            : "Could not get location: " + err.message
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const captureFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return null;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext("2d").drawImage(video, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.85);
  };

  const handlePunchIn = async () => {
    setMessage(null);
    const selfie = captureFrame();
    if (!selfie) { setMessage({ type: "error", text: "Start the camera and wait for the preview to load." }); return; }
    if (!location) { setMessage({ type: "error", text: "Location required. Please allow GPS access." }); return; }

    try {
      await punchIn({ selfie, location }).unwrap();
      stopCamera();
      setMessage({ type: "success", text: "Punched in successfully!" });
      refetch();
    } catch (err) {
      setMessage({ type: "error", text: err?.data?.message || "Punch in failed." });
    }
  };

  const handlePunchOut = async (withReason = false) => {
    setMessage(null);

    // Proactively check if < 8 hours worked — show reason modal before hitting API
    if (!withReason && todayRecord?.punchIn?.time) {
      const hoursWorked = (Date.now() - new Date(todayRecord.punchIn.time)) / 3_600_000;
      if (hoursWorked < 8) {
        setWorkedHours(hoursWorked);
        setReason("");
        setModalError("");
        setReasonModal(true);
        return;
      }
    }

    const selfie = captureFrame();
    if (!selfie) {
      const errText = "Start the camera and wait for the preview to load.";
      if (reasonModal) setModalError(errText); else setMessage({ type: "error", text: errText });
      return;
    }
    if (!location) {
      const errText = "Location required. Please allow GPS access.";
      if (reasonModal) setModalError(errText); else setMessage({ type: "error", text: errText });
      return;
    }

    const payload = { selfie, location };
    if (withReason && reason.trim()) payload.reason = reason.trim();

    try {
      await punchOut(payload).unwrap();
      setMessage({ type: "success", text: "Punched out successfully!" });
      stopCamera();
      setReasonModal(false);
      setModalError("");
      refetch();
    } catch (err) {
      // Backend fallback in case it also enforces the reason check
      if (err?.data?.requiresReason) {
        setWorkedHours(err.data.workedHours);
        setReason("");
        setModalError("");
        setReasonModal(true);
      } else {
        const errText = err?.data?.message || "Punch out failed.";
        if (reasonModal) setModalError(errText); else setMessage({ type: "error", text: errText });
        setReasonModal(false);
      }
    }
  };

  // Distance from office (informational)
  const distanceFromOffice = (() => {
    if (!location || !officeData?.office) return null;
    const { latitude: lat1, longitude: lon1 } = location;
    const { latitude: lat2, longitude: lon2 } = officeData.office;
    const R = 6371000;
    const φ1 = (lat1 * Math.PI) / 180, φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  })();

  const canPunch = !!stream && locationStatus === "done";
  const isLoading = isPunchingIn || isPunchingOut;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* ── Left: camera + actions ── */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-6 space-y-5">

        {/* Today status */}
        {todayRecord && (
          <div className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium border ${
            isPunchedOut
              ? "bg-slate-50 border-slate-200 text-slate-600"
              : "bg-emerald-50 border-emerald-200 text-emerald-700"
          }`}>
            <CheckCircle size={16} />
            {isPunchedOut
              ? `Completed — ${fmtTime(todayRecord.punchIn?.time)} → ${fmtTime(todayRecord.punchOut?.time)} (${todayRecord.workingHours?.toFixed(2)}h)`
              : `Punched in at ${fmtTime(todayRecord.punchIn?.time)} — ongoing`}
          </div>
        )}

        {/* Camera preview */}
        <div className="relative bg-[#0f172a] rounded-2xl overflow-hidden aspect-video flex items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className={`w-full h-full object-cover ${stream ? "block" : "hidden"}`}
          />
          <canvas ref={canvasRef} className="hidden" />

          {!stream && (
            <div className="flex flex-col items-center gap-3 text-white/50">
              <CameraOff size={36} />
              <p className="text-sm">Camera is off</p>
            </div>
          )}

          {/* Camera toggle */}
          <button
            onClick={stream ? stopCamera : startCamera}
            type="button"
            className={`absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer border-0 transition-colors ${
              stream
                ? "bg-red-500/90 text-white hover:bg-red-600"
                : "bg-white/90 text-[#0f172a] hover:bg-white"
            }`}
          >
            {stream ? <><CameraOff size={12} /> Stop</> : <><Camera size={12} /> Start Camera</>}
          </button>
        </div>

        {cameraError && (
          <div className="flex gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-600">
            <AlertCircle size={14} className="shrink-0 mt-0.5" /> {cameraError}
          </div>
        )}

        {/* Location */}
        <div className="flex items-center justify-between bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            <MapPin size={15} className={
              locationStatus === "done" ? "text-emerald-500" :
              locationStatus === "error" ? "text-red-400" : "text-[#94a3b8]"
            } />
            {locationStatus === "idle" && <span className="text-[#64748b]">Location not fetched</span>}
            {locationStatus === "getting" && <span className="text-[#64748b] animate-pulse">Getting location…</span>}
            {locationStatus === "done" && (
              <span className="text-emerald-700 font-medium">
                Location acquired
                {distanceFromOffice !== null && (
                  <span className={`ml-2 text-xs font-normal ${
                    distanceFromOffice <= (officeData?.office?.radiusMeters ?? 100)
                      ? "text-emerald-600" : "text-red-500"
                  }`}>
                    · {distanceFromOffice}m from office
                  </span>
                )}
              </span>
            )}
            {locationStatus === "error" && <span className="text-red-500 text-xs">{locationError}</span>}
          </div>
          <button
            onClick={getLocation}
            type="button"
            className="flex items-center gap-1 text-xs text-[#4f46e5] font-medium cursor-pointer border-0 bg-transparent hover:underline"
          >
            <RefreshCw size={12} />
            {locationStatus === "idle" ? "Get GPS" : "Retry"}
          </button>
        </div>

        {/* Punch buttons */}
        {!isPunchedOut && (
          <div className="flex gap-3">
            {!isPunchedIn && (
              <button
                className="flex-1 flex items-center justify-center gap-2 bg-[#4f46e5] text-white rounded-xl py-3 text-sm font-semibold cursor-pointer border-0 hover:bg-[#4338ca] transition-colors disabled:opacity-40"
                disabled={!canPunch || isLoading}
                onClick={handlePunchIn}
                type="button"
              >
                <LogIn size={16} />
                {isPunchingIn ? "Punching in…" : "Punch In"}
              </button>
            )}
            {isPunchedIn && !isPunchedOut && (
              <button
                className="flex-1 flex items-center justify-center gap-2 bg-rose-600 text-white rounded-xl py-3 text-sm font-semibold cursor-pointer border-0 hover:bg-rose-700 transition-colors disabled:opacity-40"
                disabled={!canPunch || isLoading}
                onClick={() => handlePunchOut(false)}
                type="button"
              >
                <LogOut size={16} />
                {isPunchingOut ? "Punching out…" : "Punch Out"}
              </button>
            )}
          </div>
        )}

        {!canPunch && !isPunchedOut && (
          <p className="text-xs text-[#94a3b8] text-center">
            {!stream && locationStatus !== "done" && "Start camera and get GPS location to punch"}
            {!stream && locationStatus === "done" && "Start camera to punch"}
            {stream && locationStatus !== "done" && "Get GPS location to punch"}
          </p>
        )}

        {message && (
          <div className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm ${
            message.type === "error"
              ? "bg-red-50 border border-red-200 text-red-600"
              : "bg-emerald-50 border-emerald-200 text-emerald-700"
          }`}>
            {message.type === "error" ? <AlertCircle size={15} /> : <CheckCircle size={15} />}
            {message.text}
          </div>
        )}
      </div>

      {/* ── Right: calendar ── */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-6 space-y-4">

        {/* Header + month nav */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays size={16} className="text-[#64748b]" />
            <h3 className="text-base font-semibold text-[#0f172a]">My Attendance</h3>
          </div>
          <div className="flex items-center gap-1">
            <button type="button" onClick={prevMonth}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[#64748b] hover:bg-[#f1f5f9] border-0 bg-transparent cursor-pointer">
              <ChevronLeft size={15} />
            </button>
            <span className="text-sm font-semibold text-[#0f172a] min-w-[110px] text-center">
              {new Date(calMonth + "-01T12:00:00").toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </span>
            <button type="button" onClick={nextMonth}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[#64748b] hover:bg-[#f1f5f9] border-0 bg-transparent cursor-pointer">
              <ChevronRight size={15} />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 flex-wrap">
          {[
            { color: "bg-[#4f46e5]",   label: "Completed" },
            { color: "bg-emerald-400", label: "Checked In" },
            { color: "bg-amber-400",   label: "Incomplete" },
            { color: "bg-purple-500",  label: "Half Day" },
            { color: "bg-red-400",     label: "Absent" }
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${color}`} />
              <span className="text-[10px] text-[#94a3b8]">{label}</span>
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <MonthCalendar
          calMonth={calMonth}
          recordMap={recordMap}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />

        {/* Detail card for selected day */}
        {selectedDate && recordMap[selectedDate] && (
          <DayDetailCard
            date={selectedDate}
            rec={recordMap[selectedDate]}
            onClose={() => setSelectedDate(null)}
          />
        )}
        {selectedDate && !recordMap[selectedDate] && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2">
            <XCircle size={14} className="text-red-400 shrink-0" />
            <p className="text-xs text-red-600">No attendance record for this day.</p>
          </div>
        )}
      </div>

      {/* ── Early-exit reason modal ── */}
      {reasonModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                  <Clock size={18} className="text-amber-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0f172a]">Early Punch-Out</h3>
                  <p className="text-xs text-[#64748b]">You need to provide a reason</p>
                </div>
              </div>
              <button onClick={() => { setReasonModal(false); setModalError(""); }} type="button"
                className="text-[#94a3b8] hover:text-[#64748b] border-0 bg-transparent cursor-pointer mt-1">
                <X size={20} />
              </button>
            </div>

            {/* Hours info banner */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <p className="text-sm text-amber-800">
                You've worked{" "}
                <span className="font-bold">
                  {Math.floor(workedHours ?? 0)}h {Math.round(((workedHours ?? 0) % 1) * 60)}m
                </span>{" "}
                out of the required <span className="font-bold">8h</span>. Please explain why you're leaving early.
              </p>
            </div>

            {/* Reason textarea */}
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                autoFocus
                className="w-full border border-[#e2e8f0] rounded-xl px-4 py-3 text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/30 focus:border-[#4f46e5] resize-none"
                placeholder="e.g. Doctor appointment, family emergency, manager approval…"
                rows={3}
                value={reason}
                onChange={(e) => { setReason(e.target.value); setModalError(""); }}
              />
              <p className="text-xs text-[#94a3b8] mt-1">{reason.trim().length}/10 characters minimum</p>
            </div>

            {/* Error inside modal */}
            {modalError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
                <AlertCircle size={14} className="shrink-0" /> {modalError}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => { setReasonModal(false); setModalError(""); }} type="button"
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-[#64748b] bg-[#f1f5f9] border-0 cursor-pointer hover:bg-[#e2e8f0] transition-colors">
                Cancel
              </button>
              <button
                onClick={() => handlePunchOut(true)}
                disabled={reason.trim().length < 10 || isPunchingOut}
                type="button"
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-rose-600 border-0 cursor-pointer hover:bg-rose-700 transition-colors disabled:opacity-40"
              >
                {isPunchingOut ? "Submitting…" : "Submit & Punch Out"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

export default function AttendancePage() {
  const role = useSelector((state) => state.auth.user?.role);
  return role === "admin" ? <AdminAttendanceView /> : <EmployeeAttendanceView />;
}
