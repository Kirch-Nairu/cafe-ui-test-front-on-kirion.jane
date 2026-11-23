import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, Bell, Check, CheckCheck, ChevronDown,
  ChevronLeft, ChevronRight, ClipboardList, Clock3, Coffee, CreditCard, LayoutDashboard,
  Menu, Minus, Moon, Plus, Printer, RefreshCw, Search, ShoppingBag, ShoppingCart,
  SlidersHorizontal, Sparkles, Sun, UtensilsCrossed, X
} from "lucide-react";
import type { CartLine, Order, Product, Receipt, Role, Scenario, Service, Stage } from "./domain";
import { ADDONS, PRODUCTS, SCENARIOS, cartCents, formatModifiers, formatPHP, getStageAction, lineCents, newCartLine, productFor, seededOrders, timePH, unitCents } from "./domain";
import "./style.css";

type PreviewStore = {
  scenario: Scenario;
  loadScenario: (value: Scenario) => void;
  role: Role;
  setRole: (value: Role) => void;
  cart: CartLine[];
  orders: Order[];
  receipt: Receipt | null;
  setReceipt: (value: Receipt | null) => void;
  add: (line: CartLine) => void;
  quantity: (key: string, next: number) => void;
  checkout: (paidCents: number, service: Service) => boolean;
  advance: (id: string) => void;
  reset: () => void;
};
const Store = createContext<PreviewStore | null>(null);
function useStore(): PreviewStore {
  const store = useContext(Store);
  if (!store) throw new Error("Preview provider missing");
  return store;
}
function StoreProvider({ children }: { children: ReactNode }) {
  const [scenario, setScenario] = useState<Scenario>("Trading day");
  const [role, setRole] = useState<Role>("Store manager");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [orders, setOrders] = useState<Order[]>(() => seededOrders("Trading day"));
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const serial = useRef(104);
  const checkoutLock = useRef(false);
  useEffect(() => { if (cart.length === 0) checkoutLock.current = false; }, [cart]);
  const loadScenario = (value: Scenario) => {
    setScenario(value);
    setRole(value === "Cashier access" ? "Counter staff" : value === "Management review" ? "Owner" : "Store manager");
    setCart([]);
    setReceipt(null);
    setOrders(seededOrders(value));
    serial.current = 104;
    checkoutLock.current = false;
  };
  const add = (line: CartLine) => {
    setCart(previous => {
      const same = previous.find(row =>
        row.productId === line.productId && row.size === line.size &&
        row.addons.join("|") === line.addons.join("|")
      );
      return same ? previous.map(row => row.key === same.key ? {...row, quantity: row.quantity + 1} : row) : [...previous, line];
    });
  };
  const quantity = (key: string, next: number) =>
    setCart(previous => previous.map(row => row.key === key ? { ...row, quantity: Math.max(0, Math.min(50, next)) } : row).filter(row => row.quantity > 0));
  const checkout = (paidCents: number, service: Service): boolean => {
    if (checkoutLock.current || cart.length === 0 || !Number.isInteger(paidCents) || paidCents < cartCents(cart)) return false;
    checkoutLock.current = true;
    const now = new Date().toISOString();
    const snapshot = cart.map(row => ({...row, addons: [...row.addons]}));
    const order: Order = {id: "S-" + String(serial.current++).padStart(3,"0"), placedAt: now, stage: "New", service, lines: snapshot, cents: cartCents(snapshot)};
    setOrders(previous => [order, ...previous]);
    setReceipt({order, paidCents, changeCents: paidCents - order.cents, issuedAt: now});
    setCart([]);
    return true;
  };
  const advance = (id: string) =>
    setOrders(previous => previous.map(order => {
      if (order.id !== id) return order;
      const action = getStageAction(order.stage);
      return action ? {...order,stage:action.next} : order;
    }));
  const value: PreviewStore = {scenario, loadScenario, role, setRole, cart, orders, receipt, setReceipt, add, quantity, checkout, advance, reset:()=>loadScenario(scenario)};
  return <Store.Provider value={value}>{children}</Store.Provider>;
}

