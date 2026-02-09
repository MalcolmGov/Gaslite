import shieldIcon from "@assets/gaslite-shield-icon.png";

interface GasliteLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showTagline?: boolean;
  className?: string;
}

export function GasliteLogo({ size = "md", showTagline = false, className = "" }: GasliteLogoProps) {
  const iconSizes = {
    sm: "h-9 w-9",
    md: "h-11 w-11",
    lg: "h-14 w-14",
    xl: "h-20 w-20",
  };

  const nameSizes = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-3xl",
    xl: "text-4xl",
  };

  const taglineSizes = {
    sm: "text-[10px]",
    md: "text-xs",
    lg: "text-sm",
    xl: "text-base",
  };

  return (
    <div className={`flex items-center gap-2.5 ${className}`} data-testid="gaslite-logo">
      <img
        src={shieldIcon}
        alt=""
        className={`${iconSizes[size]} object-contain flex-shrink-0`}
      />
      <div className="flex flex-col leading-none">
        <span className={`${nameSizes[size]} font-bold tracking-tight`}>
          <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">Gas</span>
          <span className="bg-gradient-to-r from-cyan-500 to-blue-400 bg-clip-text text-transparent">lite</span>
        </span>
        {showTagline && (
          <span className={`${taglineSizes[size]} font-medium text-cyan-600 dark:text-cyan-400 tracking-wide mt-0.5`}>
            Trusted Delivery
          </span>
        )}
      </div>
    </div>
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
