// app/order/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CustomCursor from "@/components/CustomCursor";
import ScrollReveal from "@/components/ScrollReveal";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import "../styles/order.css";

type CartLine = {
  product: { _id: string; name: string; price: number; imageUrl?: string };
  quantity: number;
  total: number;
};

type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: "NG" | "US" | "UK" | "CA";
  shippingMethod: "standard" | "express" | "overnight";
  deliveryInstructions: string;
};

export default function OrderPage() {
  const { user, isLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [shippingCost, setShippingCost] = useState(0);
  const [cartItems, setCartItems] = useState<CartLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: (user as any)?.email || "",
    phone: (user as any)?.phone || "",
    address: (user as any)?.address || "",
    city: "",
    state: "",
    zipCode: "",
    country: "NG",
    shippingMethod: "standard",
    deliveryInstructions: "",
  });

  useEffect(() => {
    const load = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const data = await api.user.getCheckout();
        setCartItems(data.cartItems || []);
      } catch (e: any) {
        console.error(e);
        setError(e?.message || "Network error loading cart");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  useEffect(() => {
    if (user) {
      setFormData((s) => ({
        ...s,
        email: (user as any)?.email || "",
        phone: (user as any)?.phone || "",
        address: (user as any)?.address || "",
      }));
    }
  }, [user]);

  // Totals (mirror your old calc)
  const subtotal = useMemo(
    () => cartItems.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
    [cartItems]
  );
  const tax = useMemo(() => subtotal * 0.075, [subtotal]); // 7.5% (UX preview)
  const total = useMemo(() => subtotal + shippingCost + tax, [subtotal, shippingCost, tax]);

  useEffect(() => {
    switch (formData.shippingMethod) {
      case "express":
        setShippingCost(9.99);
        break;
      case "overnight":
        setShippingCost(24.99);
        break;
      default:
        setShippingCost(0);
    }
  }, [formData.shippingMethod]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((s) => ({ ...s, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const payload = {
        shippingInfo: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country,
          shippingMethod: formData.shippingMethod,
          deliveryInstructions: formData.deliveryInstructions,
        },
        shippingCost,
        tax,
        total,
      };

      const resp = await api.user.initiatePayment(payload);
      if (resp.success && resp.authorization_url) {
        window.location.assign(resp.authorization_url);
      } else {
        throw new Error(resp.message || "Invalid response from server");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to initiate payment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="order-page">
        <CustomCursor />
        <Header />
        <main className="order-main">
          <div className="loading-spinner"></div>
          <p>Loading your order...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="order-page">
        <CustomCursor />
        <Header />
        <main className="order-main">
          <div className="auth-required">
            <h2>Authentication Required</h2>
            <p>Please sign in to complete your order</p>
            <a href="/login" className="btn">Sign In</a>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (cartItems.length === 0 && !error) {
    return (
      <div className="order-page">
        <CustomCursor />
        <Header />
        <main className="order-main">
          <div className="empty-cart">
            <h2>Your cart is empty</h2>
            <p>Add items to your cart before proceeding to checkout</p>
            <a href="/products" className="btn">Browse Products</a>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="order-page">
      <CustomCursor />
      <Header />

      <main className="order-main">
        <div className="order-container">
          {error && (
            <div className="debug-error">
              <h3>Payment Error</h3>
              <p>{error}</p>
              <button onClick={() => setError("")}>Dismiss</button>
            </div>
          )}

          {/* Progress Indicator */}
          <ScrollReveal className="progress-indicator">
            <div className={`progress-step ${currentStep >= 1 ? "active" : ""}`}>
              <div className="step-number">1</div>
              <span className="step-label">Information</span>
            </div>
            <div className="progress-line"></div>
            <div className={`progress-step ${currentStep >= 2 ? "active" : ""}`}>
              <div className="step-number">2</div>
              <span className="step-label">Payment</span>
            </div>
            <div className="progress-line"></div>
            <div className={`progress-step ${currentStep >= 3 ? "active" : ""}`}>
              <div className="step-number">3</div>
              <span className="step-label">Confirmation</span>
            </div>
          </ScrollReveal>

          {error && (
            <div className="error-alert">
              <p>{error}</p>
              <button onClick={() => setError("")}>Dismiss</button>
            </div>
          )}

          <div className="order-content">
            {/* Left */}
            <div className="order-form-section">
              <ScrollReveal className="section-header">
                <h1>Complete Your Order</h1>
                <p>Just a few more steps to get your beauty essentials</p>
              </ScrollReveal>

              <form className="order-form" onSubmit={handleSubmit}>
                {/* Customer */}
                <ScrollReveal className="form-section" delay={100}>
                  <h2 className="form-section-title">
                    <i className="fas fa-user section-icon" />
                    Customer Information
                  </h2>
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="firstName">First Name*</label>
                      <input id="firstName" name="firstName" value={formData.firstName} onChange={handleInputChange} required disabled={isSubmitting}/>
                    </div>
                    <div className="form-group">
                      <label htmlFor="lastName">Last Name*</label>
                      <input id="lastName" name="lastName" value={formData.lastName} onChange={handleInputChange} required disabled={isSubmitting}/>
                    </div>
                    <div className="form-group full-width">
                      <label htmlFor="email">Email Address*</label>
                      <input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} required disabled={isSubmitting}/>
                    </div>
                    <div className="form-group">
                      <label htmlFor="phone">Phone Number*</label>
                      <input id="phone" name="phone" value={formData.phone} onChange={handleInputChange} required disabled={isSubmitting}/>
                    </div>
                  </div>
                </ScrollReveal>

                {/* Shipping */}
                <ScrollReveal className="form-section" delay={200}>
                  <h2 className="form-section-title">
                    <i className="fas fa-truck section-icon" />
                    Shipping Information
                  </h2>
                  <div className="form-grid">
                    <div className="form-group full-width">
                      <label htmlFor="address">Street Address*</label>
                      <input id="address" name="address" value={formData.address} onChange={handleInputChange} required disabled={isSubmitting}/>
                    </div>
                    <div className="form-group">
                      <label htmlFor="city">City*</label>
                      <input id="city" name="city" value={formData.city} onChange={handleInputChange} required disabled={isSubmitting}/>
                    </div>
                    <div className="form-group">
                      <label htmlFor="state">State*</label>
                      <input id="state" name="state" value={formData.state} onChange={handleInputChange} required disabled={isSubmitting}/>
                    </div>
                    <div className="form-group">
                      <label htmlFor="zipCode">ZIP Code*</label>
                      <input id="zipCode" name="zipCode" value={formData.zipCode} onChange={handleInputChange} required disabled={isSubmitting}/>
                    </div>
                    <div className="form-group">
                      <label htmlFor="country">Country*</label>
                      <select id="country" name="country" value={formData.country} onChange={handleInputChange} required disabled={isSubmitting}>
                        <option value="NG">Nigeria</option>
                        <option value="US">United States</option>
                        <option value="UK">United Kingdom</option>
                        <option value="CA">Canada</option>
                      </select>
                    </div>
                  </div>
                </ScrollReveal>

                {/* Shipping Method */}
                <ScrollReveal className="form-section" delay={300}>
                  <h2 className="form-section-title">
                    <i className="fas fa-box section-icon" />
                    Shipping Method
                  </h2>
                  <div className="shipping-options">
                    <div className="shipping-option">
                      <input type="radio" id="standard" name="shippingMethod" value="standard" checked={formData.shippingMethod === "standard"} onChange={handleInputChange} disabled={isSubmitting}/>
                      <label htmlFor="standard" className="shipping-label">
                        <div className="shipping-info">
                          <span className="shipping-name">Standard Shipping</span>
                          <span className="shipping-time">5-7 business days</span>
                        </div>
                        <span className="shipping-price">Free</span>
                      </label>
                    </div>
                    <div className="shipping-option">
                      <input type="radio" id="express" name="shippingMethod" value="express" checked={formData.shippingMethod === "express"} onChange={handleInputChange} disabled={isSubmitting}/>
                      <label htmlFor="express" className="shipping-label">
                        <div className="shipping-info">
                          <span className="shipping-name">Express Shipping</span>
                          <span className="shipping-time">2-3 business days</span>
                        </div>
                        <span className="shipping-price">₦9.99</span>
                      </label>
                    </div>
                    <div className="shipping-option">
                      <input type="radio" id="overnight" name="shippingMethod" value="overnight" checked={formData.shippingMethod === "overnight"} onChange={handleInputChange} disabled={isSubmitting}/>
                      <label htmlFor="overnight" className="shipping-label">
                        <div className="shipping-info">
                          <span className="shipping-name">Overnight Shipping</span>
                          <span className="shipping-time">Next business day</span>
                        </div>
                        <span className="shipping-price">₦24.99</span>
                      </label>
                    </div>
                  </div>
                </ScrollReveal>

                {/* Notes */}
                <ScrollReveal className="form-section" delay={500}>
                  <h2 className="form-section-title">
                    <i className="fas fa-edit section-icon" />
                    Special Instructions (Optional)
                  </h2>
                  <div className="form-group">
                    <label htmlFor="deliveryInstructions">Delivery Instructions</label>
                    <textarea id="deliveryInstructions" name="deliveryInstructions" rows={3} placeholder="Any special delivery instructions..." value={formData.deliveryInstructions} onChange={handleInputChange} disabled={isSubmitting}/>
                  </div>
                </ScrollReveal>

                <div className="payment-info">
                  <h2 className="form-section-title">
                    <i className="fas fa-credit-card section-icon" />
                    Payment Method
                  </h2>
                  <p>You'll be redirected to Paystack to complete your payment securely</p>
                  <div className="paystack-logo">
                    <img src="https://via.placeholder.com/200x60/00C3F7/FFFFFF?text=Paystack" alt="Paystack" />
                  </div>
                </div>

                <button type="submit" className="place-order-btn" disabled={isSubmitting}>
                  {isSubmitting ? "Redirecting to Paystack..." : "Proceed to Paystack Payment"}
                </button>
              </form>
            </div>

            {/* Right */}
            <div className="order-summary-section">
              <ScrollReveal className="order-summary" delay={200}>
                <h2 className="summary-title">Order Summary</h2>

                <div className="order-items">
                  {cartItems.map((item) => (
                    <div key={item.product._id} className="order-item">
                      <div className="item-image">
                        <img
                          src={item.product.imageUrl || "/placeholder.svg"}
                          alt={item.product.name}
                          onError={(e: any) => {
                            e.currentTarget.src = `https://via.placeholder.com/60x60/f8f8f8/333333?text=${encodeURIComponent(
                              item.product.name.split(" ")[0]
                            )}`;
                          }}
                        />
                      </div>
                      <div className="item-details">
                        <h3 className="item-name">{item.product.name}</h3>
                        <div className="item-quantity">Qty: {item.quantity}</div>
                      </div>
                      <div className="item-price">₦{(item.product.price * item.quantity).toFixed(2)}</div>
                    </div>
                  ))}
                </div>

                <div className="order-totals">
                  <div className="total-line">
                    <span>Subtotal</span>
                    <span>₦{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="total-line">
                    <span>Shipping</span>
                    <span className="shipping-cost">
                      {shippingCost === 0 ? "Free" : `₦${shippingCost.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="total-line">
                    <span>Tax</span>
                    <span>₦{tax.toFixed(2)}</span>
                  </div>
                  <div className="total-line total-final">
                    <span>Total</span>
                    <span>₦{total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="promo-code">
                  <input
                    type="text"
                    placeholder="Enter promo code"
                    className="promo-input"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    disabled={isSubmitting}
                  />
                  <button type="button" className="promo-btn" disabled={isSubmitting}>
                    Apply
                  </button>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </main>

      {/* <Footer /> */}
    </div>
  );
}
