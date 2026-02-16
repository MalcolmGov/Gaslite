import { Link } from "wouter";
import { useEffect, useState } from "react";

interface GasliteLogoSvgProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showTagline?: boolean;
}

const widthMap = {
  sm: 160,
  md: 200,
  lg: 260,
  xl: 320,
};

function useIsDark() {
  const [isDark, setIsDark] = useState(() =>
    typeof document !== "undefined" && document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return isDark;
}

export function GasliteLogoSvg({ size = "md", className = "", showTagline = false }: GasliteLogoSvgProps) {
  const w = widthMap[size];
  const aspect = showTagline ? 3.2 : 3.8;
  const h = Math.round(w / aspect);
  const isDark = useIsDark();

  const gasStartColor = isDark ? "#F0F9FF" : "#0C4A6E";
  const gasMidColor = isDark ? "#BAE6FD" : "#0369A1";
  const gasEndColor = isDark ? "#38BDF8" : "#0EA5E9";

  const liteStartColor = isDark ? "#38BDF8" : "#0EA5E9";
  const liteEndColor = isDark ? "#0EA5E9" : "#0284C7";

  const taglineColor = isDark ? "#7DD3FC" : "#0369A1";

  const uid = `logo-${size}`;

  return (
    <Link href="/" className={`flex items-center ${className}`} data-testid="gaslite-logo">
      <svg
        width={w}
        height={h}
        viewBox={showTagline ? "0 0 360 112" : "0 0 360 95"}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Gaslite - Fast. Safe. Reliable."
      >
        <defs>
          <linearGradient id={`${uid}-flameGrad`} x1="0" y1="1" x2="0.5" y2="0">
            <stop offset="0%" stopColor="#0EA5E9" />
            <stop offset="50%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#7DD3FC" />
          </linearGradient>
          <linearGradient id={`${uid}-flameInner`} x1="0.3" y1="1" x2="0.5" y2="0">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#BAE6FD" />
          </linearGradient>
          <linearGradient id={`${uid}-textGrad`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={gasStartColor} />
            <stop offset="40%" stopColor={gasMidColor} />
            <stop offset="100%" stopColor={gasEndColor} />
          </linearGradient>
          <linearGradient id={`${uid}-liteGrad`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={liteStartColor} />
            <stop offset="100%" stopColor={liteEndColor} />
          </linearGradient>
        </defs>

        <g transform="translate(12, 8)">
          <path
            d="M32 72C32 72 8 56 8 36C8 20 18 8 28 2C28 2 24 18 32 26C40 18 38 8 38 8C50 16 58 28 58 42C58 58 46 72 32 72Z"
            fill={`url(#${uid}-flameGrad)`}
          />
          <path
            d="M32 72C32 72 18 62 18 48C18 38 24 30 32 26C32 26 28 38 32 44C36 38 35 30 35 30C42 36 48 42 48 52C48 64 40 72 32 72Z"
            fill={`url(#${uid}-flameInner)`}
          />
          <path
            d="M32 72C32 72 25 66 25 58C25 52 28 46 32 44C32 44 30 52 32 56C34 52 33 48 33 48C37 52 40 55 40 60C40 68 36 72 32 72Z"
            fill={isDark ? "#E0F2FE" : "#BAE6FD"}
            opacity="0.9"
          />
        </g>

        <text
          x="82"
          y="58"
          fontFamily="'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif"
          fontSize="48"
          fontWeight="800"
          letterSpacing="-1"
        >
          <tspan fill={`url(#${uid}-textGrad)`}>Gas</tspan>
          <tspan fill={`url(#${uid}-liteGrad)`}>Lite</tspan>
        </text>

        {showTagline && (
          <text
            x="84"
            y="92"
            fontFamily="'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif"
            fontSize="13"
            fontWeight="600"
            letterSpacing="4"
            fill={taglineColor}
          >
            FAST. SAFE. RELIABLE.
          </text>
        )}
      </svg>
    </Link>
  );
}

export function GasliteFlameIcon({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Gaslite"
    >
      <defs>
        <linearGradient id="flameIconGrad" x1="0" y1="1" x2="0.5" y2="0">
          <stop offset="0%" stopColor="#0EA5E9" />
          <stop offset="50%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#7DD3FC" />
        </linearGradient>
        <linearGradient id="flameIconInner" x1="0.3" y1="1" x2="0.5" y2="0">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#BAE6FD" />
        </linearGradient>
      </defs>
      <path
        d="M32 72C32 72 8 56 8 36C8 20 18 8 28 2C28 2 24 18 32 26C40 18 38 8 38 8C50 16 58 28 58 42C58 58 46 72 32 72Z"
        fill="url(#flameIconGrad)"
      />
      <path
        d="M32 72C32 72 18 62 18 48C18 38 24 30 32 26C32 26 28 38 32 44C36 38 35 30 35 30C42 36 48 42 48 52C48 64 40 72 32 72Z"
        fill="url(#flameIconInner)"
      />
      <path
        d="M32 72C32 72 25 66 25 58C25 52 28 46 32 44C32 44 30 52 32 56C34 52 33 48 33 48C37 52 40 55 40 60C40 68 36 72 32 72Z"
        fill="#E0F2FE"
        opacity="0.9"
      />
    </svg>
  );
}
