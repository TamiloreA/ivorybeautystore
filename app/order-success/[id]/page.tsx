"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import "@/app/styles/orderSuccess.css";

type OrderDetails = {
  _id: string;
  createdAt: string;
  status: string;
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
};

export default function OrderSuccessPage() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.user.getOrderDetails(id); 
        setOrder(data);
      } catch (e: any) {
        setError(e?.message || "Error loading order details");
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  if (loading) {
    return (
      <div className="order-success">
        <main>
          <div className="loading-spinner"></div>
          <p>Loading order details...</p>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="order-success">
        <main>
          <div className="error-message">
            <h2>Error</h2>
            <p>{error}</p>
            <a href="/">Return to Home</a>
          </div>
        </main>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="order-success">
        <main>
          <div className="not-found">
            <h2>Order Not Found</h2>
            <p>We couldn't find your order details</p>
            <a href="/">Return to Home</a>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="order-success">
      <main>
        <div className="success-container">
          <div className="success-icon">✓</div>
          <h1>Order Confirmed!</h1>
          <p>Thank you for your purchase</p>

          <div className="order-details">
            <div className="detail">
              <span>Order Number:</span>
              <strong>#{order._id.slice(-8).toUpperCase()}</strong>
            </div>
            <div className="detail">
              <span>Date:</span>
              <strong>{new Date(order.createdAt).toLocaleDateString()}</strong>
            </div>
            <div className="detail">
              <span>Total:</span>
              <strong>₦{order.total.toFixed(2)}</strong>
            </div>
            <div className="detail">
              <span>Status:</span>
              <strong className="status">{order.status}</strong>
            </div>
          </div>

          <div className="order-summary">
            <h2>Order Summary</h2>
            <div className="summary-row">
              <span>Subtotal:</span>
              <span>₦{order.subtotal.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Shipping:</span>
              <span>₦{order.shippingCost.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Tax:</span>
              <span>₦{order.tax.toFixed(2)}</span>
            </div>
            <div className="summary-row total">
              <span>Total:</span>
              <span>₦{order.total.toFixed(2)}</span>
            </div>
          </div>

          <div className="actions">
            <button onClick={() => window.print()} className="print-btn">
              Print Invoice
            </button>
            <a href="/products" className="shop-btn">
              Continue Shopping
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
