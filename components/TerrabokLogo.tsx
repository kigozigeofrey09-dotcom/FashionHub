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
  const letterShadow = dark
    ? 'drop-shadow-[0_2px_0_#3b1d0e] drop-shadow-[0_5px_10px_rgba(0,0,0,0.65)]'
    : 'drop-shadow-[0_2px_0_#7c3f1d] drop-shadow-[0_5px_9px_rgba(45,24,12,0.28)]';

  const sloganColor = dark ? 'text-stone-300' : 'text-stone-700';

  return (
    <span className={`inline-flex flex-col items-start select-none ${className}`}>
      <span
        className={`inline-flex items-center font-black tracking-[-0.04em] leading-none ${
          compact ? 'text-lg sm:text-xl' : 'text-2xl sm:text-3xl'
        } ${letterShadow}`}
      >
        {/* TERRA in 3D copper/bronze gradient */}
        <span className="bg-gradient-to-b from-amber-200 via-amber-600 to-amber-900 bg-clip-text text-transparent">
          TERRA
        </span>

        {/* Intertwined 3D BO ligature mark */}
        <svg
          viewBox="0 0 56 36"
          className={`mx-[1px] shrink-0 overflow-visible ${
            compact ? 'h-[1.05em] w-auto' : 'h-[1.12em] w-auto'
          }`}
          aria-label="BO"
          role="img"
        >
          <defs>
            <linearGradient id="tbBronze3D" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FDE68A" />
              <stop offset="35%" stopColor="#D97706" />
              <stop offset="75%" stopColor="#9A3412" />
              <stop offset="100%" stopColor="#451A03" />
            </linearGradient>
            <linearGradient id="tbGoldRim" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFBEB" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#B45309" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          {/* Extruded 3D depth layer */}
          <g transform="translate(1.5, 2.2)" opacity="0.65">
            <path
              d="M5 5 H18 C23.5 5 26 7.8 26 11.8 C26 14.4 24.4 16.4 22 17.3 C25 18.2 27 20.6 27 24 C27 28.4 23.6 31 17.8 31 H5 Z M11.5 10.5 V15.2 H17 C19.2 15.2 20.4 14.1 20.4 12.6 C20.4 11.2 19.2 10.5 17 10.5 Z M11.5 19.8 V25.5 H17.5 C19.9 25.5 21.2 24.4 21.2 22.6 C21.2 20.9 19.9 19.8 17.5 19.8 Z"
              fill="#3B1A08"
            />
            <path
              d="M36 4.5 C45.8 4.5 52 10.4 52 18 C52 25.6 45.8 31.5 36 31.5 C26.2 31.5 20 25.6 20 18 C20 10.4 26.2 4.5 36 4.5 Z M36 10.3 C30.1 10.3 26.4 13.5 26.4 18 C26.4 22.5 30.1 25.7 36 25.7 C41.9 25.7 45.6 22.5 45.6 18 C45.6 13.5 41.9 10.3 36 10.3 Z"
              fill="#3B1A08"
            />
          </g>

          {/* Front 3D B */}
          <path
            d="M5 5 H18 C23.5 5 26 7.8 26 11.8 C26 14.4 24.4 16.4 22 17.3 C25 18.2 27 20.6 27 24 C27 28.4 23.6 31 17.8 31 H5 Z M11.5 10.5 V15.2 H17 C19.2 15.2 20.4 14.1 20.4 12.6 C20.4 11.2 19.2 10.5 17 10.5 Z M11.5 19.8 V25.5 H17.5 C19.9 25.5 21.2 24.4 21.2 22.6 C21.2 20.9 19.9 19.8 17.5 19.8 Z"
            fill="url(#tbBronze3D)"
            stroke="url(#tbGoldRim)"
            strokeWidth="0.9"
          />

          {/* Intertwined 3D O */}
          <path
            d="M36 4.5 C45.8 4.5 52 10.4 52 18 C52 25.6 45.8 31.5 36 31.5 C26.2 31.5 20 25.6 20 18 C20 10.4 26.2 4.5 36 4.5 Z M36 10.3 C30.1 10.3 26.4 13.5 26.4 18 C26.4 22.5 30.1 25.7 36 25.7 C41.9 25.7 45.6 22.5 45.6 18 C45.6 13.5 41.9 10.3 36 10.3 Z"
            fill="url(#tbBronze3D)"
            stroke="url(#tbGoldRim)"
            strokeWidth="0.9"
            fillRule="evenodd"
          />
        </svg>

        {/* K in 3D copper/bronze gradient */}
        <span className="bg-gradient-to-b from-amber-200 via-amber-600 to-amber-900 bg-clip-text text-transparent">
          K
        </span>
      </span>

      {showSlogan && (
        <span
          className={`mt-1.5 border-t border-amber-700/35 pt-1 text-[9.5px] font-bold uppercase tracking-[0.2em] ${sloganColor}`}
        >
          FASHION WITHOUT LIMITS.
        </span>
      )}
    </span>
  );
};

export default TerrabokLogo;