type DialogProps = { open: boolean; title: string; label?: string; children: ReactNode; onClose: () => void; wide?: boolean };
function NativeDialog({open,title,label,children,onClose,wide=false}:DialogProps) {
  const reference = useRef<HTMLDialogElement>(null);
  useEffect(()=>{
    const element=reference.current;
    if (!element) return;
    if(open && !element.open) element.showModal();
    if(!open && element.open) element.close();
  },[open]);
  return <dialog className={"native-dialog" + (wide?" dialog-wide":"")} ref={reference}
    onClose={onClose} onMouseDown={event => { if(event.target===event.currentTarget) onClose(); }}>
    <div className="dialog-top">
      <div><span className="eyebrow">{label || "ITEM DETAILS"}</span><h2>{title}</h2></div>
      <button className="icon-button" aria-label="Close dialog" type="button" onClick={onClose}><X size={20}/></button>
    </div>
    {children}
  </dialog>;
}

function Brand() {
  return <Link to="/" className="brand" aria-label="Salryn Cafe home">
    <span className="brand-symbol"><Coffee size={24} strokeWidth={2.5}/></span>
    <span className="brand-copy"><strong>SALRYN</strong><small>CAFE OPERATIONS</small></span>
  </Link>;
}
const navItems = [
  {to:"/",label:"Overview",icon:LayoutDashboard},
  {to:"/pos",label:"Point of sale",icon:ShoppingBag},
  {to:"/orders",label:"Orders",icon:ClipboardList},
  {to:"/kitchen",label:"Kitchen display",icon:UtensilsCrossed}
];
function Shell({children}:{children:ReactNode}) {
  const {role,setRole,scenario,loadScenario,orders,reset}=useStore();
  const [theme,setTheme]=useState<"light"|"dark">(()=>{
    try { return localStorage.getItem("salryn-preview-theme")==="dark" ? "dark":"light"; } catch {return "light";}
  });
  useEffect(()=>{
    document.documentElement.dataset.theme=theme;
    try {localStorage.setItem("salryn-preview-theme",theme);} catch { /* visual preference stays in memory */ }
  },[theme]);
  const location=useLocation();
  const pageTitle = navItems.find(item=>item.to===location.pathname)?.label ?? "Operations";
  const activeCount=orders.filter(order=>order.stage!=="Completed").length;
  return <div className="app-layout">
    <aside className="sidebar no-print" aria-label="Primary navigation">
      <Brand/>
      <div className="sidebar-middle">
        <div className="sidebar-label">WORKSPACE</div>
        <nav className="side-nav">
          {navItems.map(({to,label,icon:Icon}) => <NavLink key={to} to={to} end={to==="/"} aria-label={label} title={label} className={({isActive})=>"side-link"+(isActive?" selected":"")}>
            <Icon size={19} strokeWidth={1.8}/><span>{label}</span>
            {to==="/kitchen" && activeCount>0 && <small className="nav-count">{activeCount}</small>}
          </NavLink>)}
        </nav>
        <div className="sidebar-label section-gap">PREVIEW CONTROLS</div>
        <div className="sidebar-help">
          <Sparkles size={18}/><strong>Explore the cafe</strong>
          <p>Try the register, change sample situations, and follow orders through the kitchen.</p>
        </div>
      </div>
      <div className="sidebar-footer">
        <div className="avatar">SC</div>
        <div><strong>Sample Cafe</strong><small>Standalone design preview</small></div>
        <span className="online-dot" title="Preview mode active"/>
      </div>
    </aside>
    <main className="main-column">
      <div className="preview-strip"><span className="strip-dot"/> Design Preview — Sample Data Only <span className="strip-extra">· Nothing here connects to a live cafe</span></div>
      <header className="topbar no-print">
        <div className="breadcrumbs"><span className="desktop-breadcrumb">Workspace</span><ChevronRight size={15}/><strong>{pageTitle}</strong></div>
        <div className="top-actions">
          <label className="select-wrap scenario-wrap">
            <span className="visually-hidden">Sample situation</span>
            <SlidersHorizontal size={16}/>
            <select aria-label="Sample situation" value={scenario} onChange={event=>loadScenario(event.target.value as Scenario)}>
              {SCENARIOS.map(value=><option key={value}>{value}</option>)}
            </select>
            <ChevronDown size={14}/>
          </label>
          <label className="select-wrap role-wrap">
            <span className="visually-hidden">Preview access</span>
            <select aria-label="Preview access" value={role} onChange={event=>setRole(event.target.value as Role)}>
              <option>Counter staff</option><option>Store manager</option><option>Owner</option>
            </select><ChevronDown size={14}/>
          </label>
          <button className="icon-button reset-control" type="button" onClick={reset} title="Reset sample data" aria-label="Reset sample data"><RefreshCw size={18}/></button>
          <button className="icon-button theme-control" type="button" onClick={()=>setTheme(t=>t==="light"?"dark":"light")} title="Switch appearance" aria-label="Switch appearance">
            {theme==="light"?<Moon size={19}/>:<Sun size={19}/>}
          </button>
        </div>
      </header>
      {scenario==="Connection notice" && <div className="connection-notice" role="status">Connection notice preview · All actions remain local to this browser session. No payments are processed.</div>}
      {scenario==="Low stock" && <div className="connection-notice stock-notice" role="status">Low-stock example · Check product availability before taking new orders.</div>}
      <div className="page-area">{children}</div>
    </main>
    <nav className="mobile-nav no-print" aria-label="Mobile navigation">
      {navItems.map(({to,label,icon:Icon})=><NavLink key={to} to={to} end={to==="/"} className={({isActive})=>"mobile-nav-item"+(isActive?" selected":"")}>
        <Icon size={21}/><span>{label==="Point of sale"?"Register":label==="Kitchen display"?"Kitchen":label}</span>
      </NavLink>)}
    </nav>
  </div>;
}
function PageHeading({eyebrow,title,description,action}:{eyebrow:string;title:string;description:string;action?:ReactNode}) {
  return <div className="page-heading">
    <div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="page-description">{description}</p></div>
    {action && <div className="heading-action">{action}</div>}
  </div>;
}
function Pill({stage}:{stage:Stage}) {return <span className={"status-pill status-"+stage.toLowerCase()}>{stage}</span>;}
function Empty({icon,heading,description}:{icon:ReactNode;heading:string;description:string}) {
  return <div className="empty-state">{icon}<h3>{heading}</h3><p>{description}</p></div>;
}

