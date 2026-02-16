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
            <linearGradient id={`${uid}-fg`} x1="0" y1="1" x2="0.4" y2="0">
              <stop offset="0%" stopColor="#0047AB" />
              <stop offset="100%" stopColor="#00BFFF" />
            </linearGradient>
            <linearGradient id={`${uid}-fi`} x1="0.2" y1="1" x2="0.6" y2="0">
              <stop offset="0%" stopColor="#00BFFF" />
              <stop offset="100%" stopColor="#7DD3FC" />
            </linearGradient>
            <linearGradient id={`${uid}-lg`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#00BFFF" />
              <stop offset="100%" stopColor="#0047AB" />
            </linearGradient>
          </defs>

          <g transform="translate(4, 2) rotate(3, 14, 20)">
            <path
              d="M14 40 C14 40 1 30 3 15 C4 8 9 2 14 0 C14 0 12 11 14 15 L16 11 C16 11 24 6 26 18 C28 30 22 38 14 40Z"
              fill={`url(#${uid}-fg)`}
            />
            <path
              d="M14 40 C14 40 7 34 8 24 C8.5 19 11 15 14 13 C14 13 12.5 22 14 26 L16 22 C16 22 21 19 22 27 C23 35 18 40 14 40Z"
              fill={`url(#${uid}-fi)`}
              opacity="0.9"
            />
          </g>

          <text
            x="38"
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
              x="39"
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
      viewBox="0 0 36 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Gaslite"
    >
      <defs>
        <linearGradient id={`${uid}-fig`} x1="0" y1="1" x2="0.4" y2="0">
          <stop offset="0%" stopColor="#0047AB" />
          <stop offset="100%" stopColor="#00BFFF" />
        </linearGradient>
        <linearGradient id={`${uid}-fii`} x1="0.2" y1="1" x2="0.6" y2="0">
          <stop offset="0%" stopColor="#00BFFF" />
          <stop offset="100%" stopColor="#7DD3FC" />
        </linearGradient>
      </defs>
      <g transform="rotate(3, 18, 20)">
        <path
          d="M18 40 C18 40 3 30 5 15 C6 8 12 2 18 0 C18 0 15.5 12 18 16 L21 11 C21 11 31 7 33 20 C35 33 27 40 18 40Z"
          fill={`url(#${uid}-fig)`}
        />
        <path
          d="M18 40 C18 40 10 34 11 24 C11.5 19 14.5 15 18 13 C18 13 16 23 18 27 L21 22 C21 22 27 19 28 28 C29 37 23 40 18 40Z"
          fill={`url(#${uid}-fii)`}
          opacity="0.9"
        />
      </g>
    </svg>
  );
}
