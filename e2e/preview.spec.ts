import { test, expect } from "@playwright/test";

test("J1+J2 register to kitchen journey preserves cart and matches sample receipt", async ({page},testInfo)=>{
  const errors:string[]=[];
  page.on("pageerror",error=>errors.push(error.message));
  await page.goto("/pos");
  await expect(page.getByText("Design Preview — Sample Data Only")).toBeVisible();
  await page.getByRole("button",{name:"Add Honey Oat Latte"}).click();
  const customizer=page.locator("dialog[open]");
  await expect(customizer).toBeVisible();
  await customizer.getByRole("button",{name:/Large/}).click();
  await customizer.getByRole("button",{name:/Oat milk/}).click();
  await customizer.getByRole("button",{name:/Vanilla/}).click();
  await customizer.getByRole("button",{name:/Add to order/}).click();
  await page.getByRole("button",{name:"Add Butter Croissant"}).click();
  await page.locator("dialog[open]").getByRole("button",{name:/Add to order/}).click();

  await page.getByRole("link",{name:"Orders",exact:true}).click();
  await expect(page.getByRole("heading",{name:"Every order, on track."})).toBeVisible();
  await page.getByRole("link",{name:/^Kitchen(?: display)?$/}).click();
  await expect(page.getByRole("heading",{name:"Made with care. Sent with speed."})).toBeVisible();
  await expect.poll(()=>page.evaluate(()=>window.scrollY)).toBe(0);
  await page.getByRole("link",{name:/^(Point of sale|Register)$/}).click();

  if(testInfo.project.name==="390x844") await page.getByRole("button",{name:/View cart/}).click();
  await expect(page.getByText("Honey Oat Latte").last()).toBeVisible();
  await expect(page.getByText("Butter Croissant").last()).toBeVisible();
  await page.screenshot({path:"test-results/evidence-pos-"+testInfo.project.name+".png"});
  await page.getByRole("spinbutton",{name:"Cash given"}).fill("1000");
  await page.getByRole("button",{name:"Complete sample sale"}).click();

  const receipt=page.locator("dialog[open]");
  await expect(receipt.getByRole("heading",{name:"Sale recorded in preview"})).toBeVisible();
  await expect(receipt).toContainText("S-104");
  await expect(receipt).toContainText("₱380.00");
  await expect(receipt).toContainText("₱620.00");
  await expect(receipt).toContainText("NOT A TAX RECEIPT");
  await receipt.getByRole("button",{name:/Back to register/}).click();

  await page.getByRole("link",{name:"Orders",exact:true}).click();
  await expect(page.getByText("S-104")).toBeVisible();
  await page.getByRole("link",{name:/^Kitchen(?: display)?$/}).click();
  await expect(page.getByRole("heading",{name:"S-104"})).toBeVisible();
  const ticket=page.locator(".ticket-card").filter({hasText:"S-104"});
  await ticket.getByRole("button",{name:"Start preparing"}).click();
  await expect(ticket).toContainText("Preparing");
  await ticket.getByRole("button",{name:"Mark ready"}).click();
  await expect(ticket).toContainText("Ready");
  await page.screenshot({path:"test-results/evidence-kitchen-"+testInfo.project.name+".png"});
  expect(errors).toEqual([]);
});

test("J1 scenario reset, empty state, keyboard focus and dark appearance",async({page},testInfo)=>{
  await page.goto("/");
  await page.screenshot({path:"test-results/evidence-overview-"+testInfo.project.name+".png"});
  await page.getByRole("combobox",{name:"Sample situation"}).selectOption("New store");
  await page.getByRole("link",{name:"Orders",exact:true}).click();
  await expect(page.getByText("Nothing here yet")).toBeVisible();
  await page.getByRole("button",{name:"Switch appearance"}).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme","dark");
  await page.getByRole("link",{name:/^(Point of sale|Register)$/}).click();
  await page.getByRole("button",{name:"Add Honey Oat Latte"}).focus();
  await expect(page.getByRole("button",{name:"Add Honey Oat Latte"})).toBeFocused();
  await page.getByRole("button",{name:"Add Honey Oat Latte"}).click();
  await page.keyboard.press("Escape");
  await expect(page.locator("dialog[open]")).toHaveCount(0);
});