function Overview() {
  const {orders,cart,scenario,role}=useStore();
  const active=orders.filter(o=>o.stage!=="Completed");
  const pending=orders.filter(o=>o.stage==="New").length;
  const preparing=orders.filter(o=>o.stage==="Preparing").length;
  const ready=orders.filter(o=>o.stage==="Ready").length;
  return <div className="overview-page">
    <PageHeading eyebrow="TUESDAY · CAFE OPERATIONS" title="A better day starts here."
      description="Everything your team needs for the next great cup, in one calm workspace."
      action={<Link className="primary-btn" to="/pos">Open register <ArrowRight size={18}/></Link>}/>
    <section className="hero-overview">
      <div className="hero-left">
        <span className="hero-kicker"><span className="live-indicator"/> YOUR COUNTER, AT A GLANCE</span>
        <h2>Keep the good<br/><em>things moving.</em></h2>
        <p>From the first order to the final pickup—stay focused on the people in front of you.</p>
        <Link to="/kitchen" className="hero-link">View kitchen queue <ArrowUpRight size={18}/></Link>
      </div>
      <div className="hero-decoration" aria-hidden="true"><span className="circle circle-one"/><span className="circle circle-two"/><span className="hero-cup">☕</span><span className="hero-sun">✳</span></div>
    </section>
    <div className="metric-grid">
      <div className="metric-card"><span className="metric-label">Open orders <ShoppingBag size={18}/></span><strong>{active.length.toString().padStart(2,"0")}</strong><span className="metric-note"><ArrowUpRight size={15}/> Orders in progress</span></div>
      <div className="metric-card"><span className="metric-label">Awaiting prep <Clock3 size={18}/></span><strong>{pending.toString().padStart(2,"0")}</strong><span className="metric-note">Ready for the barista</span></div>
      <div className="metric-card"><span className="metric-label">Being prepared <Coffee size={18}/></span><strong>{preparing.toString().padStart(2,"0")}</strong><span className="metric-note">On the preparation line</span></div>
      <div className="metric-card"><span className="metric-label">Ready for pickup <CheckCheck size={18}/></span><strong>{ready.toString().padStart(2,"0")}</strong><span className="metric-note">Waiting for handoff</span></div>
    </div>
    <div className="overview-bottom">
      <section className="panel">
        <div className="panel-heading"><div><p className="eyebrow">RIGHT NOW</p><h2>Order activity</h2></div><Link to="/orders" className="plain-link">See all <ArrowRight size={16}/></Link></div>
        {active.length===0?<Empty icon={<ClipboardList size={28}/>} heading="All caught up" description="New orders will appear here."/>:
        <div className="activity-list">{active.slice(0,4).map(order=><Link to="/orders" className="activity-row" key={order.id}>
          <span className="activity-icon"><ShoppingBag size={18}/></span>
          <span className="activity-main"><strong>{order.id} <span>· {order.service}</span></strong><small>{order.lines.map(item=>productFor(item.productId).name).join(", ")}</small></span>
          <Pill stage={order.stage}/><ChevronRight size={16}/>
        </Link>)}</div>}
      </section>
      <section className="panel today-card">
        <div className="panel-heading"><div><p className="eyebrow">YOUR WORKSPACE</p><h2>Quick actions</h2></div></div>
        <Link className="quick-action" to="/pos"><span className="quick-icon"><ShoppingCart size={21}/></span><span><strong>Start a new order</strong><small>{cart.length?cart.length+" items saved in your cart":"Open the counter register"}</small></span><ArrowUpRight size={18}/></Link>
        <Link className="quick-action" to="/kitchen"><span className="quick-icon mint"><UtensilsCrossed size={21}/></span><span><strong>Kitchen board</strong><small>Prepare and hand off orders</small></span><ArrowUpRight size={18}/></Link>
        <div className="operator-note"><span className="mini-avatar">{role.charAt(0)}</span><span><strong>{role}</strong><small>{scenario} · Sample workspace</small></span></div>
      </section>
    </div>
  </div>;
}

