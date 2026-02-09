import logoImage from "@assets/Gemini_Generated_Image_p1bj2yp1bj2yp1bj_1770624893561.png";

interface GasliteLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function GasliteLogo({ size = "md", className = "" }: GasliteLogoProps) {
  const sizeClasses = {
    sm: "h-10",
    md: "h-12",
    lg: "h-16",
  };

  return (
    <div className={`flex items-center ${className}`} data-testid="gaslite-logo">
      <img
        src={logoImage}
        alt="Gaslite - Trusted Delivery"
        className={`${sizeClasses[size]} w-auto object-contain`}
      />
    </div>
  );
}

export function GasliteLogoIcon({ className = "h-10 w-auto" }: { className?: string }) {
  return (
    <img
      src={logoImage}
      alt="Gaslite"
      className={`object-contain ${className}`}
      data-testid="gaslite-logo-icon"
    />
  );
}
