const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  console.log("loading homepage...");
  const t0 = Date.now();
  await page.goto("https://bidgari.com/", { waitUntil: "domcontentloaded", timeout: 90000 });
  console.log("  homepage domcontentloaded:", Date.now() - t0, "ms");

  // Real car cards are <article> wrappers around the link. Pick a visible one —
  // the homepage has hidden sidebars/rails whose links can't be clicked.
  const count = await page.locator('article a[href^="/cars/"]').count();
  let card = null;
  for (let i = 0; i < count; i++) {
    const cand = page.locator('article a[href^="/cars/"]').nth(i);
    if (await cand.isVisible().catch(() => false)) { card = cand; break; }
  }
  if (!card) { console.log("no visible car card found"); await browser.close(); return; }
  await card.scrollIntoViewIfNeeded().catch(() => {});
  const href = await card.getAttribute("href");
  console.log("clicking car card:", href);

  const navStart = Date.now();
  await card.click({ noWaitAfter: true, timeout: 15000 }).catch((e) => console.log("  click err:", e.message));

  const samples = [];
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(120);
    const t = Date.now() - navStart;
    const s = await page.evaluate(() => {
      const b = document.body;
      const inner = b.innerText || "";
      return {
        url: location.pathname,
        nodes: b.querySelectorAll("*").length,
        chars: inner.trim().length,
        pulse: b.querySelectorAll(".animate-pulse").length,
        skeleton: b.querySelectorAll(".bg-slate-200, .bg-slate-100, .bg-white\\/5").length,
        blank: inner.trim().length < 10 && b.querySelectorAll("*").length < 40,
      };
    }).catch(() => ({}));
    samples.push({ t, ...s });
    if (s.url !== "/" && s.pulse === 0 && s.chars > 800) break;
  }

  console.log("\n  t(ms) | path                  | nodes | chars | pulse | skel | state");
  console.log("-------+-----------------------+-------+-------+-------+------+------");
  for (const s of samples) {
    console.log(
      String(s.t).padStart(6) + " | " + String(s.url || "?").slice(0, 21).padEnd(21) + " | " +
      String(s.nodes || 0).padStart(5) + " | " + String(s.chars || 0).padStart(5) + " | " +
      String(s.pulse || 0).padStart(5) + " | " + String(s.skeleton || 0).padStart(4) + " | " +
      (s.blank ? "*** BLANK ***" : "")
    );
  }

  const skeletonFrames = samples.filter((s) => s.pulse > 0).length;
  console.log("\n  frames showing skeleton:", skeletonFrames, "/", samples.length);
  await browser.close();
})();