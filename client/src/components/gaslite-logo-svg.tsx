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
  const width = Math.round(height * 0.6);
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 60 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ alignSelf: "center", flexShrink: 0 }}
    >
      <defs>
        <linearGradient id={`${uid}-fo`} x1="30" y1="0" x2="30" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#22D3EE" />
          <stop offset="30%" stopColor="#38BDF8" />
          <stop offset="60%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
        <linearGradient id={`${uid}-fi`} x1="30" y1="35" x2="30" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F0F9FF" />
          <stop offset="40%" stopColor="#BAE6FD" />
          <stop offset="100%" stopColor="#7DD3FC" stopOpacity="0.4" />
        </linearGradient>
        <filter id={`${uid}-glow`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2.5" result="blur" />
          <feFlood floodColor="#38BDF8" floodOpacity="0.4" />
          <feComposite in2="blur" operator="in" />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter={`url(#${uid}-glow)`}>
        <path
          d="M30 2 C30 2, 24 18, 18 32 C12 46, 6 58, 5 68 C3 80, 8 90, 18 95 C23 97.5, 27 98.5, 30 99 C33 98.5, 37 97.5, 42 95 C52 90, 57 80, 55 68 C54 58, 48 46, 42 32 C36 18, 30 2, 30 2Z"
          fill={`url(#${uid}-fo)`}
        />
        <path
          d="M30 40 C30 40, 26 50, 23 58 C20 66, 19 73, 21 79 C23 85, 26 88, 30 90 C34 88, 37 85, 39 79 C41 73, 40 66, 37 58 C34 50, 30 40, 30 40Z"
          fill={`url(#${uid}-fi)`}
        />
      </g>
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
      viewBox="0 0 60 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Gaslite"
    >
      <defs>
        <linearGradient id={`${uid}-fo`} x1="30" y1="0" x2="30" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#22D3EE" />
          <stop offset="30%" stopColor="#38BDF8" />
          <stop offset="60%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
        <linearGradient id={`${uid}-fi`} x1="30" y1="35" x2="30" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F0F9FF" />
          <stop offset="40%" stopColor="#BAE6FD" />
          <stop offset="100%" stopColor="#7DD3FC" stopOpacity="0.4" />
        </linearGradient>
        <filter id={`${uid}-glow`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2.5" result="blur" />
          <feFlood floodColor="#38BDF8" floodOpacity="0.4" />
          <feComposite in2="blur" operator="in" />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter={`url(#${uid}-glow)`}>
        <path
          d="M30 2 C30 2, 24 18, 18 32 C12 46, 6 58, 5 68 C3 80, 8 90, 18 95 C23 97.5, 27 98.5, 30 99 C33 98.5, 37 97.5, 42 95 C52 90, 57 80, 55 68 C54 58, 48 46, 42 32 C36 18, 30 2, 30 2Z"
          fill={`url(#${uid}-fo)`}
        />
        <path
          d="M30 40 C30 40, 26 50, 23 58 C20 66, 19 73, 21 79 C23 85, 26 88, 30 90 C34 88, 37 85, 39 79 C41 73, 40 66, 37 58 C34 50, 30 40, 30 40Z"
          fill={`url(#${uid}-fi)`}
        />
      </g>
    </svg>
  );
}
