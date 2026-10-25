interface BatikOrnamentProps {
  className?: string;
  opacity?: number;
}

/**
 * Komponen dekoratif ornamen halus bermotif batik pesisir khas Pacitan (Batik Pace)
 * Diterapkan secara halus sebagai pembatas atau latar belakang aksen.
 */
export function BatikOrnament({ className = '', opacity = 0.08 }: BatikOrnamentProps) {
  return (
    <div
      className={`pointer-events-none select-none overflow-hidden ${className}`}
      style={{ opacity }}
      aria-hidden="true"
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <pattern id="batik-pace-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
          {/* Geometris Pace Berulang */}
          <path
            d="M20 0 L40 20 L20 40 L0 20 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          />
          <circle cx="20" cy="20" r="6" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="20" cy="20" r="2" fill="currentColor" />
          <path d="M0 0 L10 10 M30 30 L40 40 M40 0 L30 10 M10 30 L0 40" stroke="currentColor" strokeWidth="0.8" />
        </pattern>
        <rect width="100%" height="100%" fill="url(#batik-pace-pattern)" />
      </svg>
    </div>
  );
}
