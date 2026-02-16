import { GasliteLogoSvg, GasliteFlameIcon } from "./gaslite-logo-svg";

interface GasliteLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showTagline?: boolean;
  animate?: boolean;
}

export function GasliteLogo({ size = "md", className = "", showTagline = false, animate = true }: GasliteLogoProps) {
  return (
    <GasliteLogoSvg size={size} className={className} showTagline={showTagline} animate={animate} />
  );
}

export function GasliteLogoIcon({ className = "h-10 w-10" }: { className?: string }) {
  return <GasliteFlameIcon className={className} />;
}
