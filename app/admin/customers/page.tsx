"use client";

import { useEffect, useMemo, useState } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import api from "@/lib/api";
import "@/app/styles/admin.css";

type Customer = {
  _id: string;
  name?: string;
  email: string;
  address?: string;
  phone?: string;
  createdAt?: string;
};

function usePagination<T>(rows: T[], pageSize = 20) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const pageRows = useMemo(() => rows.slice((page - 1) * pageSize, page * pageSize), [rows, page, pageSize]);
  return { page, setPage, totalPages, pageRows };
}

export default function CustomersPage() {
  const [sidebar, setSidebar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.admin.listCustomers();
      const list: Customer[] = (res as any).data ?? res ?? [];
      setCustomers(Array.isArray(list) ? list : []);
      setError(null);
    } catch (err: any) {
      setCustomers([]);
      setError(err?.message || "Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const qlc = q.toLowerCase();
    return (customers || []).filter((c) => {
      const name = (c.name || "").toLowerCase();
      const email = (c.email || "").toLowerCase();
      const phone = (c.phone || "").toLowerCase();
      const address = (c.address || "").toLowerCase();
      return !qlc || name.includes(qlc) || email.includes(qlc) || phone.includes(qlc) || address.includes(qlc);
    });
  }, [customers, q]);

  const { page, setPage, totalPages, pageRows } = usePagination(filtered, 20);

  if (loading)
    return (
      <div className="admin-container">
        <div className="admin-loading">Loading customers…</div>
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
            <button className="toggle-sidebar" onClick={() => setSidebar((s) => !s)}>☰</button>
            <h2>Customers</h2>
          </div>
          <div className="header-right">
            <div className="search-container" style={{ width: 320 }}>
              <input
                className="search-input"
                placeholder="Search by name, email, phone…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <button className="search-btn">🔍</button>
            </div>
          </div>
        </header>

        <div className="content-wrapper">
          <section className="admin-section">
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Contact</th>
                    <th>Address</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((c) => (
                    <tr key={c._id}>
                      <td>{c.name || "—"}</td>
                      <td>
                        <div className="contact-info">
                          <div>{c.email || "—"}</div>
                          <div>{c.phone || "—"}</div>
                        </div>
                      </td>
                      <td>{c.address || "—"}</td>
                      <td>{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "—"}</td>
                    </tr>
                  ))}
                  {pageRows.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: "center" }}>No customers found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
                <button className="btn-outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Prev</button>
                <div style={{ alignSelf: "center" }}>Page {page} / {totalPages}</div>
                <button className="btn-outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</button>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}