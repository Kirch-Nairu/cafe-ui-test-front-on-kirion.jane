/**
 * Public, original sample-data model. This is a design exercise, not the private
 * Cafe backend contract or an authoritative financial record.
 * All monetary calculations use integer centavos.
 */
export type Service = "Dine-in" | "Takeout";
export type Stage = "New" | "Preparing" | "Ready" | "Completed";
export type Role = "Counter staff" | "Store manager" | "Owner";
export type Scenario = "Trading day" | "Busy counter" | "New store" | "Kitchen rush" | "Low stock" | "Cashier access" | "Management review" | "Connection notice";

export type Product = {
  id: string;
  name: string;
  description: string;
  category: "Coffee" | "Non-coffee" | "Tea" | "Bakery";
  cents: number;
  emoji: string;
  tone: string;
  sizes: { label: string; extraCents: number }[];
  canCustomize: boolean;
  remaining: number;
};
export type CartLine = {
  key: string;
  productId: string;
  size: string;
  addons: string[];
  quantity: number;
};
export type Order = {
  id: string;
  placedAt: string;
  stage: Stage;
  service: Service;
  lines: CartLine[];
  cents: number;
};
export type Receipt = {
  order: Order;
  paidCents: number;
  changeCents: number;
  issuedAt: string;
};

const regular = [{ label: "Regular", extraCents: 0 }, { label: "Large", extraCents: 3500 }];
const bake = [{ label: "One size", extraCents: 0 }];
export const ADDONS: Record<string, number> = {
  "Oat milk": 3500,
  "Extra espresso": 4500,
  "Vanilla": 2500,
  "Caramel": 2500,
  "Less sugar": 0,
  "No ice": 0,
};
export const PRODUCTS: Product[] = [
  { id:"oat", name:"Honey Oat Latte", description:"Espresso · honey · toasted oat", category:"Coffee", cents:17500, emoji:"☕", tone:"honey", sizes:regular, canCustomize:true, remaining:18 },
  { id:"spanish", name:"Spanish Latte", description:"Velvety and quietly sweet", category:"Coffee", cents:16500, emoji:"🥛", tone:"coffee", sizes:regular, canCustomize:true, remaining:21 },
  { id:"americano", name:"Long Black", description:"Double espresso · filtered water", category:"Coffee", cents:12500, emoji:"☕", tone:"espresso", sizes:regular, canCustomize:true, remaining:30 },
  { id:"cappuccino", name:"Cappuccino", description:"Espresso · a soft milk cloud", category:"Coffee", cents:15500, emoji:"☕", tone:"sand", sizes:regular, canCustomize:true, remaining:14 },
  { id:"matcha", name:"Iced Matcha", description:"Stone-ground matcha · milk", category:"Non-coffee", cents:18500, emoji:"🍵", tone:"matcha", sizes:regular, canCustomize:true, remaining:8 },
  { id:"choco", name:"Dark Chocolate", description:"Rich cocoa · steamed milk", category:"Non-coffee", cents:15500, emoji:"🍫", tone:"choco", sizes:regular, canCustomize:true, remaining:17 },
  { id:"strawberry", name:"Strawberry Milk", description:"Real fruit · fresh milk", category:"Non-coffee", cents:16000, emoji:"🍓", tone:"berry", sizes:regular, canCustomize:true, remaining:13 },
  { id:"tea", name:"Peach Iced Tea", description:"Brewed black tea · peach", category:"Tea", cents:12500, emoji:"🍑", tone:"peach", sizes:regular, canCustomize:true, remaining:19 },
  { id:"hibiscus", name:"Hibiscus Cooler", description:"Bright botanical infusion", category:"Tea", cents:13500, emoji:"🌺", tone:"berry", sizes:regular, canCustomize:true, remaining:12 },
  { id:"croissant", name:"Butter Croissant", description:"Golden, flaky, baked today", category:"Bakery", cents:11000, emoji:"🥐", tone:"pastry", sizes:bake, canCustomize:false, remaining:9 },
  { id:"roll", name:"Cinnamon Roll", description:"Brown sugar · warm icing", category:"Bakery", cents:12500, emoji:"🍥", tone:"sand", sizes:bake, canCustomize:false, remaining:7 },
  { id:"cookie", name:"Sea Salt Cookie", description:"Chocolate chunks · sea salt", category:"Bakery", cents:8500, emoji:"🍪", tone:"cookie", sizes:bake, canCustomize:false, remaining:22 }
];

