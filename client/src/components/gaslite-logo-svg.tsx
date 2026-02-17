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
  sm: 0.65,
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

function FlameIcon({ uid, height }: { uid: string; height: number }) {
  const width = Math.round(height * (33 / 46));
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 33 46"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ alignSelf: "center", flexShrink: 0 }}
    >
      <defs>
        <linearGradient id={`${uid}-fo`} x1="16.5" y1="0" x2="16.5" y2="46" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="20%" stopColor="#C4E4FF" />
          <stop offset="50%" stopColor="#3399FF" />
          <stop offset="80%" stopColor="#0060DD" />
          <stop offset="100%" stopColor="#003DAA" />
        </linearGradient>
        <linearGradient id={`${uid}-fi`} x1="16.5" y1="20" x2="16.5" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
          <stop offset="60%" stopColor="#80BBFF" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#0055DD" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      <path
        d="M16.5 0C16.5 0 15.8 2.5 15 5C13.5 10 10 15.5 7.5 21C4.5 28 4 33 6 37C8 41.5 11.5 44.5 16.5 46C21.5 44.5 25 41.5 27 37C29 33 28.5 28 25.5 21C23 15.5 19.5 10 18 5C17.2 2.5 16.5 0 16.5 0Z"
        fill={`url(#${uid}-fo)`}
      />
      <path
        d="M16.5 20C16.5 20 14 25 12.5 29C11 33 11.5 37 13.5 40C14.5 42 15.5 43 16.5 43.5C17.5 43 18.5 42 19.5 40C21.5 37 22 33 20.5 29C19 25 16.5 20 16.5 20Z"
        fill={`url(#${uid}-fi)`}
      />
    </svg>
  );
}

export function GasliteLogoSvg({ size = "md", className = "", showTagline = false, showFlame = false, animate = true }: GasliteLogoSvgProps) {
  const uid = useId().replace(/:/g, "");
  const isDark = useIsDark();
  const scale = scaleMap[size];

  const baseFontSize = 38;
  const fontSize = baseFontSize * scale;
  const flameHeight = Math.round(fontSize * 1.2);
  const flameMargin = Math.round(5 * scale);

  const gasColor = isDark ? "#FFFFFF" : "#1B2A4A";
  const taglineColor = isDark ? "rgba(255,255,255,0.5)" : "#8899AA";

  const Wrapper = animate ? motion.div : "div";
  const wrapperProps = animate
    ? { initial: { opacity: 0, scale: 0.97 }, animate: { opacity: 1, scale: 1 }, transition: { duration: 0.4, ease: "easeOut" } }
    : {};

  return (
    <Link href="/" className={`flex items-center shrink-0 ${className}`} data-testid="gaslite-logo">
      <Wrapper {...(wrapperProps as any)} className="gaslite-logo" style={{ display: "inline-flex", alignItems: "center" }}>
        {showFlame && (
          <div style={{ marginRight: `${flameMargin}px` }}>
            <FlameIcon uid={uid} height={flameHeight} />
          </div>
        )}
        <div className="logo-text-group" style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "baseline", lineHeight: 1 }}>
            <span
              style={{
                fontSize: `${fontSize}px`,
                fontWeight: 700,
                letterSpacing: "-0.3px",
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
                letterSpacing: "-0.3px",
                background: "linear-gradient(180deg, #5AB0FF 0%, #0052EE 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontFamily: "'Inter', 'SF Pro Display', system-ui, -apple-system, sans-serif",
              }}
            >
              Lite
            </span>
          </div>
          {showTagline && (
            <span
              style={{
                fontSize: `${fontSize * 0.265}px`,
                fontWeight: 600,
                letterSpacing: "2.5px",
                color: taglineColor,
                marginTop: "1px",
                fontFamily: "'Inter', 'SF Pro Display', system-ui, -apple-system, sans-serif",
                textTransform: "uppercase" as const,
              }}
            >
              FAST.{"\u2002"}SAFE.{"\u2002"}RELIABLE
            </span>
          )}
        </div>
      </Wrapper>
    </Link>
  );
}

export function GasliteFlameIcon({ className = "h-10 w-10" }: { className?: string }) {
  const uid = useId().replace(/:/g, "");

  return (
    <svg
      className={className}
      viewBox="0 0 33 46"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Gaslite"
    >
      <defs>
        <linearGradient id={`${uid}-fo`} x1="16.5" y1="0" x2="16.5" y2="46" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="20%" stopColor="#C4E4FF" />
          <stop offset="50%" stopColor="#3399FF" />
          <stop offset="80%" stopColor="#0060DD" />
          <stop offset="100%" stopColor="#003DAA" />
        </linearGradient>
        <linearGradient id={`${uid}-fi`} x1="16.5" y1="20" x2="16.5" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
          <stop offset="60%" stopColor="#80BBFF" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#0055DD" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      <path
        d="M16.5 0C16.5 0 15.8 2.5 15 5C13.5 10 10 15.5 7.5 21C4.5 28 4 33 6 37C8 41.5 11.5 44.5 16.5 46C21.5 44.5 25 41.5 27 37C29 33 28.5 28 25.5 21C23 15.5 19.5 10 18 5C17.2 2.5 16.5 0 16.5 0Z"
        fill={`url(#${uid}-fo)`}
      />
      <path
        d="M16.5 20C16.5 20 14 25 12.5 29C11 33 11.5 37 13.5 40C14.5 42 15.5 43 16.5 43.5C17.5 43 18.5 42 19.5 40C21.5 37 22 33 20.5 29C19 25 16.5 20 16.5 20Z"
        fill={`url(#${uid}-fi)`}
      />
    </svg>
  );
}
