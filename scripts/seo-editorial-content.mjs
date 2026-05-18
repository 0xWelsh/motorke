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
];
