import { expect, test } from "@playwright/test";

test.describe("painel", () => {
  test("exibe o dashboard na raiz", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  });

  test("navega para eventos", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Eventos" }).click();
    await expect(page.getByRole("heading", { name: "Eventos" })).toBeVisible();
  });
});
