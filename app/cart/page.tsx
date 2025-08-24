"use client";

import { useEffect, useMemo, useRef, useState, useRef as useR } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CustomCursor from "@/components/CustomCursor";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

type CartItem = {
  product: string; 
  name: string;
  price: number;
  quantity: number;
  total: number;
  imageUrl?: string;
};

type CartResponse = {
  cartItems: CartItem[];
  total: number;
  cartCount: number;
};

export default function CartPage() {
  const { user, cartCount, setCartCount } = useAuth();

  const [items, setItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [displayTotal, setDisplayTotal] = useState<number>(0); // animated number
  const prevTotalRef = useRef(0);

  const [loading, setLoading] = useState<boolean>(true);
  const [loadingItems, setLoadingItems] = useState<Record<string, "increase" | "decrease" | "remove">>({});
  const [leavingItems, setLeavingItems] = useState<Record<string, boolean>>({});
  const [bumpKey, setBumpKey] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement>(null);

  // load fonts + Font Awesome like the old page
  useEffect(() => {
    const g = document.createElement("link");
    g.rel = "stylesheet";
    g.href =
      "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=Montserrat:wght@200;300;400;500&display=swap";
    const fa = document.createElement("link");
    fa.rel = "stylesheet";
    fa.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css";
    document.head.appendChild(g);
    document.head.appendChild(fa);
    return () => {
      document.head.contains(g) && document.head.removeChild(g);
      document.head.contains(fa) && document.head.removeChild(fa);
    };
  }, []);

  // enable animations & stagger for rows
  useEffect(() => {
    document.documentElement.classList.add("anim");
    const list = listRef.current;
    if (!list) return;
    Array.from(list.children).forEach((el, i) =>
      (el as HTMLElement).style.setProperty("--i", String(i))
    );
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        list.classList.add("revealed");
        io.disconnect();
      }
    }, { threshold: 0.2 });
    io.observe(list);
    return () => io.disconnect();
  }, [items.length]);

  // simple ripple (non-intrusive, no design change)
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      const target = (e.target as HTMLElement)?.closest(".btn, .quantity-btn, .remove-item");
      if (!target) return;
      const rect = (target as HTMLElement).getBoundingClientRect();
      const ripple = document.createElement("span");
      ripple.className = "ui-ripple";
      ripple.style.left = `${e.clientX - rect.left}px`;
      ripple.style.top = `${e.clientY - rect.top}px`;
      target.appendChild(ripple);
      ripple.addEventListener("animationend", () => ripple.remove());
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);

  // fetch cart ONLY if logged in (mirrors old behavior)
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const load = async () => {
      try {
        const data: CartResponse = await api.cart.get();
        setItems(data.cartItems || []);
        setTotal(data.total || 0);
        setCartCount(data.cartCount || 0);
        prevTotalRef.current = data.total || 0;
        setDisplayTotal(data.total || 0);
      } catch (e) {
        console.error("Failed to load cart:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, setCartCount]);

  // animate totals when `total` changes
  useEffect(() => {
    const from = prevTotalRef.current ?? 0;
    const to = total ?? 0;
    if (from === to) return;
    const dur = 500;
    let start = 0;
    const ease = (t: number) => 1 - Math.pow(1 - t, 3); // easeOutCubic
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min(1, (ts - start) / dur);
      setDisplayTotal(from + (to - from) * ease(p));
      if (p < 1) requestAnimationFrame(step);
      else prevTotalRef.current = to;
    };
    requestAnimationFrame(step);
  }, [total]);

  const isEmpty = useMemo(() => items.length === 0, [items]);

  const updateQuantity = async (productId: string, action: "increase" | "decrease") => {
    setLoadingItems((prev) => ({ ...prev, [productId]: action }));
    try {
      const data = await api.cart.updateItem({productId, action});
      setItems(data.cartItems || []);
      setTotal(data.total || 0);
      setCartCount(data.cartCount || 0);

      // qty bump
      setBumpKey(productId);
      setTimeout(() => setBumpKey(null), 350);
    } catch (err) {
      console.error("Failed to update quantity:", err);
    } finally {
      setLoadingItems((prev) => {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      });
    }
  };

  const removeItem = async (productId: string) => {
    setLoadingItems((prev) => ({ ...prev, [productId]: "remove" }));
    setLeavingItems((prev) => ({ ...prev, [productId]: true })); // animate out
    try {
      // let the leave animation play
      await new Promise((r) => setTimeout(r, 220));
      const data = await api.cart.removeItem({productId});
      setItems(data.cartItems || []);
      setTotal(data.total || 0);
      setCartCount(data.cartCount || 0);
    } catch (err) {
      console.error("Failed to remove item:", err);
      setLeavingItems((p) => {
        const c = { ...p };
        delete c[productId];
        return c;
      });
    } finally {
      setLoadingItems((prev) => {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      });
    }
  };

  const fmt = (n: number) =>
    `₦${(n ?? 0).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // ---------- RENDER STATES ----------

  if (!user) {
    return (
      <>
        <CustomCursor />
        <Header />
        <main className="cart-page">
          <div className="cart-container">
            <section className="cart-header-section">
              <h1 className="cart-title fade-in">Your Cart</h1>
              <div className="cart-breadcrumb fade-in delay-1">
                <a href="/">Home</a> <span>/</span> <span>Cart</span>
              </div>
            </section>

            <section className="empty-cart-section fade-in delay-1">
              <div className="empty-cart-content">
                <div className="empty-cart-icon">
                  <div className="cart-icon-wrapper">
                    <i className="fas fa-lock" aria-hidden="true"></i>
                  </div>
                </div>
                <h2>Please sign in</h2>
                <p>You need to be signed in to view your cart and make purchases.</p>
                <a href="/login" className="btn btn-primary">Sign In</a>
              </div>
            </section>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (loading) {
    return (
      <>
        <CustomCursor />
        <Header />
        <main className="cart-page">
          <div className="cart-container">
            <section className="cart-header-section">
              <h1 className="cart-title fade-in">Your Cart</h1>
              <div className="cart-breadcrumb fade-in delay-1">
                <a href="/">Home</a> <span>/</span> <span>Cart</span>
              </div>
            </section>

            <section className="empty-cart-section">
              <div className="empty-cart-content">
                <div className="empty-cart-icon">
                  <div className="cart-icon-wrapper">
                    <i className="fas fa-shopping-cart" aria-hidden="true"></i>
                  </div>
                </div>
                <h2>Loading your cart…</h2>
                <p>Please wait a moment.</p>
              </div>
            </section>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (isEmpty) {
    return (
      <>
        <CustomCursor />
        <Header />
        <main className="cart-page">
          <div className="cart-container">
            <section className="cart-header-section">
              <h1 className="cart-title fade-in">Your Cart</h1>
              <div className="cart-breadcrumb fade-in delay-1">
                <a href="/">Home</a> <span>/</span> <span>Cart</span>
              </div>
            </section>

            <section className="empty-cart-section fade-in delay-1">
              <div className="empty-cart-content">
                <div className="empty-cart-icon">
                  <div className="cart-icon-wrapper">
                    <i className="fas fa-shopping-cart" aria-hidden="true"></i>
                  </div>
                </div>
                <h2>Your cart is empty</h2>
                <p>Looks like you haven't added anything to your cart yet. Start shopping to fill it up!</p>
                <a href="/products" className="btn btn-primary">Continue Shopping</a>
              </div>
            </section>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // With items
  return (
    <>
      <CustomCursor />
      <Header />
      <main className="cart-page">
        <div className="cart-container">
          <section className="cart-header-section">
            <h1 className="cart-title fade-in">Your Cart ({cartCount} items)</h1>
            <div className="cart-breadcrumb fade-in delay-1">
              <a href="/">Home</a> <span>/</span> <span>Cart</span>
            </div>
          </section>

          <section className="cart-content-section fade-in delay-1">
            <div className="cart-items-container">
              <div className="cart-table-header">
                <span className="header-product">Product</span>
                <span className="header-price">Price</span>
                <span className="header-quantity">Quantity</span>
                <span className="header-total">Total</span>
                <span className="header-remove"></span>
              </div>

              <div className="cart-items-list" ref={listRef}>
                {items.map((item, i) => (
                  <div
                    className={`cart-item ${leavingItems[item.product] ? "leaving" : ""}`}
                    key={item.product}
                    data-row={item.product}
                    style={{ ["--i" as any]: i }}
                  >
                    <div className="cart-item-product">
                      {/* Optional image */}
                      {/* <div className="product-image">
                        <img
                          src={item.imageUrl || "/placeholder.svg"}
                          alt={item.name}
                          loading="lazy"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              `https://via.placeholder.com/300x300/e6e6e6/888888?text=${encodeURIComponent(item.name)}`;
                          }}
                        />
                      </div> */}
                      <div className="product-details">
                        <h3 className="product-name">{item.name}</h3>
                        <p className="product-price-mobile">{fmt(item.price)}</p>
                      </div>
                    </div>

                    <div className="cart-item-price">
                      <span className="price-label">Price:</span>
                      <span className="price-value">{fmt(item.price)}</span>
                    </div>

                    <div className="cart-item-quantity">
                      <span className="quantity-label">Quantity:</span>
                      <div className="quantity-controls">
                        <button
                          className={`quantity-btn decrement ${loadingItems[item.product] === "decrease" ? "loading" : ""}`}
                          onClick={() => updateQuantity(item.product, "decrease")}
                          disabled={item.quantity <= 1 || !!loadingItems[item.product]}
                          aria-label="Decrease quantity"
                        >
                          {loadingItems[item.product] === "decrease" ? <div className="spinner"></div> : <span>−</span>}
                        </button>
                        <span className={`quantity-display ${bumpKey === item.product ? "bump" : ""}`}>
                          {item.quantity}
                        </span>
                        <button
                          className={`quantity-btn increment ${loadingItems[item.product] === "increase" ? "loading" : ""}`}
                          onClick={() => updateQuantity(item.product, "increase")}
                          disabled={!!loadingItems[item.product]}
                          aria-label="Increase quantity"
                        >
                          {loadingItems[item.product] === "increase" ? <div className="spinner"></div> : <span>+</span>}
                        </button>
                      </div>
                    </div>

                    <div className="cart-item-total">
                      <span className="total-label">Total:</span>
                      <span className="total-value">{fmt(item.total)}</span>
                    </div>

                    <button
                      className="remove-item"
                      onClick={() => removeItem(item.product)}
                      disabled={!!loadingItems[item.product]}
                      aria-label="Remove item"
                    >
                      {loadingItems[item.product] === "remove" ? <div className="spinner"></div> : "×"}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="cart-summary-container">
              <div className="cart-summary">
                <h3 className="summary-title">Order Summary</h3>

                <div className="summary-row">
                  <span className="summary-label">Subtotal</span>
                  <span className="summary-value">{fmt(displayTotal)}</span>
                </div>

                <div className="summary-row">
                  <span className="summary-label">Shipping</span>
                  <span className="summary-value summary-note">Calculated at checkout</span>
                </div>

                <div className="summary-row">
                  <span className="summary-label">Tax</span>
                  <span className="summary-value summary-note">Calculated at checkout</span>
                </div>

                <div className="summary-divider"></div>

                <div className="summary-row summary-total">
                  <span className="summary-label">Estimated Total</span>
                  <span className="summary-value">{fmt(displayTotal)}</span>
                </div>

                <div className="cart-actions">
                  <a href="/products" className="btn btn-outline">Continue Shopping</a>
                  <a href="/order" className="btn btn-primary">Proceed to Checkout</a>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
