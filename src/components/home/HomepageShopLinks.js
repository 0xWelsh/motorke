import { ChevronDown } from "lucide-react";
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

function FilterGroup({ title, children, className = "" }) {
  return (
    <div className={className}>
      <h3 className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-zinc-500 mb-2">
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

export default function HomepageShopLinks({ embedded = false }) {
  const content = (
        <details className="group">
          <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 text-left">
                <h2
                  id="homepage-shop-heading"
                  className="text-xl sm:text-2xl font-normal editorial-heading text-[#111827] dark:text-white leading-tight"
                >
                  Start with a filter
                </h2>
                <p className="mt-1 max-w-2xl text-[13px] sm:text-sm font-medium text-slate-600 dark:text-zinc-400 group-open:hidden leading-snug">
                  Body type, budget, fuel, county and quick shortcuts.
                </p>
                <p className="mt-1.5 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.14em] text-[#38A169] group-open:hidden">
                  Tap to expand
                </p>
              </div>
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#38A169]/40 bg-[#38A169]/10 text-[#38A169] transition-transform group-open:rotate-180 dark:border-[#4ade80]/40 dark:bg-[#22c55e]/15 dark:text-[#4ade80]"
                aria-hidden
              >
                <ChevronDown className="h-4 w-4" />
              </span>
            </div>
          </summary>

          <div className="mt-4 sm:mt-5 grid gap-4 sm:gap-5">
            <FilterGroup title="Body type">
              <FilterChips
                items={HOMEPAGE_BODY_LINKS}
                eventName="homepage_body_link_click"
                area="shop_body"
                className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 sm:gap-2"
              />
            </FilterGroup>

            <div className="grid gap-5 sm:gap-6 lg:grid-cols-5">
              <FilterGroup title="Budget" className="lg:col-span-2">
                <FilterChips
                  items={HOMEPAGE_BUDGET_LINKS}
                  eventName="homepage_budget_link_click"
                  area="shop_budget"
                  className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 sm:gap-2"
                />
              </FilterGroup>

              <FilterGroup title="Quick picks" className="lg:col-span-3">
                <div className="grid gap-4 sm:grid-cols-3">
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
              </FilterGroup>
            </div>

            <div className="grid gap-5 sm:gap-6 sm:grid-cols-2">
              <FilterGroup title="Fuel">
                <FilterChips
                  items={HOMEPAGE_FUEL_LINKS}
                  eventName="homepage_fuel_link_click"
                  area="shop_fuel"
                  className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 sm:gap-2"
                />
              </FilterGroup>
              <FilterGroup title="Location">
                <FilterChips
                  items={HOMEPAGE_COUNTY_LINKS}
                  eventName="homepage_county_link_click"
                  area="shop_county"
                  className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 sm:gap-2"
                />
              </FilterGroup>
            </div>
          </div>
        </details>
  );

  if (embedded) {
    return (
      <div className="w-full rounded-xl bg-white/90 dark:bg-[#111111]/70 ring-1 ring-black/[0.05] dark:ring-white/[0.07] p-2.5 sm:p-3 shadow-[0_18px_50px_-28px_rgba(0,0,0,0.18)]">
        {content}
      </div>
    );
  }

  return (
    <section className="border-b border-slate-100 bg-white py-4 sm:py-5 dark:border-zinc-900 dark:bg-[#0a0a0a]">
      <div className="home-shell">
        <details className="group">
          <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 text-left">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-zinc-500 mb-1.5">
                  Browse
                </p>
                <h2
                  id="homepage-shop-heading"
                  className="text-2xl sm:text-3xl font-normal editorial-heading text-[#111827] dark:text-white"
                >
                  Start with a filter
                </h2>
                <p className="mt-1.5 max-w-2xl text-sm font-medium text-slate-600 dark:text-zinc-400 group-open:hidden">
                  Body type, budget, fuel, county, and quick shortcuts — tap to expand.
                </p>
              </div>
              <span
                className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-sky-200/90 bg-[#dbeaf8] text-[#111827] transition-transform group-open:rotate-180 dark:border-sky-800/70 dark:bg-sky-950/45 dark:text-sky-50"
                aria-hidden
              >
                <ChevronDown className="h-4 w-4" />
              </span>
            </div>
          </summary>

          <div className="mt-5 sm:mt-6 grid gap-5 sm:gap-6">
            <FilterGroup title="Body type">
              <FilterChips
                items={HOMEPAGE_BODY_LINKS}
                eventName="homepage_body_link_click"
                area="shop_body"
                className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 sm:gap-2"
              />
            </FilterGroup>

            <div className="grid gap-5 sm:gap-6 lg:grid-cols-5">
              <FilterGroup title="Budget" className="lg:col-span-2">
                <FilterChips
                  items={HOMEPAGE_BUDGET_LINKS}
                  eventName="homepage_budget_link_click"
                  area="shop_budget"
                  className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 sm:gap-2"
                />
              </FilterGroup>

              <FilterGroup title="Quick picks" className="lg:col-span-3">
                <div className="grid gap-4 sm:grid-cols-3">
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
              </FilterGroup>
            </div>

            <div className="grid gap-5 sm:gap-6 sm:grid-cols-2">
              <FilterGroup title="Fuel">
                <FilterChips
                  items={HOMEPAGE_FUEL_LINKS}
                  eventName="homepage_fuel_link_click"
                  area="shop_fuel"
                  className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 sm:gap-2"
                />
              </FilterGroup>
              <FilterGroup title="Location">
                <FilterChips
                  items={HOMEPAGE_COUNTY_LINKS}
                  eventName="homepage_county_link_click"
                  area="shop_county"
                  className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 sm:gap-2"
                />
              </FilterGroup>
            </div>
          </div>
        </details>
      </div>
    </section>
  );
}
