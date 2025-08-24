"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminSidebar from "@/components/AdminSidebar";
import api from "@/lib/api";
import "@/app/styles/admin.css";

type Product = {
  _id: string;
  name: string;
  description?: string;
  price: number | string;
  quantity: number | string;
  imageUrl?: string;
  collectionRef?: { _id: string; name: string };
};

type Collection = { _id: string; name: string };

function usePagination<T>(rows: T[], pageSize = 20) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const pageRows = useMemo(() => rows.slice((page - 1) * pageSize, page * pageSize), [rows, page, pageSize]);
  return { page, setPage, totalPages, pageRows };
}

const statusOf = (q: number) =>
  q > 10 ? { class: "in-stock", label: "In Stock" } : q > 0 ? { class: "low-stock", label: "Low Stock" } : { class: "out-of-stock", label: "Out of Stock" };

export default function ProductsPage() {
  const [sidebar, setSidebar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [query, setQuery] = useState("");

  // modals
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [current, setCurrent] = useState<Product | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [form, setForm] = useState<{
    name: string;
    description: string;
    price: string | number;
    quantity: string | number;
    collectionId: string;
    image?: File | null;
  }>({ name: "", description: "", price: "", quantity: "", collectionId: "", image: null });

  const filtered = useMemo(
    () =>
      products.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          (p.collectionRef?.name || "").toLowerCase().includes(query.toLowerCase())
      ),
    [products, query]
  );
  const { page, setPage, totalPages, pageRows } = usePagination(filtered, 15);

  function asArray(v: any): any[] {
    if (Array.isArray(v)) return v;
    if (Array.isArray(v?.data)) return v.data;
    if (Array.isArray(v?.products)) return v.products;
    if (Array.isArray(v?.data?.products)) return v.data.products;
    return [];
  }
  
  const load = async () => {
    try {
      setLoading(true);
      const [plist, clist] = await Promise.all([
        api.admin.listProducts(),
        api.admin.listCollections(),
      ]);
  
      // Make sure we always end up with arrays
      const prod = asArray(plist);
      const cols = asArray(clist);
  
      setProducts(prod);
      setCollections(cols);
      setError(null);
    } catch (err: any) {
      setError(err?.message || "Failed to load products");
      setProducts([]);     // keep UI stable
      setCollections([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      description: form.description,
      price: Number(form.price),
      quantity: Number(form.quantity || 0),
      collectionId: form.collectionId,
      image: form.image as any,
    };
    await api.admin.createProduct(payload);
    setShowAdd(false);
    setForm({ name: "", description: "", price: "", quantity: "", collectionId: "", image: null });
    setImagePreview(null);
    await load();
  };

  const onUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!current) return;
    const payload: any = {
      name: current.name,
      description: current.description,
      price: Number(current.price),
      quantity: Number(current.quantity),
      collectionId: current.collectionRef?._id || "",
    };
    if ((current as any).image instanceof File) payload.image = (current as any).image;
    await api.admin.updateProduct(current._id, payload);
    setShowEdit(false);
    setImagePreview(null);
    await load();
  };

  const onDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    await api.admin.deleteProduct(id);
    await load();
  };

  if (loading) return <div className="admin-container"><div className="admin-loading">Loading products…</div></div>;
  if (error)   return <div className="admin-container"><div className="admin-error">{error}</div></div>;

  return (
    <div className="admin-container">
      <AdminSidebar isActive={sidebar} toggleSidebar={() => setSidebar((s) => !s)} />
      <main className={`main-content ${sidebar ? "sidebar-active" : ""}`}>
        <header className="admin-header">
          <div className="header-left">
            <button className="toggle-sidebar" onClick={() => setSidebar((s) => !s)}>☰</button>
            <h2>Products</h2>
          </div>
          <div className="header-right">
            <div className="search-container">
              <input className="search-input" placeholder="Search products…" value={query} onChange={(e) => setQuery(e.target.value)} />
              <button className="search-btn">🔍</button>
            </div>
            <Link href="/admin/dashboard" className="view-all-btn">Dashboard</Link>
          </div>
        </header>

        <div className="content-wrapper">
          <section className="admin-section">
            <div className="section-header">
              <h2>All Products</h2>
              <button className="add-btn" onClick={() => setShowAdd(true)}>+ Add Product</button>
            </div>

            <div className="table-container">
              <table className="products-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Collection</th>
                    <th>Price</th>
                    <th>Qty</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((p) => {
                    const qty = Number(p.quantity || 0);
                    const s = statusOf(qty);
                    return (
                      <tr key={p._id}>
                        <td>
                          <div className="product-thumbnail" style={{ backgroundImage: p.imageUrl ? `url('${p.imageUrl}')` : "none", backgroundSize: "cover", backgroundPosition: "center" }}>
                            {!p.imageUrl && <div className="no-image">No Image</div>}
                          </div>
                        </td>
                        <td>{p.name}</td>
                        <td>{p.collectionRef?.name || "Uncategorized"}</td>
                        <td>₦{Number(p.price).toFixed(2)}</td>
                        <td>{qty}</td>
                        <td><span className={`status ${s.class}`}>{s.label}</span></td>
                        <td>
                          <div className="table-actions">
                            <button
                              className="edit-btn"
                              onClick={() => {
                                setCurrent(p);
                                setImagePreview(null);
                                setShowEdit(true);
                              }}
                            >
                              Edit
                            </button>
                            <button className="delete-btn" onClick={() => onDelete(p._id)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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

      {/* Add Product */}
      {showAdd && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add Product</h3>
              <button className="close-modal" onClick={() => setShowAdd(false)}>&times;</button>
            </div>
            <form onSubmit={onCreate}>
              <div className="form-group"><label>Name</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="form-group"><label>Description</label>
                <textarea rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} required />
              </div>
              <div className="form-row">
                <div className="form-group"><label>Price (₦)</label>
                  <input type="number" step="0.01" min="0" value={form.price as any} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} required />
                </div>
                <div className="form-group"><label>Quantity</label>
                  <input type="number" min="0" value={form.quantity as any} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} />
                </div>
              </div>
              <div className="form-group"><label>Collection</label>
                <select value={form.collectionId} onChange={(e) => setForm((f) => ({ ...f, collectionId: e.target.value }))} required>
                  <option value="">Select a collection</option>
                  {collections.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Image</label>
                <input type="file" accept="image/*" onChange={(e) => {
                  const file = e.target.files?.[0]; if (!file) return;
                  setForm((f) => ({ ...f, image: file }));
                  const r = new FileReader(); r.onloadend = () => setImagePreview(r.result as string); r.readAsDataURL(file);
                }} />
                {imagePreview && <div className="image-preview"><img src={imagePreview} alt="Preview" /></div>}
              </div>
              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowAdd(false)}>Cancel</button>
                <button type="submit" className="submit-btn">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product */}
      {showEdit && current && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Edit Product</h3>
              <button className="close-modal" onClick={() => setShowEdit(false)}>&times;</button>
            </div>
            <form onSubmit={onUpdate}>
              <div className="form-group"><label>Name</label>
                <input value={current.name} onChange={(e) => setCurrent({ ...current, name: e.target.value })} required />
              </div>
              <div className="form-group"><label>Description</label>
                <textarea rows={3} value={current.description || ""} onChange={(e) => setCurrent({ ...current, description: e.target.value })} required />
              </div>
              <div className="form-row">
                <div className="form-group"><label>Price (₦)</label>
                  <input type="number" step="0.01" min="0" value={Number(current.price)} onChange={(e) => setCurrent({ ...current, price: e.target.value }) as any} required />
                </div>
                <div className="form-group"><label>Quantity</label>
                  <input type="number" min="0" value={Number(current.quantity)} onChange={(e) => setCurrent({ ...current, quantity: e.target.value }) as any} />
                </div>
              </div>
              <div className="form-group"><label>Collection</label>
                <select
                  value={current.collectionRef?._id || ""}
                  onChange={(e) =>
                    setCurrent({
                      ...current,
                      collectionRef: { _id: e.target.value, name: collections.find((c) => c._id === e.target.value)?.name || "" },
                    })
                  }
                  required
                >
                  <option value="">Select a collection</option>
                  {collections.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]; if (!file) return;
                    setCurrent({ ...(current as any), image: file } as any);
                    const r = new FileReader(); r.onloadend = () => setImagePreview(r.result as string); r.readAsDataURL(file);
                  }}
                />
                {(imagePreview || current.imageUrl) && (
                  <div className="image-preview"><img src={imagePreview || (current.imageUrl as string)} alt="Preview" /></div>
                )}
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
