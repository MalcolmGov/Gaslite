import { Link } from "wouter";
import logoImage from "@assets/Gemini_Generated_Image_p1bj2yp1bj2yp1bj_1770624893561.png";
import shieldIcon from "@assets/gaslite-shield-icon.png";

interface GasliteLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const heightMap = {
  sm: 70,
  md: 80,
  lg: 90,
  xl: 110,
};

export function GasliteLogo({ size = "md", className = "" }: GasliteLogoProps) {
  const h = heightMap[size];

  return (
    <Link href="/" className={`flex items-center ${className}`} data-testid="gaslite-logo">
      <img
        src={logoImage}
        alt="Gaslite - Trusted Delivery"
        style={{
          height: `${h}px`,
          width: "auto",
          display: "block",
          imageRendering: "-webkit-optimize-contrast" as React.CSSProperties["imageRendering"],
        }}
        className="object-contain"
      />
    </Link>
  );
}

export function GasliteLogoIcon({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <img
      src={shieldIcon}
      alt="Gaslite"
      className={`object-contain ${className}`}
      data-testid="gaslite-logo-icon"
    />
  );
}
