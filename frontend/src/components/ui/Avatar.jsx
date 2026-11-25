import { useState } from "react";

const SIZE_MAP = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-20 h-20 text-2xl",
};

const Avatar = ({ src, name, size = "md", className = "" }) => {
  const [imgFailed, setImgFailed] = useState(false);
  const initial = (name || "U").trim().charAt(0).toUpperCase();
  const dimensions = SIZE_MAP[size] || SIZE_MAP.md;

  if (src && !imgFailed) {
    return (
      <img
        src={src}
        alt={name ? `${name}'s profile` : "Profile"}
        onError={() => setImgFailed(true)}
        className={`${dimensions} rounded-full object-cover ring-2 ring-indigo-500/30 shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className={`${dimensions} rounded-full bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-950/50 ring-2 ring-white/10 shrink-0 ${className}`}
    >
      {initial}
    </div>
  );
};

export default Avatar;
