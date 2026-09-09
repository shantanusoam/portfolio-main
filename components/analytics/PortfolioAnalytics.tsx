"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { trackPortfolioPageView } from "@/lib/analytics/portfolioAnalytics";

export default function PortfolioAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    trackPortfolioPageView(pathname);
  }, [pathname]);

  // The insights bundle only exists on Vercel; skip the guaranteed dev 404.
  if (process.env.NODE_ENV !== "production") return null;

  return (
    <Script
      id="portfolio-analytics"
      src="/_vercel/insights/script.js"
      strategy="afterInteractive"
      data-disable-auto-track="1"
      data-sdkn="portfolio/manual"
      data-sdkv="1.0.0"
    />
  );
}
