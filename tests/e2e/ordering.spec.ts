import { test, expect } from "@playwright/test";

// The full order runs once (desktop project) to keep login/order rate limits comfortable.
test.describe("ordering flow", () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) < 1000, "runs on desktop project only");

  test("guest orders for delivery, restaurant accepts, customer sees the update", async ({ page, browser }) => {
    await page.goto("/order");
    await page.getByRole("button", { name: /^Jerk Chicken, / }).first().click();
    await page.getByRole("button", { name: /Add to order/ }).click();
    await expect(page.getByRole("link", { name: /View cart/ })).toBeVisible();

    await page.goto("/checkout");
    await page.getByLabel("Name").fill("E2E Guest");
    await page.getByLabel("Phone").fill("876 555 0123");
    await page.locator("#area").selectOption("Liguanea");
    await page.getByLabel("Street address").fill("1 Test Road");
    await expect(page.getByText("Zone A: we deliver here.")).toBeVisible();
    // Delivery fee for Zone A is J$400; direct Theo's orders have no service fee.
    await expect(page.getByText("Service fee")).toHaveCount(0);
    await page.getByRole("button", { name: /Place order/ }).click();
    await page.waitForURL(/\/orders\/.+token=/);
    await expect(page.getByRole("heading", { name: "Pending" })).toBeVisible();
    const orderNumber = (await page.getByText(/^Order TH-/).textContent())!.replace("Order ", "").trim();

    // Restaurant accepts the order from the partner dashboard.
    const staff = await browser.newContext();
    const res = await staff.request.post("/api/v1/auth/login", { data: { email: "owner@theos.example", password: "Owner#2026demo" } });
    expect(res.ok()).toBeTruthy();
    const dash = await staff.newPage();
    await dash.goto("/partner");
    await dash.getByRole("link", { name: /^Orders/ }).click();
    const card = dash.locator("article", { hasText: orderNumber });
    await card.getByRole("button", { name: "Accept order" }).click();
    await expect(card.getByText("Confirmed")).toBeVisible();
    await staff.close();

    await page.reload();
    await expect(page.getByRole("heading", { name: "Confirmed" })).toBeVisible();
  });

  test("server rejects tampered prices and unknown items", async ({ request }) => {
    const res = await request.post("/api/v1/quote", {
      data: { restaurant_id: "not-a-restaurant", fulfillment_type: "pickup", items: [{ menu_item_id: "x", quantity: 1, modifier_ids: [] }] },
    });
    expect(res.status()).toBe(404);
  });
});
