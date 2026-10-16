const { chromium } = require("playwright");

const BASE = process.env.BASE || "http://localhost:3111";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  console.log("loading", BASE, "/cars ...");
  await page.goto(`${BASE}/cars`, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.waitForTimeout(1500);

  const count = await page.locator('article a[href^="/cars/"]').count();
  let card = null;
  for (let i = 0; i < count; i++) {
    const c = page.locator('article a[href^="/cars/"]').nth(i);
    if (await c.isVisible().catch(() => false)) { card = c; break; }
  }
  if (!card) { console.log("no visible card"); await browser.close(); return; }

  const href = await card.getAttribute("href");
  await card.scrollIntoViewIfNeeded().catch(() => {});
  console.log("clicking:", href, "\n");

  const t0 = Date.now();
  await card.click({ noWaitAfter: true }).catch((e) => console.log("click err", e.message));

  console.log("   t(ms) | path                | pulse | chars | verdict");
  console.log("  -------+---------------------+-------+-------+--------");

  let firstSkeleton = null;
  let firstContent = null;
  let stillHomeAt = null;

  for (let i = 0; i < 60; i++) {
    await page.waitForTimeout(100);
    const t = Date.now() - t0;
    const s = await page.evaluate(() => {
      const b = document.body;
      const inner = b.innerText || "";
      return {
        url: location.pathname,
        pulse: b.querySelectorAll(".animate-pulse").length,
        chars: inner.trim().length,
      };
    }).catch(() => ({}));
    if (s.pulse > 0 && !firstSkeleton) firstSkeleton = t;
    if (s.url !== "/cars" && s.chars > 800 && s.pulse === 0 && !firstContent) firstContent = t;
    if (s.url === "/cars" && t > 300 && t < 600) stillHomeAt = t;
    if (i % 3 === 0 || s.pulse > 0) {
      console.log(
        String(t).padStart(7) + " | " + String(s.url).slice(0, 19).padEnd(19) + " | " +
        String(s.pulse).padStart(5) + " | " + String(s.chars).padStart(5) + " |"
      );
    }
    if (firstContent) break;
  }

  console.log("\n  RESULT");
  console.log("  skeleton shown at :", firstSkeleton ? firstSkeleton + "ms" : "NEVER");
  console.log("  content arrived at:", firstContent ? firstContent + "ms" : "NOT SEEN");
  if (firstSkeleton) console.log("  dead time before skeleton:", firstSkeleton + "ms");
  await browser.close();
})();