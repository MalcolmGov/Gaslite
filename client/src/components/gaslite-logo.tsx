import { Link } from "wouter";
import logoImage from "@assets/Gemini_Generated_Image_p1bj2yp1bj2yp1bj_1770624893561.png";
import shieldIcon from "@assets/gaslite-shield-icon.png";

interface GasliteLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const widthMap = {
  sm: "160px",
  md: "200px",
  lg: "260px",
  xl: "320px",
};

export function GasliteLogo({ size = "md", className = "" }: GasliteLogoProps) {
  const w = widthMap[size];

  return (
    <Link href="/" className={`flex items-center ${className}`} data-testid="gaslite-logo">
      <img
        src={logoImage}
        alt="Gaslite - Trusted Delivery"
        style={{
          width: w,
          height: "auto",
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
