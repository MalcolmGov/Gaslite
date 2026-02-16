import { Link } from "wouter";
import { useEffect, useState, useId } from "react";
import { motion } from "framer-motion";

interface GasliteLogoSvgProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showTagline?: boolean;
  animate?: boolean;
}

const sizeConfig = {
  sm: { width: 140, navHeight: 40 },
  md: { width: 180, navHeight: 48 },
  lg: { width: 240, navHeight: 60 },
  xl: { width: 300, navHeight: 72 },
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

function FlamePaths({ uid }: { uid: string }) {
  return (
    <>
      <path
        d="M20 60 C20 60 18.5 58 16 54 C12 47 5 38 4 28 C3 19 6 11 11 5 C13 2.5 15 1 16.5 0 C16.5 3 16 8 16.5 13 C17 18 18.5 22 20 25 C20.5 23 21.5 19.5 23 16 C24.5 12 26 8.5 27.5 6.5 C31 11 33 17 33.5 24 C34 31 32 39 28 46 C25 51 22 56 20 60Z"
        fill={`url(#${uid}-left)`}
      />

      <path
        d="M21 60 C21 60 19 57 18 54 C16 49 14 43 14.5 37 C15 31 17.5 25 20.5 20 C21.5 18.5 22.5 17.5 23 17 C23 20 23 24 23.5 28 C24 32 25 35 26 37 C27 34 28 30 29 26.5 C30 23.5 31 21 32 19.5 C34 23 35 28 34.5 33 C34 38 32 43 29 48 C26.5 52.5 23.5 57 21 60Z"
        fill={`url(#${uid}-right)`}
      />

      <path
        d="M20.5 58 C20.5 58 19.5 55 19 51 C18 45 18.5 39 20 34 C21 30.5 22 28 23 26.5 C23 29 23.2 32 23.5 35 C23.8 38 24.5 40.5 25 42 C25.5 40 26 37 26.5 34.5 C27 32.5 27.5 31 28 30 C29 33 29.5 36 29 40 C28.5 44 27 48 25 52 C23.5 55 21.5 57.5 20.5 58Z"
        fill={`url(#${uid}-inner)`}
      />
    </>
  );
}

export function GasliteLogoSvg({ size = "md", className = "", showTagline = false, animate = true }: GasliteLogoSvgProps) {
  const uid = useId().replace(/:/g, "");
  const isDark = useIsDark();
  const { width } = sizeConfig[size];
  const viewBoxH = showTagline ? 58 : 44;
  const svgW = 200;

  const gasColor = isDark ? "#FFFFFF" : "#0B1F3B";
  const taglineColor = isDark ? "rgba(255,255,255,0.5)" : "rgba(11,31,59,0.45)";

  const Wrapper = animate ? motion.div : "div";
  const wrapperProps = animate
    ? { initial: { opacity: 0, scale: 0.97 }, animate: { opacity: 1, scale: 1 }, transition: { duration: 0.4, ease: "easeOut" } }
    : {};

  return (
    <Link href="/" className={`flex items-center shrink-0 ${className}`} data-testid="gaslite-logo">
      <Wrapper {...(wrapperProps as any)} className="flex items-center">
        <svg
          width={width}
          height={Math.round(width * (viewBoxH / svgW))}
          viewBox={`0 0 ${svgW} ${viewBoxH}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="GasLite - Fast. Safe. Reliable."
        >
          <defs>
            <linearGradient id={`${uid}-left`} x1="0.15" y1="0.95" x2="0.6" y2="0">
              <stop offset="0%" stopColor="#0047AB" />
              <stop offset="50%" stopColor="#0088DD" />
              <stop offset="100%" stopColor="#00DCFF" />
            </linearGradient>
            <linearGradient id={`${uid}-right`} x1="0.3" y1="1" x2="0.85" y2="0.1">
              <stop offset="0%" stopColor="#0047AB" />
              <stop offset="45%" stopColor="#0070CC" />
              <stop offset="100%" stopColor="#00BFFF" />
            </linearGradient>
            <linearGradient id={`${uid}-inner`} x1="0.2" y1="0.9" x2="0.8" y2="0.15">
              <stop offset="0%" stopColor="#00AAEE" />
              <stop offset="50%" stopColor="#40D4FF" />
              <stop offset="100%" stopColor="#B0EDFF" />
            </linearGradient>
            <linearGradient id={`${uid}-lg`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#00BFFF" />
              <stop offset="100%" stopColor="#0047AB" />
            </linearGradient>
          </defs>

          <text
            x="4"
            y="30"
            fontFamily="'Inter', 'SF Pro Display', system-ui, -apple-system, sans-serif"
            fontSize="28"
            fontWeight="800"
            letterSpacing="-0.5"
          >
            <tspan fill={gasColor}>Gas</tspan>
            <tspan fill={`url(#${uid}-lg)`}>Lite</tspan>
          </text>

          {showTagline && (
            <text
              x="5"
              y="50"
              fontFamily="'Inter', 'SF Pro Display', system-ui, -apple-system, sans-serif"
              fontSize="7.5"
              fontWeight="600"
              letterSpacing="3"
              fill={taglineColor}
            >
              FAST. SAFE. RELIABLE.
            </text>
          )}
        </svg>
      </Wrapper>
    </Link>
  );
}

export function GasliteFlameIcon({ className = "h-10 w-10" }: { className?: string }) {
  const uid = useId().replace(/:/g, "");

  return (
    <svg
      className={className}
      viewBox="0 0 38 62"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Gaslite"
    >
      <defs>
        <linearGradient id={`${uid}-left`} x1="0.15" y1="0.95" x2="0.6" y2="0">
          <stop offset="0%" stopColor="#0047AB" />
          <stop offset="50%" stopColor="#0088DD" />
          <stop offset="100%" stopColor="#00DCFF" />
        </linearGradient>
        <linearGradient id={`${uid}-right`} x1="0.3" y1="1" x2="0.85" y2="0.1">
          <stop offset="0%" stopColor="#0047AB" />
          <stop offset="45%" stopColor="#0070CC" />
          <stop offset="100%" stopColor="#00BFFF" />
        </linearGradient>
        <linearGradient id={`${uid}-inner`} x1="0.2" y1="0.9" x2="0.8" y2="0.15">
          <stop offset="0%" stopColor="#00AAEE" />
          <stop offset="50%" stopColor="#40D4FF" />
          <stop offset="100%" stopColor="#B0EDFF" />
        </linearGradient>
      </defs>
      <FlamePaths uid={uid} />
    </svg>
  );
}