function ProductDialog({product,onClose,onAdd}:{product:Product|null;onClose:()=>void;onAdd:(line:CartLine)=>void}) {
  const [size,setSize]=useState("");
  const [addons,setAddons]=useState<string[]>([]);
  useEffect(()=>{setSize(product?.sizes[0].label||"");setAddons([]);},[product]);
  const enabled=!!product;
  const chosen: CartLine | null = product && size ? newCartLine(product.id,size,addons,"new") : null;
  const price=chosen?unitCents(chosen):0;
  const toggle = (item:string)=>setAddons(previous=>previous.includes(item)?previous.filter(x=>x!==item):[...previous,item]);
  return <NativeDialog open={enabled} onClose={onClose} title={product?.name??"Item"} label="CUSTOMIZE YOUR ITEM">
    {product && <>
      <div className={"dialog-product-image tone-"+product.tone}><span>{product.emoji}</span></div>
      <div className="dialog-content">
        <p className="item-description">{product.description}</p>
        <fieldset className="option-fieldset"><legend>Choose a size</legend>
          <div className="option-row">{product.sizes.map(option=><button key={option.label} type="button" aria-pressed={size===option.label}
            className={"choice-button"+(size===option.label?" active":"")} onClick={()=>setSize(option.label)}>
            <strong>{option.label}</strong><span>{option.extraCents?"+ "+formatPHP(option.extraCents):"Included"}</span>
          </button>)}</div>
        </fieldset>
        {product.canCustomize && <fieldset className="option-fieldset"><legend>Make it yours <span className="muted">(optional)</span></legend>
          <div className="addon-list">{Object.entries(ADDONS).map(([name,cents])=><button type="button" key={name} className={"addon-choice"+(addons.includes(name)?" active":"")} aria-pressed={addons.includes(name)} onClick={()=>toggle(name)}>
            <span className="addon-check">{addons.includes(name)&&<Check size={14}/>}</span><span>{name}</span><small>{cents?"+ "+formatPHP(cents):"Free"}</small>
          </button>)}</div>
        </fieldset>}
      </div>
      <div className="dialog-footer"><button type="button" className="secondary-btn" onClick={onClose}>Cancel</button>
        <button className="primary-btn dialog-add" type="button" onClick={()=>{if(chosen)onAdd({...chosen,key:"cart-"+crypto.randomUUID()});}}>
          <Plus size={18}/> Add to order <span>{formatPHP(price)}</span>
        </button>
      </div>
    </>}
  </NativeDialog>;
}

