import assert from "node:assert/strict";
import test from "node:test";
import { cartCents, formatPHP, getStageAction, newCartLine, seededOrders, unitCents } from "../src/domain.ts";

test("size and modifiers are priced in integer centavos",()=>{
  const line=newCartLine("oat","Large",["Oat milk","Vanilla"],"a");
  assert.equal(unitCents(line),27000);
  assert.equal(cartCents([{...line,quantity:2}]),54000);
  assert.equal(formatPHP(54000).includes("540.00"),true);
});
test("identical add-on selections cannot be double-charged",()=>{
  const line=newCartLine("oat","Regular",["Oat milk","Oat milk"],"b");
  assert.deepEqual(line.addons,["Oat milk"]);
  assert.equal(cartCents([line]),21000);
});
test("invalid sample selections cannot enter the cart",()=>{
  assert.throws(()=>newCartLine("croissant","One size",["Vanilla"],"c"));
  assert.throws(()=>newCartLine("oat","Mega",[],"d"));
});
test("empty store has no orders and rush has multiple tickets",()=>{
  assert.equal(seededOrders("New store").length,0);
  assert.ok(seededOrders("Kitchen rush").length>=5);
});
test("ticket stages have finite, explicit progressions",()=>{
  assert.equal(getStageAction("New")?.next,"Preparing");
  assert.equal(getStageAction("Preparing")?.next,"Ready");
  assert.equal(getStageAction("Ready")?.next,"Completed");
  assert.equal(getStageAction("Completed"),null);
});
