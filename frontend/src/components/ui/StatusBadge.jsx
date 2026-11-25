const VARIANT_MAP = {
  active: {
    classes: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    dot: "bg-emerald-400",
    symbol: "●",
    label: "Active",
  },
  success: {
    classes: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    dot: "bg-emerald-400",
    symbol: "✓",
    label: "Success",
  },
  present: {
    classes: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    dot: "bg-emerald-400",
    symbol: "✓",
    label: "Present",
  },
  available: {
    classes: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    dot: "bg-emerald-400",
    symbol: "●",
    label: "Available",
  },
  pending: {
    classes: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    dot: "bg-amber-400",
    symbol: "◷",
    label: "Pending",
  },
  late: {
    classes: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    dot: "bg-amber-400",
    symbol: "◷",
    label: "Late",
  },
  expired: {
    classes: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    dot: "bg-rose-400",
    symbol: "!",
    label: "Expired",
  },
  failed: {
    classes: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    dot: "bg-rose-400",
    symbol: "✕",
    label: "Failed",
  },
  absent: {
    classes: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    dot: "bg-rose-400",
    symbol: "✕",
    label: "Absent",
  },
  unavailable: {
    classes: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    dot: "bg-rose-400",
    symbol: "○",
    label: "Unavailable",
  },
  inactive: {
    classes: "bg-slate-500/20 text-slate-300 border-slate-500/30",
    dot: "bg-slate-400",
    symbol: "○",
    label: "Inactive",
  },
  cancelled: {
    classes: "bg-slate-500/20 text-slate-300 border-slate-500/30",
    dot: "bg-slate-400",
    symbol: "—",
    label: "Cancelled",
  },
  refunded: {
    classes: "bg-sky-500/15 text-sky-300 border-sky-500/30",
    dot: "bg-sky-400",
    symbol: "↺",
    label: "Refunded",
  },
};

const StatusBadge = ({ status, label }) => {
  const key = String(status || "").toLowerCase();
  const config = VARIANT_MAP[key] || {
    classes: "bg-slate-500/20 text-slate-300 border-slate-500/30",
    dot: "bg-slate-400",
    symbol: "•",
    label: status || "Unknown",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.classes}`}
    >
      <span aria-hidden="true" className="text-[10px] leading-none font-bold">
        {config.symbol}
      </span>
      <span>{label || config.label}</span>
    </span>
  );
};

export default StatusBadge;