function ReceiptDialog({receipt,onClose}:{receipt:Receipt|null;onClose:()=>void}) {
  return <NativeDialog open={!!receipt} onClose={onClose} title="Sale recorded in preview" label="SAMPLE RECEIPT">
    {receipt && <div className="receipt-wrap">
      <div className="receipt-paper" id="print-receipt">
        <div className="receipt-header"><strong>SALRYN CAFE</strong><small>DESIGN PREVIEW · NOT A TAX RECEIPT</small><p>Order {receipt.order.id}</p><p>{timePH(receipt.issuedAt)} · {receipt.order.service}</p></div>
        <div className="receipt-list">{receipt.order.lines.map(line=><div className="receipt-line" key={line.key}>
          <div><strong>{line.quantity} × {productFor(line.productId).name}</strong><small>{formatModifiers(line)}</small></div><strong>{formatPHP(lineCents(line))}</strong>
        </div>)}</div>
        <div className="receipt-total"><span>Sample total</span><strong>{formatPHP(receipt.order.cents)}</strong></div>
        <div className="receipt-detail"><span>Cash given</span><span>{formatPHP(receipt.paidCents)}</span></div>
        <div className="receipt-detail"><span>Change</span><span>{formatPHP(receipt.changeCents)}</span></div>
        <div className="receipt-thanks">Thank you for stopping by!<small>Sample data only · No payment was taken</small></div>
      </div>
      <p className="receipt-disclaimer">This preview does not create real sales, inventory movements, fiscal receipts, or kitchen dispatches.</p>
      <div className="dialog-footer receipt-actions"><button className="secondary-btn" type="button" onClick={()=>window.print()}><Printer size={17}/> Print sample</button>
        <button className="primary-btn" type="button" onClick={onClose}>Back to register <ArrowRight size={17}/></button></div>
    </div>}
  </NativeDialog>;
}

function CartPanel({mobile,onClose}:{mobile:boolean;onClose:()=>void}) {
  const {cart,quantity,checkout}=useStore();
  const [service,setService]=useState<Service>("Takeout");
  const [cash,setCash]=useState("");
  const [error,setError]=useState("");
  const total=cartCents(cart);
  const cashCents=Math.round(Number(cash)*100);
  const change=cash.trim()!=="" && Number.isFinite(cashCents) && cashCents>=total ? cashCents-total:0;
  const submit=(event:FormEvent)=>{
    event.preventDefault();
    if(!cart.length){setError("Add an item before checking out.");return;}
    if(cash.trim()==="" || !Number.isFinite(cashCents) || cashCents<total){setError("Enter enough sample cash to cover this order.");return;}
    if(checkout(cashCents,service)){setCash("");setError("");onClose();}
    else setError("This sample order could not be completed. Check the amount and try again.");
  };
  return <div className={"cart-panel-content"+(mobile?" is-mobile":"")}>
    <div className="cart-header"><div><p className="eyebrow">ACTIVE ORDER</p><h2>Your cart <span className="cart-count">{cart.reduce((sum,row)=>sum+row.quantity,0)}</span></h2></div>
      {mobile && <button className="icon-button" onClick={onClose} aria-label="Close cart"><X size={20}/></button>}
      {!mobile && <span className="cart-icon"><ShoppingCart size={20}/></span>}
    </div>
    <div className="service-switch" aria-label="Service type">
      {(["Takeout","Dine-in"] as Service[]).map(value=><button key={value} type="button" onClick={()=>setService(value)} className={service===value?"active":""} aria-pressed={service===value}>{value}</button>)}
    </div>
    <div className="cart-lines">
      {cart.length===0?<div className="cart-empty"><span>🛍️</span><strong>Ready when you are.</strong><p>Choose something good from the menu to start an order.</p></div>:
       cart.map(line=><div className="cart-line" key={line.key}>
        <div className={"cart-thumb tone-"+productFor(line.productId).tone}>{productFor(line.productId).emoji}</div>
        <div className="cart-line-main"><strong>{productFor(line.productId).name}</strong>
          <small>{formatModifiers(line)}</small>
          <div className="quantity-row"><button aria-label={"Decrease "+productFor(line.productId).name} type="button" onClick={()=>quantity(line.key,line.quantity-1)}><Minus size={15}/></button><span>{line.quantity}</span>
            <button aria-label={"Increase "+productFor(line.productId).name} type="button" onClick={()=>quantity(line.key,line.quantity+1)}><Plus size={15}/></button></div>
        </div><strong className="line-total">{formatPHP(lineCents(line))}</strong>
       </div>)}
    </div>
    <form className="checkout-area" onSubmit={submit}>
      <div className="amount-line"><span>Subtotal</span><strong>{formatPHP(total)}</strong></div>
      <div className="amount-line amount-total"><span>Sample total</span><strong>{formatPHP(total)}</strong></div>
      <label className="cash-label" htmlFor={mobile?"mobile-cash":"desktop-cash"}><span>Cash given (sample)</span><span className="cash-note"><CreditCard size={15}/> No real charge</span></label>
      <div className="cash-input-wrap"><span>₱</span><input id={mobile?"mobile-cash":"desktop-cash"} aria-label="Cash given" type="number" min="0" step="0.01" inputMode="decimal" placeholder="0.00" value={cash} onChange={event=>{setCash(event.target.value);setError("");}}/></div>
      <div className="change-preview"><span>Change</span><strong>{formatPHP(change)}</strong></div>
      {error && <p className="inline-error" role="alert">{error}</p>}
      <button type="submit" disabled={!cart.length} className="checkout-button">Complete sample sale <ArrowRight size={19}/></button>
      <p className="checkout-footnote">A preview only. No payment, fiscal receipt or stock movement.</p>
    </form>
  </div>;
}

