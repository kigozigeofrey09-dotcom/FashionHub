import React from 'react';

interface TerrabokLogoProps {
  showSlogan?: boolean;
  compact?: boolean;
  dark?: boolean;
  className?: string;
}

export const TerrabokLogo: React.FC<TerrabokLogoProps> = ({
  showSlogan = false,
  compact = false,
  dark = false,
  className = '',
}) => {
  const textColor = dark ? 'text-white' : 'text-stone-900';
  const sloganColor = dark ? 'text-stone-400' : 'text-stone-500';

  return (
    <span className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* 3D-beveled TB / Terrabok emblem badge */}
      <span
        className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-300/40 bg-gradient-to-br from-amber-500 via-orange-600 to-stone-900 text-white shadow-[0_4px_12px_rgba(180,83,9,0.35),inset_0_1px_1px_rgba(255,255,255,0.45)]"
        aria-hidden="true"
      >
        <span className="text-xs font-black tracking-tighter drop-shadow-[0_1px_2px_rgba(0,0,0,0.75)]">
          TB
        </span>
      </span>

      <span className="flex flex-col leading-none">
        <span
          className={`font-black tracking-[-0.03em] drop-shadow-[0_1px_1px_rgba(0,0,0,0.18)] ${
            compact ? 'text-lg' : 'text-xl'
          } ${textColor}`}
        >
          TERRA<span className="bg-gradient-to-r from-amber-600 via-orange-500 to-amber-700 bg-clip-text text-transparent">BOK</span>
        </span>

        {showSlogan && (
          <span
            className={`mt-1 text-[9px] font-semibold uppercase tracking-[0.18em] ${sloganColor}`}
          >
            Fashion Without Limits.
          </span>
        )}
      </span>
    </span>
  );
};

export default TerrabokLogo;