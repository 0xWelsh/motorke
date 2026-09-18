/**
 * Editorial SEO pages — imported by scripts/seed-seo-content.mjs
 * Guides → /guides/[slug] (LANDING)
 * Blog → /blog/[slug] (BLOG)
 * Comparisons → /compare/[slug] (COMPARISON)
 */

function hub(make, model) {
  const m = make.toLowerCase().replace(/\s+/g, "-");
  const mod = model.toLowerCase().replace(/\s+/g, "-");
  return `/cars/hub/${m}/${mod}`;
}

function guide(slug, title, description, body, make, model, ctaLabel) {
  return {
    slug,
    title,
    description,
    body,
    meta: {
      hubPath: make && model ? hub(make, model) : "/cars",
      ctaLabel: ctaLabel || (make && model ? `Browse ${make} ${model} listings` : "Browse listings"),
    },
  };
}

/** @type {typeof guide[]} */
export const GUIDES = [
  guide(
    "toyota-harrier-buying-guide-kenya",
    "Toyota Harrier buying guide — Kenya",
    "Years, trims, hybrid vs petrol, and what to inspect before you pay a deposit on a Harrier in Nairobi or Mombasa.",
    `## Who the Harrier suits

The Harrier is the sweet spot for buyers who want a premium-feel SUV without full Prado size or fuel bill. It works for Nairobi commuting, upcountry weekends, and estates with tight parking.

## Petrol vs hybrid (ZU60 / ASU60 era)

- **Petrol 2.0/2.5** — simpler workshop story; watch timing chain service history on high-mileage units.
- **Hybrid** — strong in stop-start traffic; budget for hybrid battery health checks and a specialist diagnosis, not just a dashboard light.

## What to inspect

- Panel alignment and paint depth (repairs are common on imports).
- 4WD operation if equipped — test on loose gravel, not only tarmac.
- Infotainment, camera, and ADAS faults (expensive out of warranty).
- Service stamps or verifiable Japan auction grade if imported.

## Price negotiation

Compare **year, mileage, trim, and registration status** on live listings before you commit. A 2018 hybrid Premium and a 2016 petrol base are not the same car in resale or duty.

## Next steps

Browse live Harrier stock, run a duty estimate if you are importing, and compare against Vezel or CX-5 if you want a smaller bill.`,
    "Toyota",
    "Harrier",
    "See Harrier listings"
  ),
  guide(
    "toyota-harrier-price-kenya",
    "Toyota Harrier price in Kenya — what to expect",
    "How year, hybrid trim, mileage, and duty affect Harrier pricing on the local market.",
    `## What moves Harrier prices

| Factor | Effect |
|--------|--------|
| Year & generation | Newer ZU60/ASU60 hybrids command premiums |
| Mileage | Sub-80k km vs 120k+ km is a wide spread |
| Trim | Premium / Elegance / GR Sport packages |
| Registration | Locally registered vs duty-not-yet-paid imports |
| Condition | Accident history, tyre age, battery health |

## Budget bands (indicative)

Local asking prices shift weekly. Use live marketplace filters rather than forum rumours. Shortlist three comparable cars (same year band, similar km) before you negotiate.

## Import vs local stock

If you are shipping from Japan, land cost = purchase + duty + clearing + registration. Compare against a ready-to-transfer local unit — sometimes the local car wins after risk and time.

## Shop with data

Filter Harrier listings by price ceiling and county, then save your search so you are notified when a new unit hits your band.`,
    "Toyota",
    "Harrier"
  ),
  guide(
    "toyota-harrier-hybrid-battery-kenya",
    "Toyota Harrier hybrid — battery health in Kenya",
    "What to check on Harrier hybrids before you buy, and how Nairobi driving affects battery life.",
    `## Why buyers worry about hybrid batteries

Replacement cost makes battery health the deal-breaker on Harrier hybrids. Most packs age with heat, time, and shallow cycling in traffic — not only mileage.

## Practical checks

- Scan for hybrid system warnings and inconsistent fuel economy vs claim.
- Ask for a hybrid health report from a Toyota-aware workshop.
- Cold start: listen for abnormal inverter/pump noises.
- Verify cooling intakes are not blocked (common after dusty roads).

## Driving profile

Harriers used only on short school runs differ from highway cruisers. Match the previous owner's use to yours.

## Alternatives

If battery risk scares you, compare petrol Harriers or a Honda Vezel hybrid with similar inspection steps.`,
    "Toyota",
    "Harrier"
  ),
  guide(
    "toyota-harrier-best-year-kenya",
    "Best Toyota Harrier year to buy in Kenya",
    "Balancing depreciation, features, parts, and import duty across Harrier generations.",
    `## Generations at a glance

- **XU60 (older)** — cheaper entry; fewer ADAS features; check age-related wear.
- **ZU60 / ASU60** — common import sweet spot; strong parts support in Nairobi.
- **Latest facelift** — higher buy-in; better safety kit and resale among premium buyers.

## Sweet spots

Many Nairobi buyers target **2017–2020** hybrids for features vs price, or **2015–2018** petrol if budget is tighter.

## Duty angle

Engine size and year affect CRSP-based duty. Run estimates for your exact year before you fix a budget.

## Buy on condition, not year alone

A well-maintained 2016 beats a neglected 2019. Prioritise service history and honest mileage over the newest plate.`,
    "Toyota",
    "Harrier"
  ),
  guide(
    "mazda-cx-5-buying-guide-kenya",
    "Mazda CX-5 buying guide — Kenya",
    "Skyactiv petrol and diesel, AWD, and what Kenyan buyers should inspect on a used CX-5.",
    `## Why the CX-5 is popular here

Driving feel, cabin quality, and road presence without full-size SUV fuel use. Strong choice for buyers cross-shopping RAV4 and X-Trail.

## Engine choices

- **2.0 / 2.5 petrol** — widely understood by independent mechanics.
- **2.2 diesel** — torque for touring; confirm DPF/EGR history and quality fuel use.
- **AWD** — test on wet grass or gravel; check tyres are matched.

## Inspection list

- Timing chain noise on start (high km petrol).
- Rust on rear hatch and subframe (coastal cars).
- Infotainment glitches and Bose amp issues on higher trims.
- Service history for gearbox and diff fluids if AWD.

## Negotiate with comparables

Line up year, engine, and km against other CX-5 listings — trim names like Soul Red Premium packages matter for price.`,
    "Mazda",
    "CX-5"
  ),
  guide(
    "mazda-cx-5-price-kenya",
    "Mazda CX-5 price in Kenya — market guide",
    "Typical pricing drivers for used Mazda CX-5 SUVs in Nairobi and beyond.",
    `## Price drivers

AWD, diesel, low mileage, and facelift years (better lights, safety) hold value. High-mileage ex-rental or rough imports sit lower.

## Compare apples to apples

A 2017 diesel AWD is not comparable to a 2019 petrol FWD base. Filter live inventory by fuel and drivetrain.

## Running costs

Insurance, tyres (especially AWD), and major service at 90k–120k km should sit in your spreadsheet beside purchase price.

## Find stock

Use the CX-5 hub to see what dealers list today — prices update as new units arrive.`,
    "Mazda",
    "CX-5"
  ),
  guide(
    "mazda-cx-5-diesel-vs-petrol-kenya",
    "Mazda CX-5 diesel vs petrol in Kenya",
    "Fuel costs, maintenance, and who should pick each engine in Kenyan conditions.",
    `## Diesel CX-5

**Pros:** Torque for loaded highway trips, often better long-distance economy.  
**Cons:** Sensitive to fuel quality; DPF issues if only used on short city runs.

## Petrol CX-5

**Pros:** Simpler for mixed city use; easier for general workshops.  
**Cons:** Heavier fuel use if you tow or load up hills often.

## Nairobi stop-start

If you rarely leave the city, a well-maintained petrol unit can be less hassle than a diesel that never gets hot enough.

## Test both

Drive back-to-back on the same route and compare noise, pickup, and consumption before you decide.`,
    "Mazda",
    "CX-5"
  ),
  guide(
    "mazda-cx-5-best-year-kenya",
    "Best Mazda CX-5 year to buy in Kenya",
    "Which CX-5 years balance features, spare parts, and value on the local market.",
    `## Common import years

**2016–2019** imports dominate — good parts availability and modern safety. Earlier cars are cheaper but feel dated inside.

## Facelift benefits

Newer lights, GVC tuning, and updated infotainment improve daily use. Worth paying slightly more if you keep cars 3+ years.

## Mileage bands

Under 60k km commands premium. 80k–120k km is normal for imports — price should reflect upcoming major service.

## Action

Shortlist two years, then compare live listings and total cost of ownership (tyres + insurance + fuel).`,
    "Mazda",
    "CX-5"
  ),
  guide(
    "honda-vezel-buying-guide-kenya",
    "Honda Vezel buying guide — Kenya",
    "Hybrid SUV popularity in Nairobi — trims, inspections, and Vezel vs Harrier decisions.",
    `## Why Vezels are everywhere

Compact footprint, hybrid economy in traffic, and strong resale when spec is right. Popular with commuters and small families.

## Hybrid system

Honda's dual-motor setup rewards proper battery care. Get a workshop familiar with Honda hybrids to scan before purchase.

## Trim and features

RS, Z, and X trims differ in body kit and interior. Confirm ADAS features work — windscreens with cameras are costly.

## Inspection

- Rear hatch rust and water leaks.
- CVT behaviour — shudder or delay.
- Underbody damage from speed bumps.
- Auction sheet vs actual condition for imports.

## Cross-shop

If you need more rear space, compare Harrier listings. If you want sharper handling, look at CX-5 stock.`,
    "Honda",
    "Vezel"
  ),
  guide(
    "honda-vezel-hybrid-battery-kenya",
    "Honda Vezel hybrid battery — what Kenyan buyers should know",
    "Battery health, cooling, and workshop checks before you buy a Vezel hybrid.",
    `## Battery reality

Most Vezels on the market are hybrids. Treat battery health as a line item equal to engine compression on a petrol car.

## Checks

- IMA / hybrid warnings and state of charge behaviour.
- Fan operation and blocked radiators behind bumpers.
- Fuel economy within reasonable band for your route.
- Post-repair hybrid battery replacements — ask for documentation.

## When to walk away

Persistent warnings, limp-mode behaviour, or sellers refusing independent inspection.

## Live stock

Filter hybrid Vezels and compare against Harrier hybrids in the same price band.`,
    "Honda",
    "Vezel"
  ),
  guide(
    "honda-vezel-price-kenya",
    "Honda Vezel price in Kenya",
    "What affects Vezel pricing — trim, year, mileage, and import status.",
    `## Market notes

Vezel prices track hybrid demand in Nairobi. RS trims and low-mileage 2018+ units sit at the top of the range.

## Compare properly

Match **year, trim, and km** when negotiating. A high-spec RS is not comparable to a base hybrid.

## Running costs

Insurance is moderate; tyres and hybrid specialist visits are where surprises hide.

## Browse live

See current Vezel listings and set alerts when new stock matches your budget.`,
    "Honda",
    "Vezel"
  ),
  guide(
    "toyota-prado-buying-guide-kenya",
    "Toyota Prado buying guide — Kenya",
    "TX, TZ-G, diesel vs petrol, and inspection tips for Kenya's favourite full-size SUV.",
    `## Who buys a Prado

Families, upcountry travel, tow users, and anyone who values ground clearance and resale. Expect higher fuel and tyre costs than Harrier-class SUVs.

## Trims you will see

- **TX** — common workhorse spec.
- **TZ-G** — more luxury kit and often higher price.
Confirm exact trim against logbook and interior, not only badging.

## Diesel vs petrol

Diesel dominates for torque and touring. Petrol exists — confirm parts and mechanic support in your town.

## Inspection

- Frame and suspension bushings (off-road use).
- Turbo and injector history on diesel.
- Transfer case and 4WD engagement.
- Cooling system — overheating kills deals.

## Duty and imports

Many Prados are imports. Estimate duty for your year and engine, then compare to locally registered stock.`,
    "Toyota",
    "Prado"
  ),
  guide(
    "toyota-prado-tx-vs-tz-g",
    "Toyota Prado TX vs TZ-G — which to buy?",
    "Equipment, resale, and value differences between Prado TX and TZ-G in Kenya.",
    `## TX

Often the value pick: core Prado capability with fewer luxury extras. Easier to resell to fleet and upcountry buyers.

## TZ-G

More comfort features — leather, extra ADAS, sound — and usually higher asking price. Worth it if you will keep the car long term and use the features.

## Same mechanicals?

Verify engine and drivetrain match your needs; trim does not change towing capacity by itself. Check axle ratio and options if you tow heavy.

## Decide with live prices

Compare TX and TZ-G listings with similar year and km — the premium should match usable features, not badges alone.`,
    "Toyota",
    "Prado"
  ),
  guide(
    "toyota-prado-price-kenya",
    "Toyota Prado price in Kenya",
    "How year, trim, diesel spec, and mileage shape Prado prices.",
    `## Why Prados hold value

Brand trust, parts network, and demand for 7-seat capability keep resale strong. Prices fall slowly relative to peers.

## Budget realistically

Include insurance, tyres (often 265+), and major services. A cheap Prado with deferred maintenance is expensive.

## Import duty

CRSP-based duty on newer diesels can surprise first-time importers — use the duty calculator before you bid abroad.

## Shop listings

Filter Prado stock by year and price band on the marketplace.`,
    "Toyota",
    "Prado"
  ),
  guide(
    "toyota-prado-diesel-maintenance-kenya",
    "Toyota Prado diesel maintenance in Kenya",
    "Service intervals, common repairs, and workshop tips for Prado diesel owners.",
    `## Routine service

Use quality diesel and genuine or reputable filters. Skipping fuel filters hurts injectors.

## Watch items

- Turbo hoses and intercooler leaks.
- DPF issues if the car never does highway km.
- Suspension arms and bushings on rough roads.
- Timing belt / chain service per schedule.

## Tyres and brakes

Heavy SUV = frequent brake and tyre replacement. Budget annually, not only at purchase.

## Buying tip

Service history on a Prado is worth more than a cosmetic detail — ask for records.`,
    "Toyota",
    "Prado"
  ),
  guide(
    "range-rover-buying-guide-kenya",
    "Range Rover buying guide — Kenya",
    "Sport, Vogue, Evoque — what to inspect and how running costs differ from Prado-class SUVs.",
    `## Buyer profile

Range Rover buyers want badge, ride quality, and road presence. Running costs and specialist repairs are higher than Toyota-class ownership.

## Models on the market

- **Sport** — performance bias, popular in Nairobi.
- **Vogue / Autobiography** — luxury long-distance.
- **Evoque / Velar** — smaller footprint, still premium parts pricing.

## Inspection priorities

- Air suspension leaks and compressor health.
- Electronics — cluster warnings, terrain response faults.
- Engine family-specific issues (research your exact engine code).
- Full service history at specialist or main dealer.

## Total cost

Insurance, tyres, and out-of-warranty repairs can exceed Prado ownership — budget accordingly.

## Compare stock

Cross-shop Range Rover listings against Prado if you need 7 seats and lower risk.`,
    "Range Rover",
    "Range Rover Sport",
    "Browse Range Rover listings"
  ),
  guide(
    "range-rover-running-costs-kenya",
    "Range Rover running costs in Kenya",
    "Insurance, tyres, fuel, and repair realities for used Range Rovers in Nairobi.",
    `## Expect premium bills

Parts and labour run higher than mainstream Toyota/Mazda. Specialist diagnosis is often required.

## Suspension and air ride

Budget for air struts, compressors, and sensors if mileage is high — test all ride heights.

## Fuel

Petrol V6/V8 and diesel options all cost more at the pump than Harrier-class SUVs.

## When it makes sense

You accept higher cost for comfort and image, and you buy the best history you can afford — not the cheapest advert.

## Alternatives

Prado or Harrier if you need lower risk ownership with similar road presence.`,
    "Range Rover",
    "Range Rover Sport"
  ),
  guide(
    "range-rover-sport-vs-prado-kenya",
    "Range Rover Sport vs Toyota Prado in Kenya",
    "Luxury vs bulletproof resale — who should buy which SUV.",
    `## Range Rover Sport

Better on-road refinement and badge appeal. Higher repair risk and steeper depreciation on problem cars.

## Toyota Prado

Stronger resale, wider workshop network, better for rough roads and remote travel.

## Family use

Prado wins rear space and simplicity for multi-generational families. Sport wins if you mostly drive tarmac and value cabin tech.

## Buy on history

A clean Sport with records can be fine; a neglected Prado is still a risk. Inspect either thoroughly.`,
    "Range Rover",
    "Range Rover Sport"
  ),
  guide(
    "suvs-under-4-million-kenya",
    "Best used SUVs under 4 million KES in Kenya",
    "Harrier, Vezel, CX-5, and similar — how to shop in this budget band.",
    `## What is realistic at 4M

Older years, higher mileage, or petrol trims — not the newest hybrid Premium specs. Focus on condition over badge.

## Models to shortlist

- Honda Vezel (hybrid, compact)
- Mazda CX-5 (petrol, earlier years)
- Toyota Harrier (petrol or higher km hybrid)
- Nissan X-Trail, Subaru Forester (alternatives)

## Avoid false economy

Deferred maintenance costs more than stretching budget slightly for a serviced car.

## Search smart

Use price filters on the marketplace and save the search.`,
    null,
    null,
    "Browse SUVs under budget"
  ),
  guide(
    "suvs-under-5-million-kenya",
    "Used SUVs around 5 million KES — Kenya buyer guide",
    "Where Prado, Harrier, and CX-5 sit in the 5M band and what to prioritise.",
    `## At 5M you can access

Newer Harrier/CX-5 trims, better km Prados (older TX), and premium Vezel RS specs — market dependent.

## Prioritise

1. Service history  
2. Registration status  
3. Mileage vs year  
4. Trim you will actually use  

## Prado at 5M

Often older TX diesel with higher km — acceptable if frame and engine checks pass.

## Compare live

Filter each model hub by price ceiling near 5M.`,
    null,
    null,
    "Browse listings"
  ),
  guide(
    "seven-seater-suvs-kenya",
    "Best 7-seater SUVs in Kenya",
    "Prado and alternatives for large families — space, duty, and running costs.",
    `## Core options

- **Toyota Prado** — default choice for seats + resale.
- **Land Cruiser 200/300** — higher budget.
- **Mitsubishi Pajero Sport, Fortuner** — shop comparatively.

## Not true 7-seaters

Harrier and CX-5 are five-seat platforms — do not rely on them for regular seven-passenger duty.

## Third row reality

Try third row with adult-sized passengers. Check ISOFIX if you use child seats.

## Shop Prado stock

Start with live Prado listings, then compare duty if importing.`,
    "Toyota",
    "Prado"
  ),
  guide(
    "hybrid-suvs-nairobi-traffic",
    "Best hybrid SUVs for Nairobi traffic",
    "Harrier, Vezel, and others — fuel and battery tips for stop-start driving.",
    `## Why hybrids work in Nairobi

Low-speed creep regenerates energy. Petrol SUVs burn fuel constantly in the same conditions.

## Top picks

- Toyota Harrier hybrid
- Honda Vezel hybrid
- Toyota RAV4 hybrid (alternative)

## Battery care

Weekly longer runs help hybrid cooling systems. Avoid cars with unresolved hybrid warnings.

## When hybrid is wrong

Long highway-only use or inability to service hybrids locally — pick petrol CX-5 or Prado diesel instead.`,
    "Toyota",
    "Harrier"
  ),
  guide(
    "import-toyota-harrier-duty-kenya",
    "Import Toyota Harrier duty — Kenya estimate guide",
    "How CRSP, engine, and year affect land cost before you ship from Japan.",
    `## Steps

1. Pick target year and engine (petrol vs hybrid cc).  
2. Run a duty estimate on our calculator.  
3. Add clearing, transport, registration, and contingency.  
4. Compare total to locally registered Harriers listed today.

## Common mistake

Bidding in Japan without land-cost math — you may exceed local market price after duty.

## After duty

Browse Harrier stock — sometimes local transfer is faster and cheaper.`,
    "Toyota",
    "Harrier",
    "Estimate Harrier duty"
  ),
  guide(
    "import-toyota-prado-duty-kenya",
    "Import Toyota Prado duty — Kenya guide",
    "Budgeting CRSP-based duty and fees for Prado imports.",
    `## Diesel Prado duty

Engine capacity and CRSP year drive excise and VAT. Newer years can jump total land cost sharply.

## Use estimates

Run Prado rows in the duty calculator (e.g. TX 2018 diesel) before you commit to auction.

## Compare local

A ready Prado with logbook may beat import timeline and forex risk.

## Live market

Check Prado listings after you have a land-cost ceiling.`,
    "Toyota",
    "Prado",
    "Estimate Prado duty"
  ),
  guide(
    "nairobi-used-car-inspection-checklist",
    "Nairobi used car inspection checklist",
    "Pre-purchase checks for SUVs and saloons before you pay a deposit.",
    `## Documents

- Logbook vs seller ID
- NTSA status and pending fines
- Import documents if applicable

## Mechanical (quick)

- Cold start smoke and noises
- Gearbox shift quality
- Steering vibration at speed
- 4WD/ADAS fault lights

## Body

- Paint meter spots if repainted
- Uneven panel gaps
- Flood signs — musty interior, silt in boot

## Close the deal

Compare three similar listings on Welsh Motorhub before you transfer funds.`,
    null,
    null,
    "Browse verified listings"
  ),
  guide(
    "japan-auction-grade-sheet-explained",
    "Japan auction grade sheet explained (3.5, 4, 4.5)",
    "How to read auction reports when importing Harrier, CX-5, Vezel, or Prado.",
    `## Grade overview

Higher grade generally means less visible damage history — not a substitute for inspection.

## Translate the sheet

- Exterior/interior scores
- Accident/repair markers
- Odometer rollback flags (verify independently)

## Model-specific

- **Prado** — check underbody and frame notes.
- **Harrier/Vezel hybrid** — confirm no hybrid system notes.
- **CX-5** — rust and rear hatch mentions.

## Land cost still matters

Pair grade with duty estimate and local price ceiling.`,
    null,
    null,
    "Estimate import duty"
  ),
  guide(
    "coastal-rust-check-mombasa-imports",
    "Coastal rust check for Mombasa and imported SUVs",
    "Why seaside imports need extra underbody inspection.",
    `## Risk

Salt air accelerates rear hatch, subframe, and brake line corrosion on SUVs shipped through Mombasa.

## Inspect

- Lift car safely and photograph subframe.
- Open boot carpet and check spare well.
- Brake line surface rust vs structural rust.

## Models

Harrier hatch, CX-5 tailgate, Prado rear door are common rust points.

## Buy informed

Combine inspection with live listings from dealers who disclose origin.`,
    null,
    null,
    "Browse SUVs"
  ),
  guide(
    "mazda-cx-5-nairobi-buyers",
    "Mazda CX-5 for Nairobi buyers",
    "City driving, parking, fuel, and where to service a CX-5 in the capital.",
    `## City fit

Size is manageable vs Prado; AWD helps in wet estate roads. Watch ground clearance on aggressive speed bumps.

## Fuel

Petrol suits short trips; diesel needs occasional highway heat.

## Service

Establish a Mazda-friendly workshop before purchase — not every corner garage sees Skyactiv engines daily.

## Stock

Browse CX-5 listings filtered to Nairobi dealers if pickup convenience matters.`,
    "Mazda",
    "CX-5"
  ),
  guide(
    "toyota-harrier-vs-rav4-kenya",
    "Toyota Harrier vs RAV4 in Kenya",
    "Premium feel vs Toyota mainstream — which SUV fits you.",
    `## Harrier

Quieter cabin, premium positioning, often hybrid. Slightly larger feel.

## RAV4

Easier parts story in some workshops, strong resale, practical shape.

## Choose Harrier if

You want comfort and accept hybrid servicing.

## Choose RAV4 if

You want maximum Toyota network simplicity.

Browse both on the marketplace and compare live prices.`,
    "Toyota",
    "Harrier"
  ),
];

