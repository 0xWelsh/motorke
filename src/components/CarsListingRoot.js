"use client";

import { useState } from "react";
import CarsListingView from "@/components/CarsListingView";
import CarsFilterWatcher from "@/components/CarsFilterWatcher";

export default function CarsListingRoot({ initialCars, initialTotal, allColors }) {
  // `null` means "query not known yet" (server render / pre-hydration): show
  // the server-provided unfiltered page. The watcher then supplies the real
  // query string after hydration, without taking the listing out of SSR.
  const [query, setQuery] = useState(null);

  return (
    <>
      <CarsListingView
        query={query}
        initialCars={initialCars}
        initialTotal={initialTotal}
        allColors={allColors}
      />
      <CarsFilterWatcher onChange={setQuery} />
    </>
  );
}