function POS() {
  const {scenario,cart,add,receipt,setReceipt}=useStore();
  const [category,setCategory]=useState("All items");
  const [search,setSearch]=useState("");
  const [selected,setSelected]=useState<Product|null>(null);
  const [mobileCart,setMobileCart]=useState(false);
  const categories=["All items","Coffee","Non-coffee","Tea","Bakery"];
  const visible=useMemo(()=>PRODUCTS.filter(p=>(category==="All items"||p.category===category) && (p.name+" "+p.description).toLowerCase().includes(search.toLowerCase())),[category,search]);
  const count=cart.reduce((sum,line)=>sum+line.quantity,0);
  return <div className="pos-page">
    <PageHeading eyebrow="COUNTER / ORDER TAKING" title="The good stuff." description="Find a favorite, make it their own, and keep the line moving."
      action={<span className="shift-chip"><span className="live-indicator"/> Register preview · Open</span>}/>
    <div className="pos-layout">
      <section className="menu-section">
        <div className="menu-tools"><label className="search-box"><Search size={19}/><span className="visually-hidden">Search menu</span><input aria-label="Search menu" placeholder="Search drinks, pastries..." value={search} onChange={event=>setSearch(event.target.value)}/></label>
          <span className="menu-count">{visible.length} items</span></div>
        <div className="category-tabs" aria-label="Menu categories">{categories.map(item=><button key={item} type="button" className={item===category?"active":""} aria-pressed={item===category} onClick={()=>setCategory(item)}>{item}</button>)}</div>
        <div className="menu-label-row"><div><span className="eyebrow">OUR MENU</span><h2>{category==="All items"?"Made for every moment":category}</h2></div><span>Tap an item to customize</span></div>
        {visible.length===0?<Empty icon={<Search size={28}/>} heading="Nothing on this shelf" description="Try another search or category."/>:
          <div className="product-grid">{visible.map(product=><button className="product-card" type="button" key={product.id} aria-label={"Add "+product.name} onClick={()=>setSelected(product)}>
            <span className={"product-art tone-"+product.tone}><span className="product-emoji">{product.emoji}</span><span className="product-art-ring"/></span>
            <span className="product-copy"><strong>{product.name}</strong><small>{product.description}</small>
              <span className="product-footer"><b>{formatPHP(product.cents)}</b><span className="product-plus"><Plus size={18}/></span></span>
            </span>
          </button>)}</div>}
        <div className="menu-bottom-note"><Sparkles size={18}/> Thoughtfully made, one order at a time.</div>
      </section>
      <aside className="cart-panel" aria-label="Current order"><CartPanel mobile={false} onClose={()=>{}}/></aside>
    </div>
    {mobileCart && <><button className="cart-scrim" type="button" aria-label="Close cart" onClick={()=>setMobileCart(false)}/><aside className="mobile-cart-sheet" aria-label="Current order"><CartPanel mobile={true} onClose={()=>setMobileCart(false)}/></aside></>}
    <div className="mobile-cart-bar"><div><span>{count} {count===1?"item":"items"} in cart</span><strong>{formatPHP(cartCents(cart))}</strong></div><button type="button" onClick={()=>setMobileCart(true)}>View cart <ArrowUpRight size={18}/></button></div>
    <ProductDialog product={selected} onClose={()=>setSelected(null)} onAdd={line=>{add(line);setSelected(null);}}/>
    <ReceiptDialog receipt={receipt} onClose={()=>setReceipt(null)}/>
    {scenario==="Low stock" && <span className="visually-hidden">Sample low-stock case available</span>}
  </div>;
}

