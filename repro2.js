const { chromium, devices } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ ...devices["iPhone 13"] });
  const page = await ctx.newPage();

  // Simulate Kenyan mobile broadband, not fibre
  const cdp = await ctx.newCDPSession(page);
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 120,
    downloadThroughput: (1.6 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
  });

  console.log("loading /cars listing (throttled 1.6Mbps/120ms)...");
  await page.goto("https://bidgari.com/cars", { waitUntil: "domcontentloaded", timeout: 120000 });

  const count = await page.locator('article a[href^="/cars/"]').count();
  let card = null;
  for (let i = 0; i < count; i++) {
    const c = page.locator('article a[href^="/cars/"]').nth(i);
    if (await c.isVisible().catch(() => false)) { card = c; break; }
  }
  if (!card) { console.log("no card"); await browser.close(); return; }

  const href = await card.getAttribute("href");
  console.log("clicking:", href);

  await card.scrollIntoViewIfNeeded().catch(() => {});
  await page.screenshot({ path: "/tmp/opencode/shot-0-before.png" });

  const navStart = Date.now();
  await card.click({ noWaitAfter: true }).catch(() => {});

  const marks = [150, 400, 800, 1400, 2200, 3200, 4500];
  let shotN = 0;
  let prev = 0;

  for (const target of marks) {
    await page.waitForTimeout(target - prev);
    prev = target;
    const t = Date.now() - navStart;
    const s = await page.evaluate(() => {
      const b = document.body;
      const inner = b.innerText || "";
      const bg = getComputedStyle(b).backgroundColor;
      return {
        url: location.pathname,
        nodes: b.querySelectorAll("*").length,
        chars: inner.trim().length,
        pulse: b.querySelectorAll(".animate-pulse").length,
        nav: !!document.querySelector("header"),
        bg,
      };
    }).catch(() => ({}));
    await page.screenshot({ path: `/tmp/opencode/shot-${++shotN}-${target}ms.png` }).catch(() => {});
    console.log(
      `  t=${String(t).padStart(5)}ms path=${String(s.url || "?").slice(0, 22).padEnd(22)} nodes=${String(s.nodes).padStart(4)} chars=${String(s.chars).padStart(4)} pulse=${s.pulse} header=${s.nav}`
    );
  }
  await browser.close();
})();