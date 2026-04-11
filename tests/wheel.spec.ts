import { test, expect, Page } from "@playwright/test";

/*
 * These tests verify the UI structure, rendering, and interactions.
 * Firebase is NOT configured in CI/test, so data-flow tests that require
 * a live database are skipped. The UI itself (layout, elements, QR, join form)
 * is fully testable.
 */

test.describe("Host view - UI structure", () => {
  test("loads the host page with all key elements", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".topbar-title")).toContainText("Global AI");
    await expect(page.locator(".topbar-badge")).toContainText("AgentCon Berlin 2026");
    await expect(page.locator("#wheel")).toBeVisible();
    await expect(page.locator("#spinBtn")).toBeVisible();
    await expect(page.locator("#pickFiveBtn")).toBeVisible();
    await expect(page.locator("#resetWinnersBtn")).toBeVisible();
    await expect(page.locator("#roomInput")).toHaveValue("berlin-2026");
    await expect(page.locator('[data-testid="addNameInput"]')).toBeVisible();
    await expect(page.locator("#addNameBtn")).toBeVisible();
  });

  test("shows firebase banner when not configured", async ({ page }) => {
    await page.goto("/");
    // Firebase config endpoint returns error in test env
    await expect(page.locator("#firebaseBanner")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("#connStatus")).toContainText("Firebase not configured");
  });

  test("QR code and join URL are generated", async ({ page }) => {
    await page.goto("/");
    const url = await page.locator("#joinUrl").inputValue();
    expect(url).toContain("mode=join");
    expect(url).toContain("room=berlin-2026");
    // QR canvas should have content rendered
    await expect(page.locator("#qrCanvas")).toBeVisible();
  });

  test("default join URL contains default room", async ({ page }) => {
    await page.goto("/");
    const url = await page.locator("#joinUrl").inputValue();
    expect(url).toContain("room=berlin-2026");
  });

  test("wheel canvas is rendered", async ({ page }) => {
    await page.goto("/");
    const canvas = page.locator("#wheel");
    await expect(canvas).toBeVisible();
    // Canvas should have dimensions
    const width = await canvas.getAttribute("width");
    const height = await canvas.getAttribute("height");
    expect(width).toBe("900");
    expect(height).toBe("900");
  });

  test("empty state text is visible when no participants", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#emptyText")).toBeVisible();
    await expect(page.locator("#emptyText")).toContainText("Add names");
  });

  test("participant count starts at 0", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#count")).toHaveText("0");
  });

  test("winner count starts at 0 / 5", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#winnerCount")).toHaveText("0 / 5");
  });
});

test.describe("Join view - UI structure", () => {
  test("loads the join form with correct elements", async ({ page }) => {
    await page.goto("/?mode=join&room=test-room");
    // Host view should be hidden
    await expect(page.locator("#hostView")).toBeHidden();
    // Join view should be visible
    await expect(page.locator("#joinView")).toBeVisible();
    await expect(page.locator(".join-card h1")).toHaveText("Join the Wheel");
    await expect(page.locator('[data-testid="nameInput"]')).toBeVisible();
    await expect(page.locator('[data-testid="joinBtn"]')).toBeVisible();
  });

  test("shows branding on join page", async ({ page }) => {
    await page.goto("/?mode=join&room=test-room");
    await expect(page.locator(".join-brand")).toContainText("Global AI Community");
    await expect(page.locator(".join-brand")).toContainText("AgentCon Berlin 2026");
  });

  test("join form has proper input constraints", async ({ page }) => {
    await page.goto("/?mode=join&room=test-room");
    const input = page.locator('[data-testid="nameInput"]');
    await expect(input).toHaveAttribute("maxlength", "40");
    await expect(input).toHaveAttribute("placeholder", "Your name");
  });

  test("shows error status when firebase is unavailable", async ({ page }) => {
    await page.goto("/?mode=join&room=test-room");
    // Without firebase config, join should show error
    await expect(page.locator("#joinStatus")).toContainText("unavailable", { timeout: 5000 });
    await expect(page.locator('[data-testid="joinBtn"]')).toBeDisabled();
  });
});

test.describe("Responsive layout", () => {
  test("mobile viewport shows single column", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await expect(page.locator(".layout")).toBeVisible();
    await expect(page.locator("#wheel")).toBeVisible();
  });

  test("join view is mobile-friendly", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/?mode=join&room=test");
    await expect(page.locator(".join-card")).toBeVisible();
    await expect(page.locator('[data-testid="nameInput"]')).toBeVisible();
  });
});

test.describe("Security & privacy", () => {
  test("firebase config is NOT embedded in HTML source", async ({ page }) => {
    const response = await page.goto("/");
    const html = await response!.text();
    // Should NOT contain any firebase API keys in the static HTML
    expect(html).not.toContain("AIza");
    expect(html).not.toContain("firebaseapp.com");
    // Config is loaded at runtime from /api/firebase-config
    expect(html).toContain("/api/firebase-config");
  });

  test("firebase config endpoint exists", async ({ page }) => {
    const response = await page.goto("/api/firebase-config");
    expect(response!.status()).toBe(503); // not configured in test
    const body = await response!.json();
    expect(body.error).toBeTruthy();
  });

  test("no tracking scripts in page", async ({ page }) => {
    await page.goto("/");
    const html = await page.content();
    expect(html).not.toContain("google-analytics");
    expect(html).not.toContain("gtag");
    expect(html).not.toContain("facebook");
    expect(html).not.toContain("hotjar");
  });
});
