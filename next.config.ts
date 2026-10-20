import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  // Self-contained server bundle (`.next/standalone`) for running with Node/PM2.
  output: "standalone",
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  sassOptions: {
    // Bootstrap 5.3 SCSS emits deprecation warnings on newer Dart Sass.
    quietDeps: true,
    silenceDeprecations: ["import", "global-builtin", "color-functions", "mixed-decls"],
  },
};

export default nextConfig;
