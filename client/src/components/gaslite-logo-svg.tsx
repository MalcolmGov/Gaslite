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

function FlameIcon({ uid, isDark, x = 0, y = 0, scale = 1 }: { uid: string; isDark?: boolean; x?: number; y?: number; scale?: number }) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      <path
        d="M15.5 48 C15.5 48 4 40.5 3 28 C2.2 18.5 5.5 11 10 5.5 C12.5 2.5 15.5 0.5 15.5 0.5 C15.5 0.5 13 8 13.5 14 C14 19 16 22.5 17 24.5 C18 22 19.5 17 21 13 C22.5 9 24 6 26 4 C26 4 30 8.5 31.5 15 C33 22 32.5 28 30 34 C27.5 40 22 46 15.5 48Z"
        fill={`url(#${uid}-fg)`}
      />
      <path
        d="M15 48 C15 48 9 43 8.5 35 C8 29 10 24 12.5 20 C14 17.5 15.5 16 15.5 16 C15.5 16 14.5 22 15 26 C15.5 30 17 33 18.5 34.5 C19.5 32 21 27.5 22 24 C22.8 21.5 23.5 19 24.5 17.5 C24.5 17.5 27 21 27.5 26.5 C28 32 26 38 22.5 43 C20 46 17 48 15 48Z"
        fill={`url(#${uid}-fi)`}
      />
    </g>
  );
}

export function GasliteLogoSvg({ size = "md", className = "", showTagline = false, animate = true }: GasliteLogoSvgProps) {
  const uid = useId().replace(/:/g, "");
  const isDark = useIsDark();
  const { width } = sizeConfig[size];
  const viewBoxH = showTagline ? 58 : 44;
  const svgW = 200;
  const svgH = viewBoxH;

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
          height={Math.round(width * (svgH / svgW))}
          viewBox={`0 0 ${svgW} ${svgH}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="GasLite - Fast. Safe. Reliable."
        >
          <defs>
            <linearGradient id={`${uid}-fg`} x1="0.1" y1="0.9" x2="0.8" y2="0.1">
              <stop offset="0%" stopColor="#0047AB" />
              <stop offset="60%" stopColor="#0080DD" />
              <stop offset="100%" stopColor="#00BFFF" />
            </linearGradient>
            <linearGradient id={`${uid}-fi`} x1="0.15" y1="0.85" x2="0.75" y2="0.15">
              <stop offset="0%" stopColor="#40C4FF" />
              <stop offset="100%" stopColor="#E0F7FF" />
            </linearGradient>
            <linearGradient id={`${uid}-lg`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#00BFFF" />
              <stop offset="100%" stopColor="#0047AB" />
            </linearGradient>
          </defs>

          <FlameIcon uid={uid} isDark={isDark} x={2} y={2} scale={0.82} />

          <text
            x="32"
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
              x="33"
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
      viewBox="0 0 34 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Gaslite"
    >
      <defs>
        <linearGradient id={`${uid}-fig`} x1="0.1" y1="0.9" x2="0.8" y2="0.1">
          <stop offset="0%" stopColor="#0047AB" />
          <stop offset="60%" stopColor="#0080DD" />
          <stop offset="100%" stopColor="#00BFFF" />
        </linearGradient>
        <linearGradient id={`${uid}-fii`} x1="0.15" y1="0.85" x2="0.75" y2="0.15">
          <stop offset="0%" stopColor="#40C4FF" />
          <stop offset="100%" stopColor="#E0F7FF" />
        </linearGradient>
      </defs>
      <path
        d="M15.5 48 C15.5 48 4 40.5 3 28 C2.2 18.5 5.5 11 10 5.5 C12.5 2.5 15.5 0.5 15.5 0.5 C15.5 0.5 13 8 13.5 14 C14 19 16 22.5 17 24.5 C18 22 19.5 17 21 13 C22.5 9 24 6 26 4 C26 4 30 8.5 31.5 15 C33 22 32.5 28 30 34 C27.5 40 22 46 15.5 48Z"
        fill={`url(#${uid}-fig)`}
      />
      <path
        d="M15 48 C15 48 9 43 8.5 35 C8 29 10 24 12.5 20 C14 17.5 15.5 16 15.5 16 C15.5 16 14.5 22 15 26 C15.5 30 17 33 18.5 34.5 C19.5 32 21 27.5 22 24 C22.8 21.5 23.5 19 24.5 17.5 C24.5 17.5 27 21 27.5 26.5 C28 32 26 38 22.5 43 C20 46 17 48 15 48Z"
        fill={`url(#${uid}-fii)`}
      />
    </svg>
  );
}
