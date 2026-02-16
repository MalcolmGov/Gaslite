import { GasliteLogoSvg, GasliteFlameIcon } from "./gaslite-logo-svg";

interface GasliteLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showTagline?: boolean;
}

export function GasliteLogo({ size = "md", className = "", showTagline = false }: GasliteLogoProps) {
  return (
    <GasliteLogoSvg size={size} className={className} showTagline={showTagline} />
  );
}

export function GasliteLogoIcon({ className = "h-10 w-10" }: { className?: string }) {
  return <GasliteFlameIcon className={className} />;
}
