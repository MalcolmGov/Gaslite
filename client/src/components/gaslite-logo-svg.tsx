import { Link } from "wouter";
import { useEffect, useState, useId } from "react";
import { motion } from "framer-motion";

interface GasliteLogoSvgProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showTagline?: boolean;
  showFlame?: boolean;
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

export function GasliteLogoSvg({ size = "md", className = "", showTagline = false, showFlame = false, animate = true }: GasliteLogoSvgProps) {
  const uid = useId().replace(/:/g, "");
  const isDark = useIsDark();
  const { width } = sizeConfig[size];

  const flameW = showFlame ? 22 : 0;
  const textX = showFlame ? 26 : 4;
  const svgW = showFlame ? 220 : 200;
  const viewBoxH = showTagline ? 58 : 44;

  const gasColor = isDark ? "#FFFFFF" : "#1a1a2e";
  const taglineColor = isDark ? "rgba(255,255,255,0.6)" : "#888888";

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
            <linearGradient id={`${uid}-lite`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#60B5FF" />
              <stop offset="100%" stopColor="#0066FF" />
            </linearGradient>
            {showFlame && (
              <>
                <linearGradient id={`${uid}-flame`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="50%" stopColor="#60B5FF" />
                  <stop offset="100%" stopColor="#0055CC" />
                </linearGradient>
                <linearGradient id={`${uid}-flame-inner`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="50%" stopColor="#80CCFF" />
                  <stop offset="100%" stopColor="#0066FF" />
                </linearGradient>
              </>
            )}
          </defs>

          {showFlame && (
            <g transform="translate(0, 2) scale(0.5)">
              <path
                d="M16 0C16 0 6 12 4 22C2 32 8 42 16 44C24 42 30 32 28 22C26 12 16 0 16 0Z"
                fill={`url(#${uid}-flame)`}
              />
              <path
                d="M16 18C16 18 11 26 10 31C9 36 12 41 16 42C20 41 23 36 22 31C21 26 16 18 16 18Z"
                fill={`url(#${uid}-flame-inner)`}
                opacity="0.6"
              />
            </g>
          )}

          <text
            x={textX}
            y="30"
            fontFamily="'Inter', 'SF Pro Display', system-ui, -apple-system, sans-serif"
            fontSize="28"
            fontWeight="700"
            letterSpacing="-0.5"
            style={{ lineHeight: 1 }}
          >
            <tspan fill={gasColor}>Gas</tspan>
            <tspan fill={`url(#${uid}-lite)`}>Lite</tspan>
          </text>

          {showTagline && (
            <text
              x={textX + 1}
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
      viewBox="0 0 32 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Gaslite"
    >
      <defs>
        <linearGradient id={`${uid}-flame`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="50%" stopColor="#60B5FF" />
          <stop offset="100%" stopColor="#0055CC" />
        </linearGradient>
        <linearGradient id={`${uid}-flame-inner`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="50%" stopColor="#80CCFF" />
          <stop offset="100%" stopColor="#0066FF" />
        </linearGradient>
      </defs>
      <path
        d="M16 0C16 0 6 12 4 22C2 32 8 42 16 44C24 42 30 32 28 22C26 12 16 0 16 0Z"
        fill={`url(#${uid}-flame)`}
      />
      <path
        d="M16 18C16 18 11 26 10 31C9 36 12 41 16 42C20 41 23 36 22 31C21 26 16 18 16 18Z"
        fill={`url(#${uid}-flame-inner)`}
        opacity="0.6"
      />
    </svg>
  );
}
