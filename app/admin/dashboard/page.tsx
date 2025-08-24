"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import AdminSidebar from "@/components/AdminSidebar";
import "@/app/styles/admin.css";

/* ---------- Types ---------- */
type Collection = {
  _id: string;
  name: string;
  description?: string;
  productCount?: number;
};

type Product = {
  _id: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  collectionRef?: { _id: string; name: string };
  // for editing
  image?: File;
};

type OrderItem = { product?: { name?: string }; quantity: number };
type Order = {
  _id: string;
  user?: { name?: string; email?: string; phone?: string; address?: string };
  items: OrderItem[];
  total: number;
  formattedDate: string;
  status: string;
};

type DashboardData = {
  stats: { totalSales: number | string; totalOrders: number; totalCustomers: number; totalProducts: number };
  collections: Collection[];
  products: Product[];
  recentOrders: Order[];
};

/* ---------- Component ---------- */
export default function AdminDashboard() {
  const router = useRouter();

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarActive, setIsSidebarActive] = useState(false);

  // Modals
  const [showAddCollectionModal, setShowAddCollectionModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showEditCollectionModal, setShowEditCollectionModal] = useState(false);
  const [showEditProductModal, setShowEditProductModal] = useState(false);

  // Forms
  const [collectionForm, setCollectionForm] = useState<{ name: string; description: string }>({ name: "", description: "" });
  const [productForm, setProductForm] = useState<{
    name: string;
    description: string;
    price: string | number;
    quantity: string | number;
    collectionId: string;
    image: File | null;
  }>({
    name: "",
    description: "",
    price: "",
    quantity: "",
    collectionId: "",
    image: null,
  });

  const [currentCollection, setCurrentCollection] = useState<Collection | null>(null);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);

  const [productImagePreview, setProductImagePreview] = useState<string | null>(null);
  const [editProductImagePreview, setEditProductImagePreview] = useState<string | null>(null);

  /* ---------- Data Fetch ---------- */
  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.admin.getDashboardData();
      // accept {data:{data}} | {data} | raw
      const data: DashboardData = (res as any)?.data?.data ?? (res as any)?.data ?? (res as any);
      setDashboardData(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load dashboard data");
      // If your api helper attaches status, redirect on 401
      if (err?.status === 401) router.push("/admin/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- UI helpers ---------- */
  const toggleSidebar = () => setIsSidebarActive((s) => !s);

  const getProductStatus = (quantity: number | string) => {
    const qty = typeof quantity === "string" ? parseInt(quantity, 10) : quantity;
    if (qty > 10) return { class: "in-stock", label: "In Stock" };
    if (qty > 0) return { class: "low-stock", label: "Low Stock" };
    return { class: "out-of-stock", label: "Out of Stock" };
  };

  const getOrderStatus = (status: string) => {
    switch (status) {
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
        return { class: "processing", label: status };
    }
  };

  const ngn = useMemo(
    () => (n: number) =>
      `₦${(n ?? 0).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    []
  );

  /* ---------- Handlers: Collections ---------- */
  const handleCollectionInputChange: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement> = (e) => {
    const { name, value } = e.target;
    setCollectionForm((prev) => ({ ...prev, [name]: value }));
  };

  const openEditCollectionModal = (c: Collection) => {
    setCurrentCollection(c);
    setCollectionForm({ name: c.name, description: c.description ?? "" });
    setShowEditCollectionModal(true);
  };

  const handleCreateCollection: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    try {
      await api.admin.createCollection(collectionForm);
      await fetchDashboard();
      setCollectionForm({ name: "", description: "" });
      setShowAddCollectionModal(false);
    } catch (err: any) {
      alert(`Failed to create collection: ${err?.message || "Unknown error"}`);
    }
  };

  const handleUpdateCollection: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (!currentCollection) return;
    try {
      await api.admin.updateCollection(currentCollection._id, collectionForm);
      await fetchDashboard();
      setShowEditCollectionModal(false);
    } catch (err: any) {
      alert(`Failed to update collection: ${err?.message || "Unknown error"}`);
    }
  };

  const handleDeleteCollection = async (collectionId: string) => {
    if (!confirm("Are you sure you want to delete this collection?")) return;
    try {
      await api.admin.deleteCollection(collectionId);
      await fetchDashboard();
    } catch (err) {
      alert("Failed to delete collection");
    }
  };

  /* ---------- Handlers: Products ---------- */
  const handleProductInputChange: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> = (e) => {
    const { name, value } = e.target as HTMLInputElement;
    if (name === "price" || name === "quantity") {
      setProductForm((prev) => ({ ...prev, [name]: value === "" ? "" : Number(value) }));
    } else {
      setProductForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleProductImageChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0] ?? null;
    setProductForm((prev) => ({ ...prev, image: file }));
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProductImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setProductImagePreview(null);
    }
  };

  const openEditProductModal = (p: Product) => {
    setCurrentProduct({ ...p });
    setEditProductImagePreview(null);
    setShowEditProductModal(true);
  };

  const handleEditProductImageChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (!file || !currentProduct) return;
    setCurrentProduct({ ...currentProduct, image: file });
    const reader = new FileReader();
    reader.onloadend = () => setEditProductImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleCreateProduct: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price || !productForm.collectionId) {
      alert("Please fill all required fields: Name, Price, and Collection");
      return;
    }
    if (Number.isNaN(Number(productForm.price))) {
      alert("Please enter a valid price");
      return;
    }

    try {
      await api.admin.createProduct({
        name: productForm.name,
        description: productForm.description,
        price: Number(productForm.price),
        quantity: productForm.quantity === "" ? 0 : Number(productForm.quantity),
        collectionId: productForm.collectionId,
        image: productForm.image ?? undefined,
      });
      await fetchDashboard();
      setProductForm({ name: "", description: "", price: "", quantity: "", collectionId: "", image: null });
      setProductImagePreview(null);
      setShowAddProductModal(false);
    } catch (err: any) {
      alert(`Failed to create product: ${err?.message || "Unknown error"}`);
    }
  };

  const handleUpdateProduct: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (!currentProduct) return;
    try {
      await api.admin.updateProduct(currentProduct._id, {
        name: currentProduct.name,
        description: currentProduct.description ?? "",
        price: Number(currentProduct.price),
        quantity: Number(currentProduct.quantity),
        collectionId: currentProduct.collectionRef?._id ?? "",
        image: currentProduct.image, // optional File
      });
      await fetchDashboard();
      setShowEditProductModal(false);
    } catch (err: any) {
      alert(`Failed to update product: ${err?.message || "Unknown error"}`);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await api.admin.deleteProduct(productId);
      await fetchDashboard();
    } catch {
      alert("Failed to delete product");
    }
  };

  /* ---------- Export Orders ---------- */
  const handleExportOrders = async () => {
    try {
      const blob = await api.admin.exportOrders(); // should return Blob
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "orders_export.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed", err);
    }
  };

  /* ---------- Render ---------- */
  if (loading) {
    return (
      <div className="admin-container">
        <div className="admin-loading">Loading dashboard...</div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="admin-container">
        <div className="admin-error">{error || "Failed to load dashboard"}</div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <AdminSidebar isActive={isSidebarActive} toggleSidebar={toggleSidebar} />

      <main className={`main-content ${isSidebarActive ? "sidebar-active" : ""}`}>
        <header className="admin-header">
          <div className="header-left">
            <button className="toggle-sidebar" onClick={toggleSidebar} aria-label="Toggle sidebar">
              ☰
            </button>
            <h2>Dashboard</h2>
          </div>
          <div className="header-right">
            <div className="search-container">
              <input type="text" placeholder="Search..." className="search-input" />
              <button className="search-btn" aria-label="Search">
                🔍
              </button>
            </div>
            <div className="admin-profile">
              <span className="admin-name">Admin User</span>
              <div className="admin-avatar">A</div>
            </div>
          </div>
        </header>

        <div className="content-wrapper">
          {/* Dashboard Overview */}
          <section className="dashboard-overview">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">📊</div>
                <div className="stat-content">
                  <h3>Total Sales</h3>
                  <p className="stat-value">
                    {typeof dashboardData.stats.totalSales === "number"
                      ? ngn(Number(dashboardData.stats.totalSales))
                      : dashboardData.stats.totalSales}
                  </p>
                  <p className="stat-change positive">+15% from last month</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🛒</div>
                <div className="stat-content">
                  <h3>Orders</h3>
                  <p className="stat-value">{dashboardData.stats.totalOrders}</p>
                  <p className="stat-change positive">+8% from last month</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-content">
                  <h3>Customers</h3>
                  <p className="stat-value">{dashboardData.stats.totalCustomers}</p>
                  <p className="stat-change positive">+12% from last month</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🏷️</div>
                <div className="stat-content">
                  <h3>Products</h3>
                  <p className="stat-value">{dashboardData.stats.totalProducts}</p>
                  <p className="stat-change neutral">No change</p>
                </div>
              </div>
            </div>
          </section>

          {/* Collections */}
          <section className="admin-section" id="collections-section">
            <div className="section-header">
              <h2>Collections</h2>
              <button className="add-btn" onClick={() => setShowAddCollectionModal(true)}>
                + Manage Collections
              </button>
            </div>

            <div className="collections-list">
              {dashboardData.collections.slice(0, 3).map((c) => (
                <div className="collection-card" key={c._id}>
                  <div className="collection-header">
                    <h3>{c.name}</h3>
                    <div className="collection-actions">
                      <button className="edit-collection-btn" onClick={() => openEditCollectionModal(c)}>
                        Edit
                      </button>
                      <button className="delete-btn" onClick={() => handleDeleteCollection(c._id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className="collection-description">{c.description}</p>
                  <div className="collection-stats">
                    <span>{c.productCount ?? 0} Products</span>
                    <span>₦0 Sales</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Products */}
          <section className="admin-section" id="products-section">
            <div className="section-header">
              <h2>Products</h2>
              <button className="add-btn" onClick={() => setShowAddProductModal(true)}>
                + Manage Products
              </button>
            </div>

            <div className="table-container">
              <table className="products-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Collection</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.products.map((p) => {
                    const status = getProductStatus(p.quantity);
                    return (
                      <tr key={p._id}>
                        <td>
                          <div
                            className="product-thumbnail"
                            style={{
                              backgroundImage: p.imageUrl ? `url('${p.imageUrl}')` : "none",
                              backgroundSize: "cover",
                              backgroundPosition: "center",
                            }}
                          >
                            {!p.imageUrl && <div className="no-image">No Image</div>}
                          </div>
                        </td>
                        <td>{p.name}</td>
                        <td>{p.collectionRef?.name ?? "Uncategorized"}</td>
                        <td>{ngn(p.price)}</td>
                        <td>
                          <span className={`status ${status.class}`}>{status.label}</span>
                        </td>
                        <td>
                          <div className="table-actions">
                            <button className="edit-btn" onClick={() => openEditProductModal(p)}>
                              Edit
                            </button>
                            <button className="delete-btn" onClick={() => handleDeleteProduct(p._id)}>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Recent Orders */}
          <section className="admin-section" id="recent-orders">
            <div className="section-header">
              <h2>Recent Orders</h2>
              <div>
                <button className="view-all-btn" onClick={handleExportOrders}>
                  Export to Excel
                </button>
                <Link href="/admin/orders" className="view-all-btn">
                  View All Orders
                </Link>
              </div>
            </div>

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
                  {dashboardData.recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center" }}>
                        No recent orders
                      </td>
                    </tr>
                  ) : (
                    dashboardData.recentOrders.map((order) => {
                      const orderStatus = getOrderStatus(order.status);
                      return (
                        <tr key={order._id} data-order-id={order._id}>
                          <td>#{order._id.toString().slice(-6).toUpperCase()}</td>
                          <td>
                            <div className="customer-info">
                              <div className="customer-name">{order.user?.name || "Guest"}</div>
                              {order.user?.address && <div className="customer-address">{order.user.address}</div>}
                            </div>
                          </td>
                          <td>
                            {order.user ? (
                              <div className="contact-info">
                                <div>{order.user.email}</div>
                                <div>{order.user.phone}</div>
                              </div>
                            ) : (
                              "N/A"
                            )}
                          </td>
                          <td>{order.formattedDate}</td>
                          <td>
                            <div className="order-items">
                              {order.items.map((item, idx) => (
                                <div key={idx}>
                                  {item.product?.name || "Unknown Product"} × {item.quantity}
                                </div>
                              ))}
                            </div>
                          </td>
                          <td>{ngn(order.total)}</td>
                          <td>
                            <span className={`status ${orderStatus.class}`}>{orderStatus.label}</span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>

      {/* Add Collection Modal */}
      {showAddCollectionModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Add Collection">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add New Collection</h3>
              <button className="close-modal" onClick={() => setShowAddCollectionModal(false)} aria-label="Close">
                &times;
              </button>
            </div>
            <form onSubmit={handleCreateCollection}>
              <div className="form-group">
                <label htmlFor="collection-name">Collection Name</label>
                <input
                  id="collection-name"
                  name="name"
                  value={collectionForm.name}
                  onChange={handleCollectionInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="collection-description">Description</label>
                <textarea
                  id="collection-description"
                  name="description"
                  rows={3}
                  value={collectionForm.description}
                  onChange={handleCollectionInputChange}
                  required
                />
              </div>
              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowAddCollectionModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Create Collection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Collection Modal */}
      {showEditCollectionModal && currentCollection && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Edit Collection">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Edit Collection</h3>
              <button className="close-modal" onClick={() => setShowEditCollectionModal(false)} aria-label="Close">
                &times;
              </button>
            </div>
            <form onSubmit={handleUpdateCollection}>
              <div className="form-group">
                <label htmlFor="edit-collection-name">Collection Name</label>
                <input
                  id="edit-collection-name"
                  name="name"
                  value={collectionForm.name}
                  onChange={handleCollectionInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="edit-collection-description">Description</label>
                <textarea
                  id="edit-collection-description"
                  name="description"
                  rows={3}
                  value={collectionForm.description}
                  onChange={handleCollectionInputChange}
                  required
                />
              </div>
              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowEditCollectionModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Update Collection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddProductModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Add Product">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add New Product</h3>
              <button className="close-modal" onClick={() => setShowAddProductModal(false)} aria-label="Close">
                &times;
              </button>
            </div>
            <form onSubmit={handleCreateProduct}>
              <div className="form-group">
                <label htmlFor="product-name">Product Name</label>
                <input id="product-name" name="name" value={productForm.name} onChange={handleProductInputChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="product-description">Description</label>
                <textarea
                  id="product-description"
                  name="description"
                  rows={3}
                  value={productForm.description}
                  onChange={handleProductInputChange}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="product-price">Price (₦)</label>
                  <input
                    id="product-price"
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={productForm.price === "" ? "" : Number(productForm.price)}
                    onChange={handleProductInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="product-quantity">Quantity</label>
                  <input
                    id="product-quantity"
                    name="quantity"
                    type="number"
                    min="0"
                    value={productForm.quantity === "" ? "" : Number(productForm.quantity)}
                    onChange={handleProductInputChange}
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="product-collection">Collection</label>
                <select
                  id="product-collection"
                  name="collectionId"
                  value={productForm.collectionId}
                  onChange={handleProductInputChange}
                  required
                >
                  <option value="">Select a collection</option>
                  {dashboardData.collections.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="product-image">Product Image</label>
                <input id="product-image" name="image" type="file" accept="image/*" onChange={handleProductImageChange} />
                {productImagePreview && (
                  <div className="image-preview">
                    <img src={productImagePreview} alt="Preview" style={{ maxWidth: "100px" }} />
                  </div>
                )}
              </div>
              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowAddProductModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Create Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditProductModal && currentProduct && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Edit Product">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Edit Product</h3>
              <button className="close-modal" onClick={() => setShowEditProductModal(false)} aria-label="Close">
                &times;
              </button>
            </div>
            <form onSubmit={handleUpdateProduct}>
              <div className="form-group">
                <label htmlFor="edit-product-name">Product Name</label>
                <input
                  id="edit-product-name"
                  name="name"
                  value={currentProduct.name}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="edit-product-description">Description</label>
                <textarea
                  id="edit-product-description"
                  name="description"
                  rows={3}
                  value={currentProduct.description ?? ""}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, description: e.target.value })}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-product-price">Price (₦)</label>
                  <input
                    id="edit-product-price"
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={Number(currentProduct.price)}
                    onChange={(e) => setCurrentProduct({ ...currentProduct, price: Number(e.target.value) })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="edit-product-quantity">Quantity</label>
                  <input
                    id="edit-product-quantity"
                    name="quantity"
                    type="number"
                    min="0"
                    value={Number(currentProduct.quantity)}
                    onChange={(e) => setCurrentProduct({ ...currentProduct, quantity: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="edit-product-collection">Collection</label>
                <select
                  id="edit-product-collection"
                  name="collectionId"
                  value={currentProduct.collectionRef?._id ?? ""}
                  onChange={(e) =>
                    setCurrentProduct({
                      ...currentProduct,
                      collectionRef: {
                        _id: e.target.value,
                        name: dashboardData.collections.find((c) => c._id === e.target.value)?.name || "",
                      },
                    })
                  }
                  required
                >
                  <option value="">Select a collection</option>
                  {dashboardData.collections.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="edit-product-image">Product Image</label>
                <input id="edit-product-image" name="image" type="file" accept="image/*" onChange={handleEditProductImageChange} />
                {(editProductImagePreview || currentProduct.imageUrl) && (
                  <div className="image-preview">
                    <img src={editProductImagePreview || currentProduct.imageUrl!} alt="Preview" style={{ maxWidth: "100px" }} />
                  </div>
                )}
              </div>
              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowEditProductModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Update Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