function OrderDetail({order,onClose}:{order:Order|null;onClose:()=>void}) {
  return <NativeDialog open={!!order} onClose={onClose} title={order?.id??"Order"} label="ORDER DETAILS">
    {order && <div className="dialog-content detail-content">
      <div className="detail-facts"><span><Clock3 size={16}/> Placed {timePH(order.placedAt)}</span><span>{order.service}</span><Pill stage={order.stage}/></div>
      <h3>Items in this order</h3>
      {order.lines.map(line=><div className="detail-item" key={line.key}><span><strong>{line.quantity}× {productFor(line.productId).name}</strong><small>{formatModifiers(line)}</small></span><strong>{formatPHP(lineCents(line))}</strong></div>)}
      <div className="detail-total"><strong>Sample total</strong><strong>{formatPHP(order.cents)}</strong></div>
      <p className="detail-note">Ticket actions are available from the kitchen board. This is sample data only.</p>
      <Link to="/kitchen" onClick={onClose} className="primary-btn full-btn">View kitchen board <ArrowRight size={17}/></Link>
    </div>}
  </NativeDialog>;
}

function Orders() {
  const {orders}=useStore();
  const [filter,setFilter]=useState("Active");
  const [search,setSearch]=useState("");
  const [selectedId,setSelectedId]=useState<string|null>(null);
  const filtered=orders.filter(order=>(filter==="All"||(filter==="Active"?order.stage!=="Completed":order.stage===filter))&&
    (order.id.toLowerCase().includes(search.toLowerCase())||order.lines.some(l=>productFor(l.productId).name.toLowerCase().includes(search.toLowerCase()))));
  const selected=orders.find(o=>o.id===selectedId)??null;
  return <div className="orders-page">
    <PageHeading eyebrow="COUNTER / ORDER TRACKING" title="Every order, on track." description="A clear view of what is new, what's brewing, and what is ready."
      action={<Link to="/pos" className="primary-btn"><Plus size={18}/> New order</Link>}/>
    <div className="panel orders-panel">
      <div className="orders-tools"><div className="filter-chips" aria-label="Filter orders">{["Active","All","New","Preparing","Ready","Completed"].map(value=><button key={value} className={filter===value?"active":""} onClick={()=>setFilter(value)} type="button">{value}</button>)}</div>
        <label className="search-box orders-search"><Search size={17}/><input aria-label="Search orders" placeholder="Find an order..." value={search} onChange={e=>setSearch(e.target.value)}/></label></div>
      <div className="orders-headline"><strong>{filtered.length} {filtered.length===1?"order":"orders"}</strong><span>Latest first · Asia/Manila time</span></div>
      {filtered.length===0?<Empty icon={<ClipboardList size={30}/>} heading="Nothing here yet" description="Orders matching this view will appear as they arrive."/>:
      <div className="orders-list">{filtered.map(order=><article className="order-row" key={order.id}>
        <div className="order-number-icon"><ShoppingBag size={20}/></div>
        <div className="order-description"><h3>{order.id} <small>· {order.service}</small></h3><p>{order.lines.map(l=>l.quantity+"× "+productFor(l.productId).name).join(", ")}</p>
          <span className="order-time"><Clock3 size={14}/> {timePH(order.placedAt)}</span></div>
        <Pill stage={order.stage}/><strong className="order-price">{formatPHP(order.cents)}</strong>
        <button type="button" className="row-open" onClick={()=>setSelectedId(order.id)} aria-label={"View "+order.id}>View order <ArrowRight size={16}/></button>
      </article>)}</div>}
    </div>
    <OrderDetail order={selected} onClose={()=>setSelectedId(null)}/>
  </div>;
}

