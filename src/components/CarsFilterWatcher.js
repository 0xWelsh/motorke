"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";

function Watcher({ onChange }) {
  const searchParams = useSearchParams();
  const query = searchParams.toString();

  useEffect(() => {
    onChange(query);
  }, [onChange, query]);

  return null;
}

// Kept in its own Suspense boundary: useSearchParams bails static pages out
// of server rendering, so isolating it here lets the listing (and its cars)
// stay in the prerendered HTML for SEO and LCP.
export default function CarsFilterWatcher({ onChange }) {
  return (
    <Suspense fallback={null}>
      <Watcher onChange={onChange} />
    </Suspense>
  );
}
