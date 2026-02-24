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
  const width = Math.round(height * 0.7);
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 70 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ alignSelf: "center", flexShrink: 0 }}
    >
      <defs>
        <linearGradient id={`${uid}-fo`} x1="35" y1="0" x2="35" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="40%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
        <linearGradient id={`${uid}-fi`} x1="35" y1="20" x2="35" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7DD3FC" />
          <stop offset="50%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#0EA5E9" />
        </linearGradient>
      </defs>
      <path
        d="M35 2 C35 2, 22 20, 16 35 C8 54, 4 65, 6 76 C8 87, 16 95, 28 98 C36 100, 44 98, 50 93 C58 86, 62 75, 58 62 C56 55, 50 46, 46 40 C42 34, 40 28, 42 22 C43 18, 46 14, 50 10 C50 10, 44 16, 40 24 C37 30, 38 36, 42 42 C48 50, 56 58, 58 68 C60 78, 56 88, 46 94 C40 97, 32 98, 24 95 C14 90, 8 80, 10 68 C12 58, 18 48, 24 38 C30 28, 35 16, 35 2Z"
        fill={`url(#${uid}-fo)`}
      />
      <path
        d="M32 42 C32 42, 24 55, 22 65 C20 74, 22 82, 30 86 C35 88, 40 86, 43 82 C47 76, 46 68, 42 60 C39 54, 34 48, 32 42Z"
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
      viewBox="0 0 70 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Gaslite"
    >
      <defs>
        <linearGradient id={`${uid}-fo`} x1="35" y1="0" x2="35" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="40%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
        <linearGradient id={`${uid}-fi`} x1="35" y1="20" x2="35" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7DD3FC" />
          <stop offset="50%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#0EA5E9" />
        </linearGradient>
      </defs>
      <path
        d="M35 2 C35 2, 22 20, 16 35 C8 54, 4 65, 6 76 C8 87, 16 95, 28 98 C36 100, 44 98, 50 93 C58 86, 62 75, 58 62 C56 55, 50 46, 46 40 C42 34, 40 28, 42 22 C43 18, 46 14, 50 10 C50 10, 44 16, 40 24 C37 30, 38 36, 42 42 C48 50, 56 58, 58 68 C60 78, 56 88, 46 94 C40 97, 32 98, 24 95 C14 90, 8 80, 10 68 C12 58, 18 48, 24 38 C30 28, 35 16, 35 2Z"
        fill={`url(#${uid}-fo)`}
      />
      <path
        d="M32 42 C32 42, 24 55, 22 65 C20 74, 22 82, 30 86 C35 88, 40 86, 43 82 C47 76, 46 68, 42 60 C39 54, 34 48, 32 42Z"
        fill={`url(#${uid}-fi)`}
      />
    </svg>
  );
}