export const PHMoney = new Intl.NumberFormat("en-PH",{style:"currency",currency:"PHP",minimumFractionDigits:2});
export function formatPHP(cents: number): string { return PHMoney.format(cents / 100); }
export function timePH(date: string): string {
  return new Intl.DateTimeFormat("en-PH",{timeZone:"Asia/Manila",hour:"numeric",minute:"2-digit",hour12:true}).format(new Date(date));
}
export function productFor(id: string): Product {
  const p = PRODUCTS.find(p => p.id === id);
  if (!p) throw new Error("Unknown sample product");
  return p;
}
export function unitCents(line: CartLine): number {
  const p = productFor(line.productId);
  const size = p.sizes.find(s => s.label === line.size);
  if (!size) throw new Error("Unknown size");
  return p.cents + size.extraCents + line.addons.reduce((sum, addon) => sum + (ADDONS[addon] ?? 0), 0);
}
export function lineCents(line: CartLine): number { return unitCents(line) * line.quantity; }
export function cartCents(lines: CartLine[]): number { return lines.reduce((sum, line) => sum + lineCents(line), 0); }
export function formatModifiers(line: CartLine): string {
  return [line.size, ...line.addons].filter(x=>x !== "One size" && x !== "Regular").join(" · ") || "Standard";
}
export function getStageAction(stage: Stage): { label: string; next: Stage } | null {
  if(stage==="New") return {label:"Start preparing",next:"Preparing"};
  if(stage==="Preparing") return {label:"Mark ready",next:"Ready"};
  if(stage==="Ready") return {label:"Complete handoff",next:"Completed"};
  return null;
}
export function newCartLine(productId: string, size: string, addons: string[], key: string): CartLine {
  const product = productFor(productId);
  if (!product.sizes.some(option=>option.label===size)) throw new Error("Invalid size");
  if (!product.canCustomize && addons.length) throw new Error("This item cannot be customized");
  for (const addon of addons) if (!(addon in ADDONS)) throw new Error("Unknown add-on");
  return {key,productId,size,addons:[...new Set(addons)].sort(),quantity:1};
}
export function seededOrders(scenario: Scenario): Order[] {
  if (scenario === "New store") return [];
  const now = Date.now();
  const sample = (number: number, age: number, stage: Stage, service: Service, items: {id:string,qty:number}[]): Order => {
    const lines = items.map((item,index)=>({key:"initial-"+number+"-"+index,productId:item.id,size:productFor(item.id).sizes[0].label,addons:[],quantity:item.qty}));
    return {id:"S-"+String(number).padStart(3,"0"),placedAt:new Date(now-age*60000).toISOString(),stage,service,lines,cents:cartCents(lines)};
  };
  const rows = [
    sample(101,4,"New","Takeout",[{id:"oat",qty:2},{id:"croissant",qty:1}]),
    sample(100,11,"Preparing","Dine-in",[{id:"matcha",qty:1},{id:"cookie",qty:2}]),
    sample(99,19,"Ready","Takeout",[{id:"spanish",qty:1},{id:"roll",qty:1}])
  ];
  if(scenario==="Busy counter" || scenario==="Kitchen rush") {
    rows.push(sample(98,8,"New","Dine-in",[{id:"tea",qty:3}]));
    rows.push(sample(97,16,"Preparing","Takeout",[{id:"choco",qty:2}]));
    rows.push(sample(96,23,"New","Takeout",[{id:"americano",qty:2},{id:"croissant",qty:2}]));
  }
  if (scenario==="Management review") rows.push(sample(95,38,"Completed","Dine-in",[{id:"cookie",qty:1}]));
  return rows;
}
export const SCENARIOS: Scenario[] = ["Trading day","Busy counter","New store","Kitchen rush","Low stock","Cashier access","Management review","Connection notice"];
