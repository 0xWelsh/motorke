import TrackedLink from "@/components/TrackedLink";
import {
  HOMEPAGE_BODY_LINKS,
  HOMEPAGE_BUDGET_LINKS,
} from "@/lib/homepage-discovery-links";

function LinkGrid({ items, eventName, area }) {
  return (
    <ul className="grid grid-cols-2 gap-2 sm:gap-2.5">
      {items.map((item) => (
        <li key={item.href}>
          <TrackedLink
            href={item.href}
            eventName={eventName}
            eventPayload={{ area, label: item.label }}
            className="flex h-full min-h-[3rem] items-center justify-center border border-slate-200 bg-white px-3 py-2.5 text-center text-[12px] font-bold text-[#111827] transition-colors hover:border-[#111827] dark:border-zinc-800 dark:bg-[#111111] dark:text-white dark:hover:border-zinc-500 sm:text-[13px]"
            style={{ borderRadius: "var(--radius)" }}
          >
            {item.label}
          </TrackedLink>
        </li>
      ))}
    </ul>
  );
}

export default function HomepageShopLinks() {
  return (
    <section
      aria-labelledby="homepage-shop-heading"
      className="border-b border-slate-100 bg-white py-8 sm:py-12 dark:border-zinc-900 dark:bg-[#0a0a0a]"
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
        <p className="mt-2 max-w-xl text-sm sm:text-base font-medium text-slate-600 dark:text-zinc-400">
          Jump straight into live dealer stock by budget or body type.
        </p>

        <div className="mt-6 sm:mt-8 grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400 dark:text-zinc-500 mb-3">
              Budget
            </h3>
            <LinkGrid
              items={HOMEPAGE_BUDGET_LINKS}
              eventName="homepage_budget_link_click"
              area="shop_budget"
            />
          </div>
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400 dark:text-zinc-500 mb-3">
              Body type
            </h3>
            <LinkGrid
              items={HOMEPAGE_BODY_LINKS}
              eventName="homepage_body_link_click"
              area="shop_body"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
