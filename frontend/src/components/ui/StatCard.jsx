const TONES = {
  indigo: {
    iconWrap: "bg-indigo-500/15 text-indigo-300 border-indigo-500/25",
    glow: "from-indigo-500/10 via-transparent to-transparent",
    value: "text-white",
  },
  emerald: {
    iconWrap: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
    glow: "from-emerald-500/10 via-transparent to-transparent",
    value: "text-emerald-300",
  },
  rose: {
    iconWrap: "bg-rose-500/15 text-rose-300 border-rose-500/25",
    glow: "from-rose-500/10 via-transparent to-transparent",
    value: "text-rose-300",
  },
  amber: {
    iconWrap: "bg-amber-500/15 text-amber-300 border-amber-500/25",
    glow: "from-amber-500/10 via-transparent to-transparent",
    value: "text-amber-300",
  },
  sky: {
    iconWrap: "bg-sky-500/15 text-sky-300 border-sky-500/25",
    glow: "from-sky-500/10 via-transparent to-transparent",
    value: "text-sky-300",
  },
  violet: {
    iconWrap: "bg-violet-500/15 text-violet-300 border-violet-500/25",
    glow: "from-violet-500/10 via-transparent to-transparent",
    value: "text-violet-300",
  },
};

const StatCard = ({ label, value, hint, icon: Icon, tone = "indigo" }) => {
  const palette = TONES[tone] || TONES.indigo;

  return (
    <div className="glass-card glass-card-hover relative overflow-hidden rounded-2xl p-5 h-full">
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${palette.glow}`}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
            {label}
          </p>
          <p className={`mt-2 text-2xl sm:text-3xl font-bold font-display tabular-nums ${palette.value}`}>
            {value}
          </p>
          {hint && <p className="mt-1.5 text-xs text-slate-400">{hint}</p>}
        </div>
        {Icon && (
          <div
            className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${palette.iconWrap}`}
          >
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
