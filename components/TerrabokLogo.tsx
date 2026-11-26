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
  const baseColor = dark ? 'text-white' : 'text-stone-900';
  const sloganColor = dark ? 'text-stone-400' : 'text-stone-500';

  return (
    <span className={`inline-flex flex-col leading-none select-none ${className}`}>
      <span
        className={`font-extrabold tracking-tight ${
          compact ? 'text-xl' : 'text-2xl'
        } ${baseColor}`}
      >
        Terra<span className="text-amber-600">Bok</span>
      </span>

      {showSlogan && (
        <span
          className={`mt-1 text-[10px] font-medium uppercase tracking-[0.16em] ${sloganColor}`}
        >
          Fashion Without Limits.
        </span>
      )}
    </span>
  );
};

export default TerrabokLogo;