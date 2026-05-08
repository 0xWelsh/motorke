"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { captureAttributionFromLocation, trackUiEvent } from "@/lib/analytics";

export default function AnalyticsBootstrap() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    captureAttributionFromLocation();
  }, []);

  useEffect(() => {
    trackUiEvent("page_view", {
      page_path: pathname || "/",
      page_query: searchParams?.toString() || "",
      page_title: typeof document !== "undefined" ? document.title : "",
      referrer: typeof document !== "undefined" ? document.referrer : "",
    });
  }, [pathname, searchParams]);

  return null;
}
