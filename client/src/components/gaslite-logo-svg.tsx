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

const scaleMap = {
  sm: 0.6,
  md: 0.75,
  lg: 1.0,
  xl: 1.5,
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
  const scale = scaleMap[size];
  const mode = isDark ? "dark" : "light";

  const baseFontSize = 36;
  const fontSize = baseFontSize * scale;
  const taglineFontSize = 8.5 * scale;
  const taglineLetterSpacing = 2.5 * scale;
  const flameHeight = fontSize * 1.2;
  const flameWidth = flameHeight * (32 / 44);

  const gasColor = mode === "dark" ? "#FFFFFF" : "#1a1a2e";
  const taglineColor = mode === "dark" ? "rgba(255,255,255,0.6)" : "#888888";

  const Wrapper = animate ? motion.div : "div";
  const wrapperProps = animate
    ? { initial: { opacity: 0, scale: 0.97 }, animate: { opacity: 1, scale: 1 }, transition: { duration: 0.4, ease: "easeOut" } }
    : {};

  return (
    <Link href="/" className={`flex items-center shrink-0 ${className}`} data-testid="gaslite-logo">
      <Wrapper {...(wrapperProps as any)} style={{ display: "inline-flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: showFlame ? 4 * scale : 0 }}>
          {showFlame && (
            <svg
              width={flameWidth}
              height={flameHeight}
              viewBox="0 0 32 44"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ alignSelf: "center", flexShrink: 0 }}
            >
              <defs>
                <linearGradient id={`${uid}-fm`} x1="16" y1="0" x2="16" y2="44" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="50%" stopColor="#60B5FF" />
                  <stop offset="100%" stopColor="#0055CC" />
                </linearGradient>
                <linearGradient id={`${uid}-fi`} x1="16" y1="18" x2="16" y2="42" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="50%" stopColor="#80CCFF" />
                  <stop offset="100%" stopColor="#0066FF" />
                </linearGradient>
              </defs>
              <path
                d="M16 0C16 0 6 12 4 22C2 32 8 42 16 44C24 42 30 32 28 22C26 12 16 0 16 0Z"
                fill={`url(#${uid}-fm)`}
              />
              <path
                d="M16 18C16 18 11 26 10 31C9 36 12 41 16 42C20 41 23 36 22 31C21 26 16 18 16 18Z"
                fill={`url(#${uid}-fi)`}
                opacity="0.6"
              />
            </svg>
          )}
          <div style={{ display: "flex", alignItems: "baseline", lineHeight: 1, letterSpacing: "-0.5px" }}>
            <span
              style={{
                fontSize: `${fontSize}px`,
                fontWeight: 700,
                color: gasColor,
                fontFamily: "'Inter', 'SF Pro Display', system-ui, -apple-system, sans-serif",
              }}
            >
              Gas
            </span>
            <span
              style={{
                fontSize: `${fontSize}px`,
                fontWeight: 700,
                background: "linear-gradient(180deg, #5AB0FF 0%, #0055FF 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontFamily: "'Inter', 'SF Pro Display', system-ui, -apple-system, sans-serif",
              }}
            >
              Lite
            </span>
          </div>
        </div>
        {showTagline && (
          <span
            style={{
              fontSize: `${taglineFontSize}px`,
              fontWeight: 600,
              letterSpacing: `${taglineLetterSpacing}px`,
              color: taglineColor,
              marginTop: 2 * scale,
              fontFamily: "'Inter', 'SF Pro Display', system-ui, -apple-system, sans-serif",
              textTransform: "uppercase" as const,
              paddingLeft: showFlame ? (flameWidth + 4 * scale) : 0,
            }}
          >
            FAST. SAFE. RELIABLE.
          </span>
        )}
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
        <linearGradient id={`${uid}-fm`} x1="16" y1="0" x2="16" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="50%" stopColor="#60B5FF" />
          <stop offset="100%" stopColor="#0055CC" />
        </linearGradient>
        <linearGradient id={`${uid}-fi`} x1="16" y1="18" x2="16" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="50%" stopColor="#80CCFF" />
          <stop offset="100%" stopColor="#0066FF" />
        </linearGradient>
      </defs>
      <path
        d="M16 0C16 0 6 12 4 22C2 32 8 42 16 44C24 42 30 32 28 22C26 12 16 0 16 0Z"
        fill={`url(#${uid}-fm)`}
      />
      <path
        d="M16 18C16 18 11 26 10 31C9 36 12 41 16 42C20 41 23 36 22 31C21 26 16 18 16 18Z"
        fill={`url(#${uid}-fi)`}
        opacity="0.6"
      />
    </svg>
  );
}
