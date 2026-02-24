import { Link } from "wouter";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface GasliteLogoSvgProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showTagline?: boolean;
  showFlame?: boolean;
  animate?: boolean;
}

const heightMap = {
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
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

export function GasliteLogoSvg({ size = "md", className = "", showTagline: _showTagline = false, showFlame: _showFlame = false, animate = true }: GasliteLogoSvgProps) {
  const isDark = useIsDark();
  const h = heightMap[size];

  const src = isDark ? "/logo-dark.png" : "/logo-light.png";

  const Wrapper = animate ? motion.div : "div";
  const wrapperProps = animate
    ? { initial: { opacity: 0, scale: 0.97 }, animate: { opacity: 1, scale: 1 }, transition: { duration: 0.4, ease: "easeOut" } }
    : {};

  return (
    <Link href="/" className={`flex items-center shrink-0 ${className}`} data-testid="gaslite-logo">
      <Wrapper {...(wrapperProps as any)} style={{ display: "inline-flex", alignItems: "center" }}>
        <img
          src={src}
          alt="GasLite - Fast. Safe. Reliable."
          style={{ height: `${h}px`, width: "auto" }}
          draggable={false}
        />
      </Wrapper>
    </Link>
  );
}

export function GasliteFlameIcon({ className = "h-10 w-10" }: { className?: string }) {
  const isDark = useIsDark();
  const src = isDark ? "/logo-dark.png" : "/logo-light.png";

  return (
    <img
      className={className}
      src={src}
      alt="GasLite"
      draggable={false}
      style={{ objectFit: "contain" }}
    />
  );
}
