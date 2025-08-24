"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminSidebar from "@/components/AdminSidebar";
import api from "@/lib/api";
import "@/app/styles/admin.css";

type OrderItem = {
  _id: string;
  quantity: number;
  product?: { name?: string };
  name?: string;
  formattedPrice?: string;
  formattedTotal?: string;
};

type Order = {
  _id: string;
  createdAt: string;
  status: string;
  total: number;
  formattedDate?: string;
  formattedTotal?: string;
  user?: { name?: string; email?: string; phone?: string; address?: string };
  shippingInfo?: any;
  items: OrderItem[];
};

function usePagination<T>(rows: T[], pageSize = 20) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const pageRows = useMemo(
    () => rows.slice((page - 1) * pageSize, page * pageSize),
    [rows, page, pageSize]
  );
  return { page, setPage, totalPages, pageRows };
}

const labelOf = (s: string) => {
  switch (s) {
    case "delivered":
      return { class: "completed", label: "Delivered" };
    case "processing":
      return { class: "processing", label: "Processing" };
    case "shipped":
      return { class: "shipped", label: "Shipped" };
    case "cancelled":
      return { class: "cancelled", label: "Cancelled" };
    case "pending-payment":
      return { class: "pending", label: "Pending Payment" };
    case "failed":
      return { class: "failed", label: "Failed" };
    default:
      return { class: "processing", label: s };
  }
};

export default function OrdersPage() {
  const [sidebar, setSidebar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("");

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.admin.listOrders();
      const list: Order[] = (res as any).data ?? res ?? [];
      setOrders(Array.isArray(list) ? list : []);
      setError(null);
    } catch (err: any) {
      setOrders([]);
      setError(err?.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const qlc = q.toLowerCase();
    return (orders || []).filter((o) => {
      const matchQ =
        !qlc ||
        o._id.toLowerCase().includes(qlc) ||
        (o.user?.name || "guest").toLowerCase().includes(qlc) ||
        (o.items || []).some((it) =>
          (it.product?.name || it.name || "").toLowerCase().includes(qlc)
        );
      const matchStatus = !status || o.status === status;
      return matchQ && matchStatus;
    });
  }, [orders, q, status]);

  const { page, setPage, totalPages, pageRows } = usePagination(filtered, 20);

  const updateStatus = async (orderId: string, next: string) => {
    const prev = orders;
    // optimistic
    setOrders((list) =>
      list.map((o) => (o._id === orderId ? { ...o, status: next } : o))
    );
    try {
      const r = await api.admin.updateOrderStatus(orderId, next);
      const updated = (r as any).data ?? r;
      if (updated?._id) {
        setOrders((list) => list.map((o) => (o._id === orderId ? { ...o, ...updated } : o)));
      }
    } catch (e: any) {
      // revert on error
      setOrders(prev);
      alert(e?.message || "Failed to update order status");
    }
  };

  if (loading)
    return (
      <div className="admin-container">
        <div className="admin-loading">Loading orders…</div>
      </div>
    );
  if (error)
    return (
      <div className="admin-container">
        <div className="admin-error">{error}</div>
      </div>
    );

  return (
    <div className="admin-container">
      <AdminSidebar isActive={sidebar} toggleSidebar={() => setSidebar((s) => !s)} />
      <main className={`main-content ${sidebar ? "sidebar-active" : ""}`}>
        <header className="admin-header">
          <div className="header-left">
            <button className="toggle-sidebar" onClick={() => setSidebar((s) => !s)}>
              ☰
            </button>
            <h2>Orders</h2>
          </div>
          <div className="header-right">
            <div className="search-container" style={{ width: 320 }}>
              <input
                className="search-input"
                placeholder="Search by id, customer, product…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <button className="search-btn">🔍</button>
            </div>
            <select
              className="btn-outline"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{ padding: "0.6rem 1rem" }}
            >
              <option value="">All Statuses</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="pending-payment">Pending Payment</option>
              <option value="cancelled">Cancelled</option>
              <option value="failed">Failed</option>
            </select>
            <button
              className="view-all-btn"
              onClick={async () => {
                try {
                  const blob = await api.admin.exportOrders();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "orders_export.xlsx";
                  a.click();
                  URL.revokeObjectURL(url);
                } catch (err) {
                  console.error(err);
                }
              }}
            >
              Export to Excel
            </button>
            <Link href="/admin/dashboard" className="view-all-btn">
              Dashboard
            </Link>
          </div>
        </header>

        <div className="content-wrapper">
          <section className="admin-section">
            <div className="table-container">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Contact</th>
                    <th>Date</th>
                    <th>Items</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((o) => {
                    const t = labelOf(o.status);
                    return (
                      <tr key={o._id}>
                        <td>#{o._id.slice(-6).toUpperCase()}</td>
                        <td>{o.user?.name || "Guest"}</td>
                        <td>
                          <div className="contact-info">
                            <div>{o.user?.email || o.shippingInfo?.email || "—"}</div>
                            <div>{o.user?.phone || o.shippingInfo?.phone || "—"}</div>
                          </div>
                        </td>
                        <td>{o.formattedDate || new Date(o.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div className="order-items">
                            {(o.items || []).map((it) => (
                              <div key={it._id}>
                                {(it.product?.name || it.name || "Unknown Product")} × {it.quantity}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td>{o.formattedTotal || `₦${Number(o.total).toFixed(2)}`}</td>
                        <td>
                          {/* Inline status control with pill feel */}
                          <select
                            value={o.status}
                            onChange={(e) => updateStatus(o._id, e.target.value)}
                            className={`status ${t.class}`}
                            style={{
                              borderRadius: 20,
                              padding: "0.3rem 0.6rem",
                              border: "1px solid transparent",
                              background: "transparent",
                              cursor: "pointer",
                            }}
                          >
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="pending-payment">Pending Payment</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="failed">Failed</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
                <button className="btn-outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                  Prev
                </button>
                <div style={{ alignSelf: "center" }}>
                  Page {page} / {totalPages}
                </div>
                <button
                  className="btn-outline"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
