import TrackedLink from "@/components/TrackedLink";
import {
  HOMEPAGE_BODY_LINKS,
  HOMEPAGE_BUDGET_LINKS,
  HOMEPAGE_COUNTY_LINKS,
  HOMEPAGE_FUEL_LINKS,
  HOMEPAGE_POPULAR_LINKS,
} from "@/lib/homepage-discovery-links";

const CHIP_CLASS =
  "inline-flex items-center justify-center rounded-md border px-2.5 py-1.5 text-[10px] font-semibold leading-tight transition-colors sm:px-3 sm:py-1.5 sm:text-[11px] " +
  "bg-[#dbeaf8] border-sky-200/90 text-[#111827] hover:bg-[#c5dff5] hover:border-sky-300 " +
  "dark:bg-sky-950/45 dark:border-sky-800/70 dark:text-sky-50 dark:hover:bg-sky-900/55 dark:hover:border-sky-700";

function FilterChipRow({ items, eventName, area }) {
  return (
    <ul className="flex flex-wrap gap-1.5 sm:gap-2">
      {items.map((item) => (
        <li key={item.href}>
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

function FilterGroup({ title, children }) {
  return (
    <div>
      <h3 className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-zinc-500 mb-2">
        {title}
      </h3>
      {children}
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
          Jump into live dealer stock by budget, body type, fuel, location, or a popular shortcut.
        </p>

        <div className="mt-5 sm:mt-6 flex flex-col gap-5 sm:gap-6">
          <FilterGroup title="Budget">
            <FilterChipRow
              items={HOMEPAGE_BUDGET_LINKS}
              eventName="homepage_budget_link_click"
              area="shop_budget"
            />
          </FilterGroup>

          <FilterGroup title="Body type">
            <FilterChipRow
              items={HOMEPAGE_BODY_LINKS}
              eventName="homepage_body_link_click"
              area="shop_body"
            />
          </FilterGroup>

          <div className="grid gap-5 sm:gap-6 md:grid-cols-2">
            <FilterGroup title="Fuel">
              <FilterChipRow
                items={HOMEPAGE_FUEL_LINKS}
                eventName="homepage_fuel_link_click"
                area="shop_fuel"
              />
            </FilterGroup>
            <FilterGroup title="Location">
              <FilterChipRow
                items={HOMEPAGE_COUNTY_LINKS}
                eventName="homepage_county_link_click"
                area="shop_county"
              />
            </FilterGroup>
          </div>

          <FilterGroup title="Popular">
            <FilterChipRow
              items={HOMEPAGE_POPULAR_LINKS}
              eventName="homepage_popular_link_click"
              area="shop_popular"
            />
          </FilterGroup>
        </div>
      </div>
    </section>
  );
}
