import { defineConfig } from "@/lib/config";

// Moove Digital white-label build of prompts.chat.
// Clone branding hides the upstream prompts.chat repo branding (achievements,
// sponsors, app-store banners, upstream-only pages) and shows Moove Digital instead.
const useCloneBranding = true;

export default defineConfig({
  // Branding
  branding: {
    name: "Moove Prompts",
    logo: "/logo.svg",
    logoDark: "/logo-dark.svg",
    favicon: "/favicon/favicon.svg",
    description: "The Moove Digital prompt library. Collect, organise, and share AI prompts for your team and clients.",
  },

  // Theme - design system configuration
  theme: {
    // Border radius: "none" | "sm" | "md" | "lg"
    radius: "lg",
    // UI style: "flat" | "default" | "brutal"
    variant: "default",
    // Spacing density: "compact" | "default" | "comfortable"
    density: "default",
    // Colors (hex or oklch)
    colors: {
      primary: "#0D9488", // Moove teal
    },
  },

  // Authentication plugins
  auth: {
    // Available: "credentials" | "google" | "azure" | "github" | "apple" | "oidc" | "oauth"
    // Email/password out of the box. Add "google" / "github" here once the
    // matching AUTH_* variables are set in .env (see .env.example).
    providers: ["credentials"],
    // Allow public registration (only applies to credentials provider)
    allowRegistration: true,
  },

  // Internationalization
  i18n: {
    locales: ["en"],
    defaultLocale: "en",
  },

  // Features
  features: {
    // Allow users to create private prompts
    privatePrompts: true,
    // Enable change request system for versioning
    changeRequests: true,
    // Enable categories
    categories: true,
    // Enable tags
    tags: true,
    // Enable AI-powered semantic search (requires OPENAI_API_KEY)
    aiSearch: false,
    // Enable AI-powered generation features (requires OPENAI_API_KEY)
    aiGeneration: false,
    // Enable MCP (Model Context Protocol) features including API key generation
    mcp: true,
    // Enable comments on prompts
    comments: true,
  },

  // Homepage customization
  homepage: {
    useCloneBranding,
    achievements: {
      enabled: !useCloneBranding,
    },
    sponsors: {
      enabled: !useCloneBranding,
      items: [],
    },
  },
});