/** @type {{ slug: string; title: string; description: string; body: string }[]} */
export const BLOG_EXTRA = [
  {
    slug: "why-toyota-harrier-resale-strong-kenya",
    title: "Why Toyota Harrier resale stays strong in Kenya",
    description: "Demand, hybrid reputation, and what hurts Harrier resale when you sell.",
    body: `## Demand drivers

Harrier hits the overlap of status, reliability perception, and hybrid fuel story in Nairobi.

## What hurts resale

Unresolved hybrid faults, accident history, and odd imports without paperwork.

## Buy and sell smart

Maintain service records and buy listings with transparent history — easier exit later.`,
  },
  {
    slug: "mazda-cx-5-common-issues-high-mileage",
    title: "Mazda CX-5 common issues at high mileage",
    description: "What to budget for on 100k+ km CX-5 SUVs in Kenya.",
    body: `## Watch list

Timing chain noise, worn rear shocks, infotainment glitches, and tyre noise from worn bearings.

## Prevention

Fluid changes on schedule and quality fuel for diesel variants.

## Before you buy

Test drive on highway speeds and listen for droning bearings.`,
  },
  {
    slug: "honda-vezel-rs-vs-base-trim",
    title: "Honda Vezel RS vs base trim — worth the premium?",
    description: "Body kit, wheels, and pricing differences on Kenyan Vezel listings.",
    body: `## RS appeal

Sport styling and firmer ride — popular with younger buyers.

## Base trims

Better value if you care about transport, not aesthetics.

## Check

Insurance quotes can differ with RS wheels and tyre sizes.`,
  },
  {
    slug: "prado-vs-fortuner-kenya",
    title: "Toyota Prado vs Fortuner in Kenya",
    description: "Size, comfort, resale, and who should spend the extra on Prado.",
    body: `## Prado

Better ride and resale; higher purchase price.

## Fortuner

Body-on-frame, popular fleet choice; different driving character.

## Family long trips

Many buyers still pick Prado for comfort and status retention.`,
  },
  {
    slug: "range-rover-air-suspension-warning-signs",
    title: "Range Rover air suspension warning signs",
    description: "Symptoms and costs to watch before you buy a used Range Rover in Kenya.",
    body: `## Symptoms

Car sitting low on one corner, compressor running too long, ride height errors.

## Test

Cycle through height modes after a cold start. Listen for compressor location noise.

## Budget

Assume suspension refresh on high-mileage cars unless recently done with receipts.`,
  },
  {
    slug: "used-suv-financing-deposit-kenya",
    title: "Used SUV financing — typical deposit in Kenya",
    description: "How banks view Harrier, Prado, and premium SUVs for asset finance.",
    body: `## Deposits

Often 10–30% for salaried buyers; varies by bank and car age.

## Age limits

Older Range Rovers may face shorter tenures or higher rates.

## Tip

Get a provisional approval before you fall in love with a listing.`,
  },
  {
    slug: "ntsa-transfer-timeline-used-car",
    title: "NTSA transfer timeline when buying a used car",
    description: "What to expect after you agree a price in Kenya.",
    body: `## Before payment

Confirm logbook, charges, and seller availability for transfer.

## After payment

Complete transfer promptly; avoid driving indefinitely on seller plates.

## Dealers

Verified dealers on marketplaces often assist with paperwork — confirm upfront.`,
  },
  {
    slug: "petrol-vs-diesel-suv-kenya-2025",
    title: "Petrol vs diesel SUV in Kenya — 2025 perspective",
    description: "Fuel quality, DPF, and city driving — which fuel type wins.",
    body: `## Diesel

Wins on highway torque; loses if you only crawl in traffic.

## Petrol

Simpler for mixed use; hybrids beat petrol in city for economy.

## Models

Prado diesel, CX-5 both fuels, Harrier/Vezel hybrid — match fuel to your route.`,
  },
  {
    slug: "best-time-to-buy-used-car-nairobi",
    title: "Best time to buy a used car in Nairobi?",
    description: "Seasonality, imports arriving, and negotiation leverage.",
    body: `## When stock rises

After large shipments clear — more choice, slightly better negotiation.

## When to move fast

Clean low-km units disappear quickly regardless of month.

## Use alerts

Save searches on your target model so you hear about new stock first.`,
  },
  {
    slug: "welsh-motorhub-how-to-contact-dealer",
    title: "How to contact a dealer on Welsh Motorhub",
    description: "Leads, phone, and tips for a serious enquiry on a listing.",
    body: `## Be specific

Share budget, financing status, and inspection timing — dealers prioritise ready buyers.

## Compare

Enquire on two similar cars to understand market flexibility.

## Inspect

Always physical inspection before large deposits.`,
  },
  {
    slug: "how-car-scams-work-kenya-and-how-to-avoid-them",
    title: "How car-buying scams work in Kenya (and how to avoid them)",
    description: "Deposit fraud, ghost listings, bait-and-switch, and fake paperwork — and the checks that stop them.",
    body: `## The deposit scam

A 'seller' posts a car at a tempting price, asks for an M-Pesa deposit to hold it, then disappears. On BIDGARI, money only moves at handover through the team — never to a private number.

## Ghost and cloned listings

Photos are copied from a real listing and reposted by someone who doesn't own the car. Verify the listing reference ID and contact the platform before you trust a repost.

## Bait-and-switch pricing

A too-good-to-be-true price that jumps once you commit. If a deal is far below market range, treat it as a red flag, not a bargain.

## Fake paperwork

Logbooks and transfer documents can be forged. Check the logbook name against the seller's ID and run an NTSA search before any money moves.

## The safe sequence

View the car in person, verify ownership, go through the platform's official channels, and pay only at handover with paperwork signed.`,
  },
  {
    slug: "fake-bidgari-agents-how-to-spot-impersonators",
    title: "Fake BIDGARI agents — how to spot impersonators",
    description: "Scammers use the BIDGARI name to ask for deposits. How to verify you're actually talking to us.",
    body: `## How the impersonation works

Scammers borrow BIDGARI branding and listing photos, build trust, then push you onto a private WhatsApp number and ask for a deposit or 'clearance fee'.

## What BIDGARI never does

We never ask for money on WhatsApp, never direct you to a personal M-Pesa number, and never ask for payment before you inspect the car. Our official channels are listed on the Contact and Safety pages.

## Verify before you send anything

Check the contact against our official WhatsApp, phone, and email. Ask for the listing reference and confirm it through the platform. If anything feels rushed, it usually is.

## If you've been targeted

Stop communicating, save screenshots, report the number to your service provider, and report it to the BIDGARI team immediately so we can warn other buyers.`,
  },
  {
    slug: "complete-guide-importing-car-kenya-2026",
    title: "Complete Guide to Importing a Car to Kenya (2026)",
    description: "Step-by-step process, costs, CRSP duty rates, and tips for importing a used car from Japan or the UK to Kenya in 2026.",
    body: `## Why import?

Importing from Japan or the UK gives you access to a wider range of models, often at lower prices than locally available stock. But the process has strict rules, and mistakes are expensive.

## Step 1 — Choose your source country

- **Japan** — largest supply of used cars, auction grade system, well-established clearing agents.
- **UK** — good for European brands (BMW, Mercedes, VW), but higher shipping costs.
- **Singapore / UAE** — smaller supply, occasionally competitive for luxury models.

## Step 2 — Understand CRSP duty rates

The Kenya Revenue Authority (KRA) uses the Current Retail Selling Price (CRSP) schedule to calculate customs duty. Your total import cost is:

Purchase price + Shipping + Insurance + Customs duty (35% + 25% excise + 16% VAT) + Clearing agent fees + Registration

The CRSP value is based on the car's make, model, year, and engine capacity — not what you actually paid.

## Step 3 — Check eligibility

- The car must be **less than 8 years old** from the date of first registration.
- Right-hand drive only (Kenya drives on the left).
- Must meet Kenya Bureau of Standards (KEBS) requirements.

## Step 4 — Find a reliable supplier

- Japanese auction houses (USS, HAA, TAA) require a licensed exporter.
- UK salvage and used car dealers ship via RORO or container.
- Always verify the auction grade or inspection report before paying.

## Step 5 — Shipping and insurance

- **RORO (Roll-on/Roll-off)** — cheaper, car is driven onto the ship. Good for standard vehicles.
- **Container** — more expensive but protects the car. Better for luxury or classic vehicles.
- Marine insurance is mandatory. Insure for full replacement value.

## Step 6 — Clearing in Kenya

Hire a licensed clearing agent. They handle:
- KRA duty assessment and payment
- KEBS inspection (PVOC or destination inspection)
- NTSA registration and number plate assignment

Typical clearing timeline: 2–4 weeks from arrival at Mombasa port.

## Step 7 — Registration

Once cleared, register with NTSA. You'll need:
- Import entry document
- Customs duty payment receipt
- KEBS certificate
- Insurance cover note
- ID or passport copy

## Common mistakes to avoid

- Buying a car that is too old (over 8 years) — it will be rejected at the port.
- Not factoring in the full duty cost — many buyers only budget for the purchase price.
- Using unlicensed clearing agents — they can delay your release by months.
- Skipping marine insurance — a damaged car at sea with no insurance is a total loss.

## Budget example (2020 Toyota Corolla 1.8L)

| Item | Estimated cost (KES) |
|------|---------------------|
| Japan purchase | 800,000 |
| Shipping (RORO) | 120,000 |
| Insurance | 25,000 |
| Duty (CRSP-based) | 450,000 |
| Clearing agent | 45,000 |
| Registration | 15,000 |
| **Total landed** | **~1,455,000** |

Compare this against a locally available equivalent before you commit.

## Next steps

Use our duty calculator to estimate your specific car's import cost, then browse local listings to see if buying locally is cheaper after all fees.`,
  },
  {
    slug: "best-cars-uber-bolt-kenya",
    title: "Best Cars for Uber and Bolt Drivers in Kenya",
    description: "Top fuel-efficient, reliable, and affordable cars for ride-hailing in Nairobi, Mombasa, and other Kenyan cities.",
    body: `## What matters for ride-hailing

If you're driving for Uber, Bolt, or Little Cab in Kenya, you need:
- **Low fuel consumption** — you're driving all day, every day.
- **Reliability** — breakdowns mean lost income.
- **Affordable parts** — when something breaks, you need cheap, available spares.
- **Comfortable ride** — passengers rate you on comfort.
- **Good resale** — you'll want to upgrade eventually.

## Top picks under KES 800K

### 1. Toyota Axio / Fielder (1000cc)
- Fuel: ~18-22 km/l (petrol)
- Parts: everywhere, cheap
- Why: The most popular Uber car in Nairobi for a reason. Simple, reliable, cheap to run.

### 2. Toyota Vitz (1000cc)
- Fuel: ~18-20 km/l
- Parts: abundant
- Why: Compact, easy to park, low maintenance. Great for city rides.

### 3. Nissan Note (1200cc)
- Fuel: ~16-19 km/l
- Parts: readily available
- Why: Roomier than Vitz, good passenger comfort, e-Power hybrid option available.

### 4. Honda Fit (1300cc)
- Fuel: ~16-18 km/l
- Parts: moderate availability
- Why: Smooth CVT, good interior space for its size, reliable engine.

## Top picks under KES 1.5M

### 5. Toyota Allion (1500cc)
- Fuel: ~15-18 km/l
- Parts: abundant
- Why: Premium feel for passengers, comfortable rear seats, strong resale.

### 6. Toyota Premio (1800cc)
- Fuel: ~13-16 km/l
- Parts: abundant
- Why: Bigger car for airport runs and longer trips. Good boot space.

### 7. Nissan X-Trail (2000cc)
- Fuel: ~12-15 km/l
- Parts: available
- Why: SUV for passengers who want comfort. Popular for Bolt XL.

## Running cost comparison

| Car | Fuel (km/l) | Monthly fuel (3000km) | Insurance/yr | Maintenance/yr |
|-----|-------------|----------------------|--------------|----------------|
| Toyota Axio 1000cc | 20 | ~30,000 | ~25,000 | ~15,000 |
| Nissan Note 1200cc | 17 | ~35,000 | ~28,000 | ~18,000 |
| Toyota Allion 1500cc | 16 | ~37,500 | ~32,000 | ~20,000 |

## Tips for ride-hailing drivers

- Always keep a maintenance log — Uber/Bolt may require it for account verification.
- Invest in seat covers and floor mats — passenger ratings depend on cleanliness.
- Hybrid cars (Toyota Aqua, Nissan Note e-Power) can save 30-40% on fuel, but check battery health before buying.
- Join driver communities on WhatsApp and Facebook for real-time tips on rates and demand.

## Browse ride-hailing-ready cars

Look for cars under 1500cc with service history, below 100,000 km, and from verified sellers.`,
  },
  {
    slug: "toyota-corolla-vs-nissan-sentra-kenya",
    title: "Toyota Corolla vs Nissan Sentra — Which is Better in Kenya?",
    description: "Detailed comparison of Toyota Corolla and Nissan Sentra for Kenyan buyers — price, fuel, reliability, and resale.",
    body: `## The rivalry

The Corolla and Sentra have been competing in Kenya for decades. Both are sedans, both are reliable, and both hold value well. But they suit different buyers.

## Price comparison (Kenya, 2024 models)

| | Toyota Corolla | Nissan Sentra |
|--|----------------|---------------|
| New (approx.) | KES 3.5-4.2M | KES 3.2-3.8M |
| Used 2020 | KES 1.8-2.5M | KES 1.5-2.1M |
| Used 2018 | KES 1.3-1.8M | KES 1.1-1.5M |

The Sentra typically undercuts the Corolla by 10-15% at similar year bands.

## Fuel consumption

- **Corolla 1.8L**: 14-16 km/l (mixed driving)
- **Sentra 1.6L**: 15-17 km/l (mixed driving)

The Sentra edges ahead slightly on fuel, thanks to its smaller engine.

## Reliability

Both are excellent. Toyota has a marginally better reliability reputation in Kenya, partly because parts are slightly more available and more mechanics know them inside-out.

## Interior and comfort

- **Corolla**: More refined interior, better noise insulation, smoother CVT.
- **Sentra**: Roomier rear seats, bigger boot, more headroom for taller passengers.

## Resale value

The Corolla holds value slightly better. This is partly brand perception and partly because Corolla has a larger buyer pool in Kenya.

## Maintenance costs

Very similar. Both use affordable parts. Toyota parts might be 5-10% cheaper due to volume.

## Who should buy the Corolla?

- Buyers who prioritise resale value.
- Those who want a slightly more refined driving experience.
- Anyone who plans to sell the car within 3-5 years.

## Who should buy the Sentra?

- Budget-conscious buyers who want more car for less money.
- Families who need more rear seat and boot space.
- Drivers who value fuel economy above all else.

## Verdict

Both are solid choices. The Corolla is the safer bet for resale. The Sentra is the smarter buy if you're watching every shilling. Test drive both, compare service history, and buy the better-maintained car — not just the better badge.`,
  },
  {
    slug: "best-suvs-under-2m-kenya-2026",
    title: "Best SUVs Under KES 2 Million in Kenya (2026)",
    description: "Top SUVs you can buy in Kenya for under 2 million shillings — fuel economy, reliability, and value for money.",
    body: `## Why SUVs under 2M?

SUVs are the most popular body type in Kenya. They handle rough roads, carry families, and have high resale value. But new SUVs start at KES 3.5M+. The used market is where the value is.

## The best picks (used, 2016-2022 models)

### 1. Toyota RAV4 (2016-2019)
- Price: KES 1.4-1.9M
- Engine: 2.0L or 2.5L petrol
- Fuel: 12-15 km/l
- Why: Toyota reliability, high ground clearance, huge parts network. The default family SUV in Kenya.

### 2. Nissan X-Trail (2017-2020)
- Price: KES 1.2-1.8M
- Engine: 2.0L or 2.5L petrol
- Fuel: 11-14 km/l
- Why: More space than RAV4, 7-seat option available, often cheaper at similar year bands.

### 3. Mazda CX-5 (2017-2019)
- Price: KES 1.5-2.0M
- Engine: 2.0L or 2.5L petrol, 2.2L diesel
- Fuel: 13-17 km/l (diesel best)
- Why: Best driving dynamics in class, premium interior, diesel option for fuel economy.

### 4. Honda CR-V (2017-2020)
- Price: KES 1.6-2.0M
- Engine: 1.5L turbo or 2.0L
- Fuel: 13-16 km/l
- Why: Most spacious interior, turbo engine has strong acceleration, Honda reliability.

### 5. Subaru Forester (2016-2019)
- Price: KES 1.0-1.6M
- Engine: 1.5L turbo or 2.0L
- Fuel: 12-15 km/l
- Why: Standard AWD, great for upcountry use, strong community support. Cheapest entry into AWD SUV territory.

### 6. Hyundai Tucson (2017-2020)
- Price: KES 1.1-1.7M
- Engine: 2.0L petrol or diesel
- Fuel: 13-16 km/l
- Why: Often the cheapest option, modern design, good warranty on newer models.

## What to check on any used SUV

- **Suspension** — SUVs take more abuse on Kenyan roads. Check for clunks, uneven tyre wear, and ride height.
- **4WD system** — If equipped, test it. Many 4WD systems are never engaged and can seize.
- **Accident history** — SUVs are popular for off-road use. Check panel gaps, paint depth, and chassis straightness.
- **Service history** — Oil changes, timing belt/chain, coolant flushes. Missing records = higher risk.

## Budget breakdown example (2018 Toyota RAV4)

| Item | Cost (KES) |
|------|-----------|
| Purchase | 1,600,000 |
| Transfer (NTSA) | 5,000 |
| Insurance (comprehensive) | 45,000 |
| Service (full service) | 15,000 |
| **Total** | **~1,665,000** |

## Browse SUVs under 2M

Use our price filter to find verified SUVs in your budget. Sort by newest first to see the latest arrivals.`,
  },
  {
    slug: "best-toyota-cars-kenya-2026",
    title: "Best Toyota Cars in Kenya (2026)",
    description: "Top Toyota models for Kenyan buyers — from budget hatchbacks to premium SUVs, with prices and reliability tips.",
    body: `## Why Toyota dominates Kenya

Toyota has the largest market share in Kenya's used car market. Parts are everywhere, mechanics know them, and resale is strong. Here are the best Toyotas to buy in 2026.

## Budget (Under KES 800K)

### Toyota Vitz
- Years: 2010-2017
- Engine: 1000cc-1500cc
- Fuel: 18-22 km/l
- Best for: First car, city commuting, ride-hailing

### Toyota Axio / Fielder
- Years: 2012-2017
- Engine: 1000cc-1500cc
- Fuel: 18-22 km/l
- Best for: Family sedan/wagon on a budget, Uber drivers

### Toyota Passo
- Years: 2014-2018
- Engine: 1000cc
- Fuel: 20-24 km/l
- Best for: Ultra-economical city car, ladies' first car

## Mid-range (KES 800K-2M)

### Toyota Corolla
- Years: 2014-2020
- Engine: 1300cc-1800cc
- Fuel: 14-18 km/l
- Best for: Reliable family sedan, strong resale

### Toyota RAV4
- Years: 2013-2019
- Engine: 2000cc-2500cc
- Fuel: 12-15 km/l
- Best for: Family SUV, upcountry trips

### Toyota Harrier
- Years: 2015-2020
- Engine: 2000cc-2500cc (petrol/hybrid)
- Fuel: 12-18 km/l (hybrid best)
- Best for: Premium feel, status, hybrid fuel savings

## Premium (KES 2M-5M)

### Toyota Prado
- Years: 2015-2022
- Engine: 2700cc-3000cc
- Fuel: 8-12 km/l
- Best for: Off-road capability, family luxury, strong resale

### Toyota Land Cruiser V8
- Years: 2012-2018
- Engine: 4500cc-4600cc
- Fuel: 5-8 km/l
- Best for: Status, power, long-distance comfort

## Toyota maintenance tips for Kenya

- Change oil every 5,000 km (not 10,000) — Kenyan dust and heat are harsh.
- Use genuine or OEM oil filters — cheap filters damage engines.
- Check timing belt/chain service intervals — a snapped belt destroys the engine.
- Keep service records — they directly affect resale value.

## Browse Toyota inventory

We have hundreds of verified Toyota listings across Kenya. Filter by make, price, and location to find your match.`,
  },
  {
    slug: "best-nissan-cars-kenya-2026",
    title: "Best Nissan Cars in Kenya (2026)",
    description: "Top Nissan models for Kenyan buyers — affordable, reliable, and fuel-efficient options from the Nissan lineup.",
    body: `## Nissan in Kenya

Nissan is the second most popular brand in Kenya after Toyota. They offer excellent value — often cheaper than equivalent Toyotas with similar reliability.

## Budget (Under KES 800K)

### Nissan Note
- Years: 2014-2020
- Engine: 1200cc (petrol) or e-Power (hybrid)
- Fuel: 16-22 km/l
- Best for: Ride-hailing, city family car, fuel economy champion

### Nissan Tiida / Latio
- Years: 2012-2017
- Engine: 1500cc-1800cc
- Fuel: 14-17 km/l
- Best for: Spacious budget sedan, comfortable highway cruiser

### Nissan March / Micra
- Years: 2014-2018
- Engine: 1000cc-1200cc
- Fuel: 18-22 km/l
- Best for: Ultra-compact city car, tight parking areas

## Mid-range (KES 800K-2M)

### Nissan Sentra
- Years: 2014-2020
- Engine: 1600cc-1800cc
- Fuel: 15-17 km/l
- Best for: Family sedan, more space than Corolla at lower price

### Nissan X-Trail
- Years: 2015-2020
- Engine: 2000cc-2500cc
- Fuel: 11-14 km/l
- Best for: Family SUV, 7-seat option, comfortable ride

### Nissan Qashqai
- Years: 2016-2020
- Engine: 1200cc turbo or 1600cc
- Fuel: 14-17 km/l
- Best for: Crossover SUV, city-friendly, modern design

## Premium (KES 2M-5M)

### Nissan Patrol
- Years: 2014-2018
- Engine: 4000cc-5600cc
- Fuel: 5-8 km/l
- Best for: Off-road icon, status, desert-proven reliability

### Nissan Navara
- Years: 2016-2021
- Engine: 2300cc-2500cc diesel
- Fuel: 10-13 km/l
- Best for: Double cab pickup, work and family, towing

## Nissan buying tips for Kenya

- Check the CVT transmission fluid condition on automatics — dirty fluid causes juddering.
- The e-Power hybrid Note is excellent but requires specialist battery diagnosis.
- Diesel X-Trails need turbo inspection — listen for whistling on acceleration.
- Nissan parts are slightly more expensive than Toyota, but still reasonable.

## Browse Nissan listings

Filter by Nissan on our inventory page to see all available models, sorted by price or newest.`,
  },
  {
    slug: "best-mazda-cars-kenya-2026",
    title: "Best Mazda Cars in Kenya (2026)",
    description: "Top Mazda models for Kenyan buyers — driving pleasure, fuel efficiency, and growing resale value.",
    body: `## Mazda's rise in Kenya

Mazda has grown rapidly in Kenya over the past 5 years. They offer a driving experience that Toyota and Nissan can't match, with Skyactiv technology delivering excellent fuel economy.

## Budget (Under KES 800K)

### Mazda Demio (Mazda2)
- Years: 2014-2019
- Engine: 1300cc-1500cc
- Fuel: 18-22 km/l
- Best for: City driving, first car, fuel economy
- Note: The fun-to-drive hatchback that undercuts Toyota Vitz on price

### Mazda 3 (BM/BN)
- Years: 2014-2018
- Engine: 1500cc-2000cc
- Fuel: 15-18 km/l
- Best for: Premium sedan/hatch feel, sharp handling

## Mid-range (KES 800K-2M)

### Mazda CX-3
- Years: 2016-2019
- Engine: 1500cc-2000cc
- Fuel: 15-18 km/l
- Best for: Compact crossover, city-friendly, stylish

### Mazda CX-5 (KE/KF)
- Years: 2015-2021
- Engine: 2000cc-2500cc petrol, 2200cc diesel
- Fuel: 13-17 km/l (diesel best)
- Best for: Best-driving SUV in class, premium interior, diesel efficiency

### Mazda 6
- Years: 2014-2018
- Engine: 2000cc-2500cc
- Fuel: 13-16 km/l
- Best for: Executive sedan, highway comfort, understated luxury

## Premium (KES 2M-4M)

### Mazda CX-9
- Years: 2016-2020
- Engine: 2500cc turbo
- Fuel: 9-12 km/l
- Best for: 7-seat family SUV, premium feel, powerful turbo

## Mazda maintenance in Kenya

- Skyactiv engines are sensitive to oil quality — use 0W-20 synthetic as specified.
- Diesel CX-5s need AdBlue topping on newer models — check levels.
- Mazda parts are slightly harder to find than Toyota, but availability is improving.
- Join Mazda Owners Kenya groups for parts sourcing and mechanic recommendations.

## Why choose Mazda over Toyota?

If you care about how the car drives — steering feel, interior quality, design — Mazda wins. If you care about maximum parts availability and resale, Toyota still leads. The CX-5 is the sweet spot for buyers who want both.

## Browse Mazda listings

Mazda inventory is growing on BIDGARI. Filter by make to see available Demio, CX-5, and other models.`,
  },
  {
    slug: "kenya-car-prices-2026-crsp-changes",
    title: "Kenya Car Prices 2026 — What Changed with CRSP",
    description: "How the new KRA CRSP schedule affects car prices, import duties, and the used car market in Kenya in 2026.",
    body: `## What is CRSP?

The Current Retail Selling Price (CRSP) is a schedule published by the Kenya Revenue Authority (KRA) that determines the customs value of imported used cars. It's the basis for calculating import duty, excise, and VAT.

## What changed in 2025-2026

In July 2025, KRA introduced a new CRSP schedule that significantly affected duty calculations for many popular models. Key changes:

- **Duty increased** on most Japanese imports by 10-25%.
- **Hybrid vehicles** saw a smaller duty increase, making them relatively more attractive.
- **European brands** (BMW, Mercedes, VW) were hit harder due to higher base CRSP values.
- **Popular models** like Toyota Harrier, Nissan X-Trail, and Mazda CX-5 saw duty increases of KES 50,000-200,000.

## How this affects you as a buyer

### If you're importing

Your total landed cost is now higher. Always run the current duty estimate before committing to a purchase overseas. Use our duty calculator for the latest CRSP-based estimates.

### If you're buying locally

Used car prices have adjusted upward as sellers factor in higher replacement costs. The resale market is tight — good cars sell fast.

### If you're selling

Your car is worth more than it was 12 months ago, assuming you maintain it well. Service records and clean history command premiums.

## Which cars are most affected?

| Category | Impact | Examples |
|----------|--------|----------|
| Large petrol SUVs | Highest duty increase | Toyota Prado, Land Cruiser, Nissan Patrol |
| Mid-size petrol | Moderate increase | Toyota Harrier, RAV4, Mazda CX-5 |
| Hybrids | Smallest increase | Toyota Aqua, Nissan Note e-Power, Harrier hybrid |
| European luxury | Significant increase | BMW 3-series, Mercedes C-Class, Audi A4 |

## Strategies for 2026

1. **Consider hybrids** — they're now relatively cheaper to import due to lower duty rates.
2. **Buy locally** — sometimes a ready-to-transfer local car is cheaper than importing after all fees.
3. **Negotiate harder** — with higher CRSP values, sellers who bought before the change have more margin.
4. **Check the CRSP value** of any car you're considering — it directly affects the price you pay.

## Use our tools

- **Duty calculator** — estimate total import cost for any model.
- **Price comparison** — see what similar cars are selling for locally.
- **Market analysis** — our AI-powered pricing shows if a listing is above or below market.`,
  },
  {
    slug: "cheapest-cars-kenya-under-500k",
    title: "Cheapest Cars to Buy in Kenya Under KES 500,000",
    description: "Reliable, fuel-efficient cars you can buy in Kenya for under 500,000 shillings — with what to check before you buy.",
    body: `## Is 500K enough?

Yes. Kenya's used car market has plenty of options under KES 500,000. You won't get the newest models, but you can get reliable, fuel-efficient transport that will serve you for years.

## The best cars under 500K

### 1. Toyota Vitz (2007-2012)
- Price: KES 250,000-450,000
- Engine: 1000cc-1300cc
- Fuel: 18-22 km/l
- Why: The king of budget cars in Kenya. Parts are everywhere, mechanics know them, and fuel consumption is excellent.

### 2. Toyota Starlet (2000-2010)
- Price: KES 180,000-350,000
- Engine: 1000cc-1300cc
- Fuel: 18-22 km/l
- Why: Even cheaper than Vitz, similar mechanicals. Good for first-time buyers.

### 3. Nissan March / Micra (2010-2014)
- Price: KES 200,000-400,000
- Engine: 1000cc-1200cc
- Fuel: 18-22 km/l
- Why: Compact, easy to park, low running costs.

### 4. Toyota Corolla (2003-2008)
- Price: KES 300,000-500,000
- Engine: 1300cc-1800cc
- Fuel: 14-17 km/l
- Why: Older but proven. Roomier than hatchbacks, good for families on a budget.

### 5. Mazda Demio (2008-2013)
- Price: KES 200,000-400,000
- Engine: 1300cc-1500cc
- Fuel: 17-20 km/l
- Why: Fun to drive, good fuel economy, often cheaper than equivalent Vitz.

### 6. Honda Fit (2008-2013)
- Price: KES 250,000-450,000
- Engine: 1300cc-1500cc
- Fuel: 16-19 km/l
- Why: Most interior space for the price, Honda reliability, smooth CVT.

## What to check on budget cars

- **Engine health** — listen for knocking, check exhaust smoke (blue = oil burning).
- **Transmission** — drive it through all gears. Hesitation or jerking = expensive repair.
- **Rust** — check under mats, wheel arches, and door bottoms. Rust is a dealbreaker.
- **Electrical** — test all windows, lights, AC, and audio. Electrical issues are common on older cars.
- **Service history** — even at this price range, a car with records is worth more.

## Budget car ownership costs

| Monthly cost | Estimate (KES) |
|-------------|----------------|
| Fuel (1000km) | 10,000-15,000 |
| Insurance (monthly) | 2,000-4,000 |
| Maintenance | 3,000-5,000 |
| **Total monthly** | **15,000-24,000** |

## Tips for buying cheap cars

1. **Buy from verified sellers** — at this price range, scams are more common.
2. **Get a mechanic inspection** — KES 3,000-5,000 for a mechanic to inspect can save you KES 100,000+ in repairs.
3. **Check NTSA records** — make sure the car isn't stolen or has outstanding loans.
4. **Negotiate with cash** — cash buyers at this price range have leverage.
5. **Consider locally used** — a car that's been in Kenya for years has been adapted to local conditions.

## Browse budget cars

Use our price filter to see all verified listings under KES 500,000. Sort by price (lowest first) to find the best deals.`,
  },
  {
    slug: "best-first-cars-young-drivers-kenya",
    title: "Best First Cars for Young Drivers in Kenya",
    description: "Affordable, safe, and easy-to-maintain cars perfect for young Kenyan drivers buying their first vehicle.",
    body: `## What makes a good first car?

For young drivers in Kenya, the ideal first car is:
- **Affordable to buy** — under KES 800,000 is realistic for most first-time buyers.
- **Cheap to run** — fuel, insurance, and maintenance should be manageable on a starter salary.
- **Easy to drive** — automatic transmission is easier for new drivers.
- **Reliable** — breakdowns are stressful and expensive when you're starting out.
- **Easy to resell** — when you're ready to upgrade, you want a car that sells quickly.

## Top first cars for young Kenyans

### 1. Toyota Vitz (2012-2017)
- Price: KES 400,000-700,000
- Why: The most popular first car in Kenya. Small, easy to park, cheap to maintain. You can't go wrong.

### 2. Nissan March (2013-2017)
- Price: KES 350,000-550,000
- Why: Even cheaper than Vitz, similar reliability. Great for city driving.

### 3. Toyota Passo (2014-2018)
- Price: KES 350,000-550,000
- Why: Super economical 1000cc engine, cute design, very low running costs.

### 4. Mazda Demio (2014-2018)
- Price: KES 400,000-650,000
- Why: More fun to drive than Vitz, slightly more stylish, good fuel economy.

### 5. Honda Fit (2012-2016)
- Price: KES 400,000-700,000
- Why: Most spacious interior, Honda reliability, smooth driving experience.

### 6. Toyota Axio (2013-2017)
- Price: KES 500,000-800,000
- Why: Sedan for those who want more space, very reliable, strong resale.

## Safety features to look for

- **Airbags** — most 2012+ cars have at least driver airbag. Dual airbags are better.
- **ABS brakes** — prevents skidding in emergency braking.
- **Seatbelts** — check all seats have working 3-point belts.
- **Child locks** — important if you'll carry younger passengers.

## Insurance for young drivers

- Third-party insurance is cheapest (KES 15,000-25,000/year).
- Comprehensive costs more (KES 30,000-60,000/year) but covers theft and accidents.
- Shop around — different insurers offer different rates for young drivers.
- Some insurers offer no-claims discounts after 1 year claim-free.

## Driving tips for new Kenyans

- Start with short, familiar routes before tackling highways.
- Practice parking in empty lots — not on busy streets.
- Always carry a reflective triangle and first aid kit (required by law).
- Join a drivers' WhatsApp group for real-time road updates and tips.

## Budget planning

If you're buying your first car, budget for:
- Purchase price
- Insurance (first year)
- Registration transfer
- First service
- Emergency fund (KES 20,000-30,000 for unexpected repairs)

## Browse first cars

Filter by price under KES 800K, automatic transmission, and your preferred make to find the perfect first car.`,
  },
  {
    slug: "subaru-forester-vs-toyota-rav4-kenya",
    title: "Subaru Forester vs Toyota RAV4 — Which is Better in Kenya?",
    description: "Subaru Forester vs Toyota RAV4 comparison for Kenyan buyers — price, AWD, fuel, reliability, and resale value.",
    body: `## The AWD rivalry

Both the Forester and RAV4 are popular SUVs in Kenya, but they appeal to different buyers. The Forester is for those who want genuine AWD capability. The RAV4 is for those who want Toyota reliability and resale.

## Price comparison (Kenya)

| | Subaru Forester (2018) | Toyota RAV4 (2018) |
|--|------------------------|---------------------|
| Average asking | KES 1.3-1.8M | KES 1.5-2.1M |
| Cheapest available | ~KES 1.0M | ~KES 1.3M |

The Forester is typically 15-20% cheaper at similar year bands, making it the value pick.

## AWD capability

- **Forester**: Standard Symmetrical AWD on all models. Real off-road capability, proven in rally heritage.
- **RAV4**: AWD available on higher trims. Good for light off-road, but not as capable as Forester's system.

For Kenyan conditions — gravel roads, muddy upcountry routes, rainy season — the Forester's AWD is genuinely more useful.

## Fuel consumption

- **Forester 1.5L Turbo**: 12-15 km/l
- **Forester 2.0L**: 10-13 km/l
- **RAV4 2.0L**: 12-15 km/l
- **RAV4 2.5L**: 10-13 km/l

Very similar. The 1.5L Forester turbo and 2.0L RAV4 are the sweet spots for fuel economy.

## Reliability

Both are reliable, but with different profiles:
- **RAV4**: Fewer reported issues, simpler mechanicals, Toyota parts network.
- **Forester**: Generally reliable, but turbo models need careful maintenance. CVT transmission is a known weak point on high-mileage units.

## Interior and space

- **Forester**: More headroom, better visibility (larger windows), more rugged feel.
- **RAV4**: More refined interior, better infotainment, more premium materials.

## Resale value

The RAV4 holds value significantly better. This is partly brand perception and partly because Toyota has a larger buyer pool in Kenya. A 2018 RAV4 will sell for KES 200,000-400,000 more than a comparable 2018 Forester.

## Maintenance costs

- **RAV4**: Slightly cheaper parts, more mechanics familiar with the platform.
- **Forester**: Subaru specialists are needed for turbo and AWD system work. Parts availability is good but not as extensive as Toyota.

## Who should buy the Forester?

- Buyers who need genuine AWD for upcountry use.
- Those who want more car for less money.
- Drivers who prioritise capability over resale value.

## Who should buy the RAV4?

- Buyers who prioritise resale value and long-term value retention.
- Those who want a more refined, premium-feeling SUV.
- City drivers who don't need full AWD capability.

## Verdict

If you regularly drive on rough roads or need AWD, the Forester is the better buy — and it's cheaper. If you're mostly on tarmac and care about resale, the RAV4 is the safer bet. Test drive both, check the service history carefully, and buy the one that fits your driving life.`,
  },
  {
    slug: "complete-guide-buying-used-car-kenya",
    title: "Complete Guide to Buying a Used Car in Kenya",
    description: "Everything you need to know about buying a used car in Kenya — from search to transfer, with tips to avoid scams.",
    body: `## The Kenyan used car market

Over 80% of cars sold in Kenya are used. Whether you're buying from a dealer, private seller, or online platform, knowing the process saves you money and stress.

## Step 1 — Set your budget

Your budget isn't just the purchase price. Factor in:
- **Purchase price** — the listed or negotiated price
- **Transfer fee** — KES 5,000-10,000 for NTSA transfer
- **Insurance** — comprehensive: KES 30,000-80,000/year depending on car value
- **First service** — KES 10,000-25,000 for oil change, filters, and inspection
- **Emergency fund** — keep KES 20,000-50,000 aside for unexpected repairs

## Step 2 — Research

- Compare prices on BIDGARI for the make/model/year you want.
- Check CRSP duty values if you're considering importing.
- Read model-specific buying guides (we have them for every popular model).
- Join model-specific Facebook/WhatsApp groups for real owner feedback.

## Step 3 — Search and shortlist

- Filter by location, price, year, and transmission.
- Look for verified sellers — they've been vetted by the platform.
- Check the listing photos carefully — multiple angles, interior shots, and engine bay.
- Read the description — detailed descriptions indicate serious sellers.

## Step 4 — Inspect the car

### Exterior
- **Panel gaps** — uneven gaps indicate accident repair.
- **Paint depth** — use a paint meter or your fingernail to check for repainted panels.
- **Rust** — check wheel arches, door bottoms, boot floor, and under mats.
- **Tyres** — uneven wear indicates alignment or suspension issues.

### Interior
- **Seats** — check for tears, stains, and excessive wear.
- **Dashboard** — warning lights should all turn off after starting.
- **AC** — test both cold and hot. AC repair is expensive.
- **Electrics** — test all windows, mirrors, locks, lights, and audio.

### Engine bay
- **Oil leaks** — look for wet spots around the valve cover and oil pan.
- **Coolant** — should be clean, not rusty or oily.
- **Battery** — check age and terminal corrosion.
- **Belts** — cracked belts need replacement.

### Test drive
- Start cold — listen for unusual noises on startup.
- Drive on both smooth tarmac and rough roads.
- Test braking — should be straight, no vibration.
- Test steering — should be centered, no pulling to one side.
- Test all gears — automatic should shift smoothly, no hesitation.

## Step 5 — Verify documentation

- **NTSA logbook** — must match the seller's ID. Check for any outstanding loans.
- **Insurance** — transfer existing policy or get new quotes before purchase.
- **Service records** — full service history adds value.
- **Import documents** — if imported, check the import entry and customs duty receipt.

## Step 6 — Negotiate

- Use market data from BIDGARI to justify your offer.
- Point out any issues found during inspection.
- Cash buyers have leverage — use it.
- Don't reveal your maximum budget.

## Step 7 — Transfer

- Both parties visit an NTSA office or use the NTSA portal.
- Fill out the transfer form (NTSA Form C).
- Pay the transfer fee.
- Update insurance.
- Number plates remain the same unless you want new ones.

## Red flags to avoid

- Seller won't allow independent inspection — walk away.
- Price significantly below market — likely stolen or has hidden damage.
- No logbook or documentation — illegal to buy.
- Pressure to pay a deposit quickly — classic scam tactic.
- Seller wants payment to a different name than the logbook holder.

## After purchase

- Change the oil and filters immediately.
- Check all fluid levels.
- Get a full service done within the first week.
- Register for insurance if not already covered.
- Keep all receipts and records for future resale value.

## Browse verified listings

Every car on BIDGARI is from a verified seller with transparent history. Use our filters to find your perfect match.`,
  },
];

