import TrackedLink from "@/components/TrackedLink";
import {
  HOMEPAGE_BODY_LINKS,
  HOMEPAGE_BUDGET_LINKS,
  HOMEPAGE_COUNTY_LINKS,
  HOMEPAGE_FUEL_LINKS,
  HOMEPAGE_POPULAR_SORT_LINKS,
  HOMEPAGE_POPULAR_SPEC_LINKS,
  HOMEPAGE_POPULAR_SUV_LINKS,
} from "@/lib/homepage-discovery-links";

const CHIP_CLASS =
  "inline-flex w-full items-center justify-center rounded-md border px-2 py-1.5 text-[10px] font-semibold leading-tight transition-colors sm:text-[11px] " +
  "bg-[#dbeaf8] border-sky-200/90 text-[#111827] hover:bg-[#c5dff5] hover:border-sky-300 " +
  "dark:bg-sky-950/45 dark:border-sky-800/70 dark:text-sky-50 dark:hover:bg-sky-900/55 dark:hover:border-sky-700";

const PANEL_CLASS =
  "rounded-xl border border-sky-100/90 bg-[#f4f9fd] p-3 sm:p-4 dark:border-sky-900/50 dark:bg-sky-950/25";

function FilterChips({ items, eventName, area, className = "" }) {
  return (
    <ul className={className}>
      {items.map((item) => (
        <li key={item.href} className="min-w-0">
          <TrackedLink
            href={item.href}
            eventName={eventName}
            eventPayload={{ area, label: item.label }}
            className={CHIP_CLASS}
          >
            {item.label}
          </TrackedLink>
        </li>
      ))}
    </ul>
  );
}

function FilterPanel({ title, children, className = "" }) {
  return (
    <div className={`${PANEL_CLASS} ${className}`}>
      <h3 className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-600 dark:text-sky-200/90 mb-2.5">
        {title}
      </h3>
      {children}
    </div>
  );
}

function FilterSubRow({ label, items, eventName, area, columns = "grid-cols-2 sm:grid-cols-4" }) {
  return (
    <div>
      <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-zinc-500 mb-1.5">
        {label}
      </p>
      <FilterChips
        items={items}
        eventName={eventName}
        area={area}
        className={`grid gap-1.5 sm:gap-2 ${columns}`}
      />
    </div>
  );
}

export default function HomepageShopLinks() {
  return (
    <section
      aria-labelledby="homepage-shop-heading"
      className="border-b border-slate-100 bg-white py-8 sm:py-10 dark:border-zinc-900 dark:bg-[#0a0a0a]"
    >
      <div className="home-shell">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-zinc-500 mb-2">
          Browse
        </p>
        <h2
          id="homepage-shop-heading"
          className="text-3xl sm:text-4xl font-normal editorial-heading text-[#111827] dark:text-white"
        >
          Start with a filter
        </h2>
        <p className="mt-2 max-w-2xl text-sm sm:text-base font-medium text-slate-600 dark:text-zinc-400">
          Pick a body style, budget band, fuel type, or county — or jump in with a curated shortcut.
        </p>

        <div className="mt-5 sm:mt-6 grid gap-3 sm:gap-4">
          {/* Primary: body types in an even grid */}
          <FilterPanel title="Body type">
            <FilterChips
              items={HOMEPAGE_BODY_LINKS}
              eventName="homepage_body_link_click"
              area="shop_body"
              className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 sm:gap-2"
            />
          </FilterPanel>

          {/* Budget + curated shortcuts */}
          <div className="grid gap-3 sm:gap-4 lg:grid-cols-5">
            <FilterPanel title="Budget" className="lg:col-span-2">
              <FilterChips
                items={HOMEPAGE_BUDGET_LINKS}
                eventName="homepage_budget_link_click"
                area="shop_budget"
                className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 sm:gap-2"
              />
            </FilterPanel>

            <FilterPanel title="Quick picks" className="lg:col-span-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <FilterSubRow
                  label="SUV deals"
                  items={HOMEPAGE_POPULAR_SUV_LINKS}
                  eventName="homepage_popular_link_click"
                  area="shop_popular_suv"
                  columns="grid-cols-1"
                />
                <FilterSubRow
                  label="Sort by"
                  items={HOMEPAGE_POPULAR_SORT_LINKS}
                  eventName="homepage_popular_link_click"
                  area="shop_popular_sort"
                  columns="grid-cols-2"
                />
                <FilterSubRow
                  label="Specs"
                  items={HOMEPAGE_POPULAR_SPEC_LINKS}
                  eventName="homepage_popular_link_click"
                  area="shop_popular_spec"
                  columns="grid-cols-2"
                />
              </div>
            </FilterPanel>
          </div>

          {/* Fuel + location side by side */}
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
            <FilterPanel title="Fuel">
              <FilterChips
                items={HOMEPAGE_FUEL_LINKS}
                eventName="homepage_fuel_link_click"
                area="shop_fuel"
                className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 sm:gap-2"
              />
            </FilterPanel>
            <FilterPanel title="Location">
              <FilterChips
                items={HOMEPAGE_COUNTY_LINKS}
                eventName="homepage_county_link_click"
                area="shop_county"
                className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 sm:gap-2"
              />
            </FilterPanel>
          </div>
        </div>
      </div>
    </section>
  );
}