function Kitchen() {
  const {orders,advance}=useStore();
  const [filter,setFilter]=useState("In progress");
  const [selectedId,setSelectedId]=useState<string|null>(null);
  const displayed=orders.filter(order=>filter==="All"||(filter==="In progress"?order.stage!=="Completed":order.stage===filter));
  const sorted=[...displayed].sort((a,b)=>new Date(a.placedAt).getTime()-new Date(b.placedAt).getTime());
  const counts={new:orders.filter(o=>o.stage==="New").length,preparing:orders.filter(o=>o.stage==="Preparing").length,ready:orders.filter(o=>o.stage==="Ready").length};
  return <div className="kitchen-page">
    <PageHeading eyebrow="KITCHEN / LIVE QUEUE" title="Made with care. Sent with speed."
      description="A calm, legible board for the moments when every second counts."
      action={<span className="shift-chip"><span className="live-indicator"/> Kitchen preview</span>}/>
    <div className="kitchen-summary">
      <div><span className="summary-spot summary-new"/><strong>{counts.new}</strong><span>New tickets</span></div>
      <div><span className="summary-spot summary-prep"/><strong>{counts.preparing}</strong><span>Preparing</span></div>
      <div><span className="summary-spot summary-ready"/><strong>{counts.ready}</strong><span>Ready to hand off</span></div>
    </div>
    <div className="kitchen-filter-header"><div className="filter-chips">{["In progress","New","Preparing","Ready","Completed","All"].map(value=><button key={value} className={filter===value?"active":""} onClick={()=>setFilter(value)} type="button">{value}</button>)}</div><span>{sorted.length} visible tickets</span></div>
    {sorted.length===0?<div className="panel"><Empty icon={<CheckCheck size={32}/>} heading="The kitchen is clear" description="New orders will arrive here as they are placed in the sample register."/></div>:
    <div className="ticket-grid">{sorted.map(order=>{
      const elapsed=Math.max(0,Math.floor((Date.now()-new Date(order.placedAt).getTime())/60000));
      const next=getStageAction(order.stage);
      return <article key={order.id} className={"ticket-card"+(elapsed>=15&&order.stage!=="Completed"?" delayed":"")}>
        <div className="ticket-top"><div><span className="ticket-label">ORDER TICKET</span><h2>{order.id}</h2></div><Pill stage={order.stage}/></div>
        <div className="ticket-meta"><span><Clock3 size={15}/> {elapsed} min ago {elapsed>=15&&order.stage!=="Completed"?"· Delayed":""}</span><span>{order.service}</span></div>
        <div className="ticket-items">{order.lines.map(line=><div className="ticket-item" key={line.key}>
          <span className="ticket-qty">{line.quantity}×</span><div><strong>{productFor(line.productId).name}</strong><small>{formatModifiers(line)}</small></div>
        </div>)}</div>
        <div className="ticket-bottom">{next?<button type="button" className="ticket-action" onClick={()=>advance(order.id)}>{next.label}<ArrowRight size={18}/></button>:
          <span className="ticket-completed"><CheckCheck size={18}/> Handed off</span>}
          <button type="button" className="ticket-details" onClick={()=>setSelectedId(order.id)}>Details <ChevronRight size={15}/></button></div>
      </article>;
    })}</div>}
    <OrderDetail order={orders.find(o=>o.id===selectedId)??null} onClose={()=>setSelectedId(null)}/>
  </div>;
}
function App() {
  const navigate=useNavigate();
  const location=useLocation();
  useEffect(()=>{window.scrollTo(0,0);},[location.pathname]);
  useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.altKey&&e.key==="1")navigate("/pos");if(e.altKey&&e.key==="2")navigate("/orders");if(e.altKey&&e.key==="3")navigate("/kitchen");};window.addEventListener("keydown",key);return()=>window.removeEventListener("keydown",key);},[navigate]);
  return <Shell><Routes><Route path="/" element={<Overview/>}/><Route path="/pos" element={<POS/>}/><Route path="/orders" element={<Orders/>}/><Route path="/kitchen" element={<Kitchen/>}/><Route path="*" element={<Navigate to="/" replace/>}/></Routes></Shell>;
}
createRoot(document.getElementById("root")!).render(<BrowserRouter><StoreProvider><App/></StoreProvider></BrowserRouter>);
