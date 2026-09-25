import { test, expect } from "@playwright/test";

const PAGES = ["/", "/menu", "/order", "/delivery", "/about", "/lounge", "/events", "/specials", "/contact", "/faq", "/privacy", "/terms", "/restaurants", "/restaurants/harbour-catch", "/network", "/partners", "/partners/apply", "/drive", "/cart", "/checkout", "/login", "/signup"];

for (const path of PAGES) {
  test(`renders ${path} without errors or horizontal scroll`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    const res = await page.goto(path, { waitUntil: "networkidle" });
    expect(res?.status()).toBe(200);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    expect(errors).toEqual([]);
    await expect(page.locator("main, [id=main]").first()).toBeVisible();
  });
}

test("unknown pages return 404", async ({ page }) => {
  const res = await page.goto("/definitely-not-a-page");
  expect(res?.status()).toBe(404);
});

test("dashboards redirect signed-out visitors to login", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login\?next=%2Fadmin/);
});
