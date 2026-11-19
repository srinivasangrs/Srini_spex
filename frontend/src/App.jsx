import React, { useEffect, useState } from "react";
import { Link, Route, Routes, useNavigate, useParams } from "react-router-dom";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const GST_RATE = 0.18;

async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "API request failed");
  return data;
}

function money(value) {
  return `₹${Number(value || 0).toFixed(2)}`;
}

function getCart() {
  try { return JSON.parse(localStorage.getItem("spex_cart") || "[]"); }
  catch { return []; }
}

function saveCart(cart) {
  localStorage.setItem("spex_cart", JSON.stringify(cart));
  window.dispatchEvent(new Event("spex-cart-updated"));
}

function Navbar() {
  const [count, setCount] = useState(getCart().reduce((n, i) => n + i.quantity, 0));

  useEffect(() => {
    const update = () => setCount(getCart().reduce((n, i) => n + i.quantity, 0));
    window.addEventListener("spex-cart-updated", update);
    return () => window.removeEventListener("spex-cart-updated", update);
  }, []);

  return (
    <header className="nav">
      <Link className="brand" to="/">SPEX</Link>
      <nav>
        <Link to="/">Shop</Link>
        <Link to="/cart">Cart ({count})</Link>
      </nav>
    </header>
  );
}

function Home() {
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/products")
      .then(data => setProducts(data.products || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const categories = ["All", ...new Set(products.map(p => p.category))];
  const filtered = products.filter(p => {
    const matchesCategory = category === "All" || p.category === category;
    const matchesQuery = p.name.toLowerCase().includes(query.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  if (loading) return <Page><div className="card">Loading products...</div></Page>;

  return (
    <Page>
      <section className="hero">
        <div>
          <p className="eyebrow">SMART VISION • MODERN STYLE</p>
          <h1>Find your perfect SPEX.</h1>
          <p>Quality spectacles with a simple online ordering experience.</p>
          <Link className="button" to="/cart">View Cart</Link>
        </div>
      </section>

      {error && <div className="error">{error}</div>}

      <section className="toolbar">
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search spectacles..." />
        <div className="chips">
          {categories.map(c => (
            <button className={category === c ? "chip active" : "chip"} onClick={() => setCategory(c)} key={c}>
              {c}
            </button>
          ))}
        </div>
      </section>

      <section className="grid">
        {filtered.map(product => <ProductCard key={product.id} product={product} />)}
      </section>
    </Page>
  );
}

function ProductCard({ product }) {
  const add = () => {
    const cart = getCart();
    const found = cart.find(i => i.id === product.id);
    if (found) found.quantity += 1;
    else cart.push({ id: product.id, name: product.name, price: Number(product.price), image: product.image, quantity: 1 });
    saveCart(cart);
    alert("Added to cart");
  };

  return (
    <article className="product">
      <img src={product.image} alt={product.name} />
      <div className="product-body">
        <span>{product.category}</span>
        <h3>{product.name}</h3>
        <p>{product.description}</p>
        <strong>{money(product.price)}</strong>
        {product.discount > 0 && <small>{product.discount}% discount</small>}
        <div className="row">
          <Link className="button secondary" to={`/product/${product.id}`}>Details</Link>
          <button className="button" onClick={add} disabled={product.stock <= 0}>
            {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
          </button>
        </div>
      </div>
    </article>
  );
}

function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api(`/products/${id}`).then(d => setProduct(d.product)).catch(e => setError(e.message));
  }, [id]);

  if (error) return <Page><div className="error">{error}</div></Page>;
  if (!product) return <Page><div className="card">Loading...</div></Page>;

  const add = () => {
    const cart = getCart();
    const found = cart.find(i => i.id === product.id);
    if (found) found.quantity += 1;
    else cart.push({ id: product.id, name: product.name, price: Number(product.price), image: product.image, quantity: 1 });
    saveCart(cart);
  };

  return <Page>
    <div className="details">
      <img src={product.image} alt={product.name} />
      <div>
        <p className="eyebrow">{product.category}</p>
        <h1>{product.name}</h1>
        <p>{product.description}</p>
        <h2>{money(product.price)}</h2>
        <p>Available stock: {product.stock}</p>
        <button className="button" onClick={add} disabled={product.stock <= 0}>Add to Cart</button>
      </div>
    </div>
  </Page>;
}

function Cart() {
  const [cart, setCart] = useState(getCart());

  const update = (id, delta) => {
    const next = cart.map(i => i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i);
    setCart(next); saveCart(next);
  };

  const remove = id => {
    const next = cart.filter(i => i.id !== id);
    setCart(next); saveCart(next);
  };

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const gst = subtotal * GST_RATE;
  const total = subtotal + gst;

  if (!cart.length) return <Page><div className="empty"><h2>Your cart is empty</h2><Link className="button" to="/">Shop Spectacles</Link></div></Page>;

  return <Page>
    <h1>Shopping Cart</h1>
    <div className="cart-layout">
      <div>
        {cart.map(item => <div className="cart-item" key={item.id}>
          <img src={item.image} alt="" />
          <div className="grow">
            <h3>{item.name}</h3>
            <p>{money(item.price)}</p>
            <div className="quantity">
              <button onClick={() => update(item.id, -1)}>-</button>
              <b>{item.quantity}</b>
              <button onClick={() => update(item.id, 1)}>+</button>
            </div>
          </div>
          <button className="link-danger" onClick={() => remove(item.id)}>Remove</button>
        </div>)}
      </div>
      <Summary subtotal={subtotal} gst={gst} total={total} action={<Link className="button full" to="/checkout">Proceed to Checkout</Link>} />
    </div>
  </Page>;
}

function Summary({ subtotal, gst, total, action }) {
  return <div className="summary">
    <h2>Order Summary</h2>
    <div><span>Subtotal</span><b>{money(subtotal)}</b></div>
    <div><span>GST (18%)</span><b>{money(gst)}</b></div>
    <hr />
    <div className="total"><span>Total</span><b>{money(total)}</b></div>
    {action}
  </div>;
}

function Checkout() {
  const navigate = useNavigate();
  const [cart] = useState(getCart());
  const [form, setForm] = useState({ name: "", mobile: "", email: "", address: "", paymentMethod: "COD" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const gst = subtotal * GST_RATE;
  const total = subtotal + gst;

  const change = e => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async e => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const data = await api("/orders", {
        method: "POST",
        body: JSON.stringify({
          customer: { name: form.name, mobile: form.mobile, email: form.email, address: form.address },
          paymentMethod: form.paymentMethod,
          items: cart.map(i => ({ productId: i.id, quantity: i.quantity }))
        })
      });
      localStorage.setItem("spex_last_order", JSON.stringify(data.order));
      localStorage.removeItem("spex_cart");
      window.dispatchEvent(new Event("spex-cart-updated"));
      navigate(`/invoice/${data.order.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!cart.length) return <Page><div className="empty"><h2>Add products before checkout.</h2><Link className="button" to="/">Shop</Link></div></Page>;

  return <Page>
    <h1>Checkout</h1>
    <div className="checkout-layout">
      <form className="card form" onSubmit={submit}>
        <h2>Customer Details</h2>
        {error && <div className="error">{error}</div>}
        <input required name="name" value={form.name} onChange={change} placeholder="Full name" />
        <input required name="mobile" value={form.mobile} onChange={change} placeholder="Mobile number" />
        <input type="email" name="email" value={form.email} onChange={change} placeholder="Email" />
        <textarea required name="address" value={form.address} onChange={change} placeholder="Delivery address" rows="4" />
        <label>Payment Method</label>
        <select name="paymentMethod" value={form.paymentMethod} onChange={change}>
          <option value="COD">Cash on Delivery</option>
          <option value="UPI">UPI</option>
          <option value="CARD">Card</option>
        </select>
        <button className="button full" disabled={busy}>{busy ? "Placing Order..." : "Place Order"}</button>
      </form>
      <Summary subtotal={subtotal} gst={gst} total={total} />
    </div>
  </Page>;
}

function Invoice() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api(`/orders/${id}`)
      .then(d => { setOrder(d.order); setItems(d.items || []); })
      .catch(e => setError(e.message));
  }, [id]);

  if (error) return <Page><div className="error">{error}</div></Page>;
  if (!order) return <Page><div className="card">Loading invoice...</div></Page>;

  return <Page>
    <div className="invoice card">
      <div className="invoice-head">
        <div><div className="brand">SPEX</div><p>Spectacles Online Store</p></div>
        <div><b>Invoice</b><br />{order.invoice_number}<br />{new Date(order.created_at).toLocaleString()}</div>
      </div>
      <hr />
      <h3>Customer</h3>
      <p>{order.customer_name}<br />{order.mobile}<br />{order.email}<br />{order.address}</p>
      <table>
        <thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Amount</th></tr></thead>
        <tbody>{items.map(i => <tr key={i.id}>
          <td>{i.name}</td><td>{i.quantity}</td><td>{money(i.price)}</td><td>{money(Number(i.price) * i.quantity)}</td>
        </tr>)}</tbody>
      </table>
      <div className="invoice-total">
        <p>Subtotal: {money(order.subtotal)}</p>
        <p>Discount: {money(order.discount)}</p>
        <p>GST: {money(order.gst)}</p>
        <h2>Total: {money(order.total)}</h2>
      </div>
      <p>Payment: {order.payment_method}</p>
      <button className="button print-hide" onClick={() => window.print()}>Print Bill</button>
    </div>
  </Page>;
}

function Page({ children }) {
  return <><Navbar /><main className="container">{children}</main></>;
}

export default function App() {
  return <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/product/:id" element={<ProductDetails />} />
    <Route path="/cart" element={<Cart />} />
    <Route path="/checkout" element={<Checkout />} />
    <Route path="/invoice/:id" element={<Invoice />} />
  </Routes>;
}