/**
 * Curated comparisons — always seeded (not dependent on inventory counts).
 * @type {{ makeA: string; modelA: string; makeB: string; modelB: string; body: string }[]}
 */
export const CURATED_COMPARISONS = [
  {
    makeA: "Toyota",
    modelA: "Harrier",
    makeB: "Honda",
    modelB: "Vezel",
    body: `## Size and use

Harrier offers more cabin and road presence; Vezel is easier in tight parking and often cheaper to run in city traffic.

## Hybrid

Both offer hybrids — battery inspection is mandatory on either.

## Resale

Harrier premium badge holds strongly; Vezel volume keeps liquidity high.

## Verdict

Family space and highway comfort → Harrier. Commuter economy and compact size → Vezel. Compare live prices before you decide.`,
  },
  {
    makeA: "Toyota",
    modelA: "Harrier",
    makeB: "Mazda",
    modelB: "CX-5",
    body: `## Driving

CX-5 is the driver's choice; Harrier prioritises comfort and quiet.

## Fuel

Harrier hybrid vs CX-5 petrol/diesel — match to your daily route.

## Costs

CX-5 can be cheaper to enter; Harrier hybrids need specialist care.

## Verdict

Enjoy driving → CX-5. Comfort and image → Harrier.`,
  },
  {
    makeA: "Toyota",
    modelA: "Harrier",
    makeB: "Toyota",
    modelB: "Prado",
    body: `## Mission

Prado for seven seats, tow, and rough roads. Harrier for five-seat premium daily use.

## Running costs

Prado fuel and tyres are higher; Harrier is easier to park.

## Budget

Prado entry price is higher at similar year bands.

## Verdict

Need third row → Prado. Want premium five-seater → Harrier.`,
  },
  {
    makeA: "Toyota",
    modelA: "Harrier",
    makeB: "Toyota",
    modelB: "RAV4",
    body: `## Positioning

Harrier feels more premium; RAV4 is the practical Toyota SUV.

## Workshop

RAV4 has ubiquitous parts; Harrier hybrids need hybrid-aware service.

## Verdict

Maximum practicality → RAV4. Premium feel → Harrier.`,
  },
  {
    makeA: "Mazda",
    modelA: "CX-5",
    makeB: "Toyota",
    modelB: "RAV4",
    body: `## Dynamics

CX-5 wins steering and ride engagement; RAV4 wins neutral Toyota ownership.

## Resale

Both hold value; RAV4 hybrid demand is strong in Nairobi.

## Verdict

Driver → CX-5. Default Toyota choice → RAV4.`,
  },
  {
    makeA: "Mazda",
    modelA: "CX-5",
    makeB: "Nissan",
    modelB: "X-Trail",
    body: `## Feel

CX-5 interior and handling are often preferred; X-Trail can be softer and cheaper.

## AWD

Both available — inspect tyres and diffs on either.

## Verdict

Shop condition and price — drive both on the same day.`,
  },
  {
    makeA: "Mazda",
    modelA: "CX-5",
    makeB: "Subaru",
    modelB: "Forester",
    body: `## AWD culture

Forester for buyers who want Subaru AWD reputation; CX-5 for on-road polish.

## Consumption

Compare real fuel on your route — hybrids elsewhere may beat both in city.

## Verdict

Rural gravel → Forester. Tarmac lifestyle → CX-5.`,
  },
  {
    makeA: "Honda",
    modelA: "Vezel",
    makeB: "Toyota",
    modelB: "Harrier",
    body: `## Summary

Vezel = compact hybrid value; Harrier = larger premium SUV.

## City

Vezel parks easier; Harrier feels more stable on highway.

## Verdict

Compare hybrid health and price per km, not badge alone.`,
  },
  {
    makeA: "Toyota",
    modelA: "Prado",
    makeB: "Mazda",
    modelB: "CX-5",
    body: `## Different class

Prado is full-size with third row option; CX-5 is a five-seat crossover.

## Costs

Prado ownership costs more across fuel, tyres, and insurance.

## Verdict

Do not cross-shop unless you truly need Prado capability.`,
  },
  {
    makeA: "Toyota",
    modelA: "Prado",
    makeB: "Toyota",
    modelB: "Land Cruiser",
    body: `## Scale

Land Cruiser is larger and more expensive to run; Prado is the mainstream full-size choice.

## Use

Both handle upcountry travel; Cruiser for maximum tow and presence.

## Verdict

Budget and parking reality usually favour Prado.`,
  },
  {
    makeA: "Toyota",
    modelA: "Prado",
    makeB: "Ford",
    modelB: "Everest",
    body: `## Ladder frame vs Prado

Everest competes on value and size; Prado on resale and comfort.

## Resale

Prado traditionally stronger in Kenya.

## Verdict

Test ride quality and calculate 5-year ownership, not only purchase price.`,
  },
  {
    makeA: "Range Rover",
    modelA: "Range Rover Sport",
    makeB: "Toyota",
    modelB: "Prado",
    body: `## Character

Sport for on-road luxury; Prado for capability and lower risk ownership.

## Costs

Sport repairs and insurance typically higher.

## Verdict

Prado for family duty; Sport for premium on-road use with budget for maintenance.`,
  },
  {
    makeA: "Range Rover",
    modelA: "Range Rover Sport",
    makeB: "Toyota",
    modelB: "Harrier",
    body: `## Segment

Both are premium-feel SUVs; Sport is larger and costlier to keep.

## Reliability perception

Harrier hybrid servicing is well understood in Nairobi; Sport needs specialist care.

## Verdict

Harrier for value premium; Sport for maximum badge and power.`,
  },
  {
    makeA: "Range Rover",
    modelA: "Range Rover Sport",
    makeB: "BMW",
    modelB: "X5",
    body: `## Rivals

Both are luxury SUVs with similar buyer profiles.

## Parts

Compare specialist support in your area before you buy either.

## Verdict

Buy the best history — not the best advert.`,
  },
  {
    makeA: "Toyota",
    modelA: "Prado",
    makeB: "Nissan",
    modelB: "Patrol",
    body: `## Off-road

Patrol has cult following; Prado has broader resale liquidity.

## Size

Both are large — fuel and tyre budgets matter.

## Verdict

Test 4WD and comfort on your typical routes.`,
  },
  {
    makeA: "Honda",
    modelA: "Vezel",
    makeB: "Mazda",
    modelB: "CX-5",
    body: `## Size

CX-5 is roomier; Vezel is more city-friendly.

## Hybrid

Vezel hybrid vs CX-5 petrol/diesel — different running cost maths.

## Verdict

City hybrid → Vezel. Driver's SUV → CX-5.`,
  },
  {
    makeA: "Toyota",
    modelA: "Harrier",
    makeB: "Lexus",
    modelB: "NX",
    body: `## Premium cousins

Shared Toyota DNA — NX for badge prestige, Harrier for value positioning.

## Parts

Many components conceptually similar — still inspect individually.

## Verdict

Compare feature-per-shilling on live listings.`,
  },
  {
    makeA: "Mazda",
    modelA: "CX-5",
    makeB: "Hyundai",
    modelB: "Tucson",
    body: `## Value

Tucson often undercuts on price; CX-5 on driving feel.

## Warranty

Check remaining warranty on newer used imports of either.

## Verdict

Drive both; compare km and service history.`,
  },
  {
    makeA: "Toyota",
    modelA: "Prado",
    makeB: "Mitsubishi",
    modelB: "Pajero Sport",
    body: `## Alternatives

Pajero Sport can be cheaper entry; Prado holds value better.

## Ride

Prado generally more refined; test both suspensions.

## Verdict

Budget buyers inspect Pajero Sport carefully; long-term holders often pick Prado.`,
  },
  {
    makeA: "Subaru",
    modelA: "Forester",
    makeB: "Toyota",
    modelB: "RAV4",
    body: `## Heritage

Forester built its reputation on symmetrical AWD and boxer engines; RAV4 rides on Toyota's global reliability network.

## AWD

Forester's full-time symmetrical AWD is standard across most trims; RAV4 AWD is available but more trim-dependent. Both work well on Kenya's variable tarmac and gravel.

## Fuel

RAV4 hybrid is the economy champion — 18–20 km/l real-world in city. Forester turbo petrol drinks more (12–14 km/l). Hybrid Forester exists but is less common on the Kenyan market.

## Reliability

Toyota's 2GR-FE and Dynamic Force engines have near-legendary status. Forester boxer engines are solid but head gasket history on older models is real — inspect before you buy.

## Parts and service

Toyota parts are everywhere in Nairobi, Mombasa, Kisumu. Subaru parts are available but more specialist. Forester CVT is generally reliable but service it regularly.

## Resale

RAV4 resale is king — demand never drops. Forester resale is decent but trails RAV4 by 10–15% at the same year band.

## Price

Forester often cheaper to buy at similar spec and year. That lower entry price is your buffer for maintenance.

## Verdict

Default reliable family SUV → RAV4. AWD-first buyer on gravel roads who wants something different → Forester. Check hybrid health on RAV4, head gasket history on Forester.`,
  },
];
