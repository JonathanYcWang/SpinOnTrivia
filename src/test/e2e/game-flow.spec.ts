import { expect, test } from "@playwright/test";

test("player starts from JSON data and completes a board question", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Admin" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Start Game" })).toHaveCount(0);

  await expect(page.getByLabel("0 coins", { exact: true })).toBeVisible();
  await page.getByLabel("20 coins", { exact: true }).first().click();
  await page.getByRole("button", { name: "Reveal Answer" }).click();
  await expect(page.getByRole("dialog")).toContainText("Answer:");
  await page.getByRole("button", { name: "Correct", exact: true }).click();
  await expect(
    page.getByLabel("20 coins", { exact: true }).first(),
  ).toBeVisible();
});

test("query-gated edit mode saves board and reward overrides", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Add reward" })).toHaveCount(0);

  await page.goto("/?isEditMode=true");
  await expect(page.getByRole("button", { name: "Add reward" })).toHaveCount(0);

  await page.getByLabel("20 coins", { exact: true }).first().click();
  await page.getByLabel("Question").fill("Edited question?");
  await page.getByLabel("Answer").fill("Edited answer");
  await page.getByRole("button", { name: "Save" }).click();

  await page.getByLabel("20 coins", { exact: true }).first().click();
  await expect(page.getByLabel("Question")).toHaveValue("Edited question?");
  await expect(page.getByLabel("Answer")).toHaveValue("Edited answer");
  await page.getByRole("button", { name: "Cancel" }).click();

  await page.getByRole("tab", { name: "Shop" }).click();
  await page.getByRole("button", { name: "Add reward" }).click();
  await expect(page.locator('input[value="A Placeholder"]')).toBeVisible();
  await page.getByLabel("Reward name").first().fill("Edited Reward");
  await page.getByLabel("Reward value").first().selectOption("50");
  await page.getByRole("button", { name: "Save" }).click();

  await page.goto("/");
  await page.getByRole("tab", { name: "Shop" }).click();
  await expect(page.getByText("Edited Reward")).toBeVisible();

  await page.getByRole("tab", { name: "Wheel" }).click();
  await expect(page.getByLabel("Reward wheel")).toContainText("Edited Reward");
});
