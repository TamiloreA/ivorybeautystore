"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminSidebar from "@/components/AdminSidebar";
import api from "@/lib/api";
import { asArray } from "@/lib/asArray";
import "@/app/styles/admin.css";

type Collection = {
  _id: string;
  name: string;
  description?: string;
};

function usePagination<T>(rows: T[], pageSize = 20) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const pageRows = useMemo(() => rows.slice((page - 1) * pageSize, page * pageSize), [rows, page, pageSize]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [totalPages, page]);
  return { page, setPage, totalPages, pageRows };
}

export default function CollectionsPage() {
  const [loading, setLoading] = useState(true);
  const [sidebar, setSidebar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [query, setQuery] = useState("");

  // modals
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm] = useState<{ name: string; description: string }>({ name: "", description: "" });
  const [current, setCurrent] = useState<Collection | null>(null);


  const filtered = useMemo(() => {
    const list = Array.isArray(collections) ? collections : asArray(collections);
    const q = query.toLowerCase();
    return list.filter(
      (c) =>
        (c.name || "").toLowerCase().includes(q) ||
        (c.description || "").toLowerCase().includes(q)
    );
  }, [collections, query]);
  const { page, setPage, totalPages, pageRows } = usePagination(filtered, 15);

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.admin.listCollections();
      const list: Collection[] = (res as any).data?.collections ?? (res as any).collections ?? res;
      setCollections(list);
      setError(null);
    } catch (err: any) {
      setError(err?.message || "Failed to load collections");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.admin.createCollection(form);
    setForm({ name: "", description: "" });
    setShowAdd(false);
    await load();
  };
  const update = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!current) return;
    await api.admin.updateCollection(current._id, form);
    setShowEdit(false);
    await load();
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this collection?")) return;
    await api.admin.deleteCollection(id);
    await load();
  };

  if (loading) return <div className="admin-container"><div className="admin-loading">Loading collections…</div></div>;
  if (error)   return <div className="admin-container"><div className="admin-error">{error}</div></div>;

  return (
    <div className="admin-container">
      <AdminSidebar isActive={sidebar} toggleSidebar={() => setSidebar((s) => !s)} />

      <main className={`main-content ${sidebar ? "sidebar-active" : ""}`}>
        <header className="admin-header">
          <div className="header-left">
            <button className="toggle-sidebar" onClick={() => setSidebar((s) => !s)}>☰</button>
            <h2>Collections</h2>
          </div>
          <div className="header-right">
            <div className="search-container">
              <input className="search-input" placeholder="Search collections…" value={query} onChange={(e) => setQuery(e.target.value)} />
              <button className="search-btn">🔍</button>
            </div>
            <Link href="/admin/dashboard" className="view-all-btn">Dashboard</Link>
          </div>
        </header>

        <div className="content-wrapper">
          <section className="admin-section">
            <div className="section-header">
              <h2>All Collections</h2>
              <button className="add-btn" onClick={() => setShowAdd(true)}>+ Add Collection</button>
            </div>

            <div className="collections-list">
              {pageRows.map((c) => (
                <div key={c._id} className="collection-card">
                  <div className="collection-header">
                    <h3>{c.name}</h3>
                    <div className="collection-actions">
                      <button
                        className="edit-collection-btn"
                        onClick={() => {
                          setCurrent(c);
                          setForm({ name: c.name, description: c.description || "" });
                          setShowEdit(true);
                        }}
                      >
                        Edit
                      </button>
                      <button className="delete-btn" onClick={() => remove(c._id)}>Delete</button>
                    </div>
                  </div>
                  <p className="collection-description">{c.description || "—"}</p>
                </div>
              ))}
            </div>

            {/* pagination */}
            {totalPages > 1 && (
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
                <button className="btn-outline" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>Prev</button>
                <div style={{ alignSelf: "center" }}>Page {page} / {totalPages}</div>
                <button className="btn-outline" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}>Next</button>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Add Modal */}
      {showAdd && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add Collection</h3>
              <button className="close-modal" onClick={() => setShowAdd(false)}>&times;</button>
            </div>
            <form onSubmit={create}>
              <div className="form-group">
                <label>Name</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowAdd(false)}>Cancel</button>
                <button type="submit" className="submit-btn">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEdit && current && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Edit Collection</h3>
              <button className="close-modal" onClick={() => setShowEdit(false)}>&times;</button>
            </div>
            <form onSubmit={update}>
              <div className="form-group">
                <label>Name</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowEdit(false)}>Cancel</button>
                <button type="submit" className="submit-btn">Update</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
