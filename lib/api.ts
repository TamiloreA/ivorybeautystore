// lib/api.ts
const BASE = process.env.NEXT_PUBLIC_API_BASE || "";

function apiUrl(path: string) {
  if (path.startsWith("/api/")) return `${BASE}${path}`;
  return `${BASE}/api${path}`;
}

// ---- tokens ----
function getUserToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("userToken") || localStorage.getItem("token") || null;
}
function getAdminToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("adminToken");
}

function withAuth(init: RequestInit = {}): RequestInit {
  const headers = new Headers(init.headers as any);
  const token = getAdminToken() || getUserToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return { ...init, headers };
}

async function parseOrThrow<T = any>(res: Response, fallbackMsg: string): Promise<T> {
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    // ignore (e.g. 204)
  }
  if (!res.ok) {
    const msg = (data && (data.message || data.error)) || fallbackMsg;
    throw new Error(msg);
  }
  return data as T;
}

// unwrap {success,data} or return raw
function unwrap<T = any>(json: any): T {
  return (json && (json.data ?? json)) as T;
}

/* ========= Types ========= */
export type LandingResponse = {
  success: boolean;
  data: { cartCount?: number; products?: any[]; collections?: any[] };
  message?: string;
};
export type ProductDoc = {
  _id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  collectionRef?: { _id: string; name: string };
};
export type CartResponse = {
  cartItems: Array<{
    name: string;
    price: number;
    quantity: number;
    total: number;
    product: string;
    imageUrl?: string;
  }>;
  total: number;
  cartCount: number;
  success?: boolean;
};

/* ========= FormData helper ========= */
function toFormData(payload: Record<string, any>): FormData {
  const fd = new FormData();
  Object.entries(payload).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (v instanceof Blob || v instanceof File) {
      fd.append(k, v);
    } else if (typeof v === "object") {
      fd.append(k, JSON.stringify(v));
    } else {
      fd.append(k, String(v));
    }
  });
  return fd;
}

const api = {
  // ============== PUBLIC/USER AREA ==============
  user: {
    async me(): Promise<any> {
      const res = await fetch(apiUrl("/users/me"), {
        cache: "no-store",
        credentials: "include",
        ...withAuth(),
      });
      if (!res.ok) throw new Error("Failed to fetch profile");
      const j = await res.json();
      return j?.data?.user ?? j?.data ?? j?.user ?? j;
    },

    async getLandingData(): Promise<LandingResponse> {
      const res = await fetch(apiUrl("/landing"), {
        cache: "no-store",
        credentials: "include",
        ...withAuth(),
      });
      return parseOrThrow(res, "Failed to load landing data");
    },

    async login(payload: { email: string; password: string }) {
      const res = await fetch(apiUrl("/users/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseOrThrow(res, "Login failed");
    },

    async signup(payload: {
      name: string;
      email: string;
      password: string;
      confirmPassword: string;
      address: string;
      phone: string;
    }) {
      const res = await fetch(apiUrl("/users/signup"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseOrThrow(res, "Signup failed");
    },

    async logout() {
      try {
        await fetch(apiUrl("/users/logout"), { method: "POST", ...withAuth() });
      } catch {}
      return { success: true };
    },

    async addToCart(payload: { productId: string; quantity: number }) {
      const res = await fetch(apiUrl("/cart/add"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        ...withAuth(),
        body: JSON.stringify(payload),
      });
      return parseOrThrow(res, "Add to cart failed") as Promise<{
        success?: boolean;
        cartCount: number;
        cartItems?: CartResponse["cartItems"];
        total?: number;
      }>;
    },

    async getProductDetails(id: string): Promise<ProductDoc> {
      const res = await fetch(apiUrl(`/products/${id}`), {
        cache: "no-store",
        credentials: "include",
        ...withAuth(),
      });
      return parseOrThrow(res, "Failed to load product");
    },

    async getCollectionProducts(collectionId: string): Promise<ProductDoc[]> {
      const res = await fetch(apiUrl(`/collections/${collectionId}/products`), {
        cache: "no-store",
        credentials: "include",
        ...withAuth(),
      });
      return parseOrThrow(res, "Failed to load collection products");
    },

    async getCheckout(): Promise<{
      cartItems: { product: { _id: string; name: string; price: number; imageUrl?: string }; quantity: number; total: number }[];
      subtotal: number;
      shippingOptions: { method: "standard" | "express" | "overnight"; cost: number; label: string }[];
    }> {
      const res = await fetch(apiUrl("/checkout"), {
        cache: "no-store",
        credentials: "include",
        ...withAuth(),
      });
      const json = await parseOrThrow(res, "Failed to load checkout");
      return unwrap(json);
    },

    async initiatePayment(payload: {
      shippingInfo: any;
      shippingCost: number;
      tax: number;
      total: number;
    }): Promise<{ success: boolean; authorization_url?: string; message?: string }> {
      const res = await fetch(apiUrl("/payments/initiate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        ...withAuth(),
        body: JSON.stringify(payload),
      });
      return parseOrThrow(res, "Failed to initiate payment");
    },

    async getOrderDetails(id: string): Promise<{
      _id: string;
      createdAt: string;
      status: string;
      items: any[];
      shippingInfo: any;
      paymentInfo: any;
      subtotal: number;
      tax: number;
      shippingCost: number;
      total: number;
    }> {
      const res = await fetch(apiUrl(`/orders/${id}`), {
        cache: "no-store",
        credentials: "include",
        ...withAuth(),
      });
      const json = await parseOrThrow(res, "Failed to load order");
      return unwrap(json);
    },
  },

  cart: {
    async get(): Promise<CartResponse> {
      const res = await fetch(apiUrl("/cart"), {
        cache: "no-store",
        credentials: "include",
        ...withAuth(),
      });
      return parseOrThrow(res, "Failed to load cart");
    },

    async updateItem(payload: { productId: string; action: "increase" | "decrease" }): Promise<CartResponse> {
      const res = await fetch(apiUrl("/cart/update"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        ...withAuth(),
        body: JSON.stringify(payload),
      });
      return parseOrThrow(res, "Failed to update item");
    },

    async removeItem(payload: { productId: string }): Promise<CartResponse> {
      const res = await fetch(apiUrl("/cart/remove"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        ...withAuth(),
        body: JSON.stringify(payload),
      });
      return parseOrThrow(res, "Failed to remove item");
    },

    // legacy aliases
    async update(productId: string, action: "increase" | "decrease"): Promise<CartResponse> {
      const res = await fetch(apiUrl("/cart/update"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        ...withAuth(),
        body: JSON.stringify({ productId, action }),
      });
      return parseOrThrow(res, "Failed to update item");
    },

    async remove(productId: string): Promise<CartResponse> {
      const res = await fetch(apiUrl("/cart/remove"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        ...withAuth(),
        body: JSON.stringify({ productId }),
      });
      return parseOrThrow(res, "Failed to remove item");
    },
  },

  // ============== ADMIN AREA ==============
  admin: {
    async login(payload: { email: string; password: string }): Promise<{ token?: string; admin?: any; user?: any }> {
      const res = await fetch(apiUrl("/admin/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseOrThrow(res, "Admin login failed");
    },

    async signup(payload: { name: string; email: string; password: string; adminCode: string }): Promise<{ token?: string; admin?: any }> {
      const res = await fetch(apiUrl("/admin/signup"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseOrThrow(res, "Admin signup failed");
    },

    async me(): Promise<any> {
      const res = await fetch(apiUrl("/admin/me"), {
        cache: "no-store",
        credentials: "include",
        ...withAuth(),
      });
      const json = await parseOrThrow(res, "Failed to load admin profile");
      return unwrap(json);
    },

    async logout() {
      try {
        await fetch(apiUrl("/admin/logout"), { method: "POST", ...withAuth() });
      } catch {}
      return { success: true };
    },

    // ----- Dashboard data -----
    async getDashboardData(): Promise<any> {
      const res = await fetch(apiUrl("/admin/dashboard"), {
        cache: "no-store",
        credentials: "include",
        ...withAuth(),
      });
      const json = await parseOrThrow(res, "Failed to load dashboard data");
      return unwrap(json);
    },

    // ----- Collections -----
    async listCollections() {
      const res = await fetch(apiUrl("/admin/collections"), {
        cache: "no-store",
        credentials: "include",
        ...withAuth(),
      });
      return parseOrThrow(res, "Failed to load collections");
    },

    async createCollection(payload: { name: string; description: string }) {
      const res = await fetch(apiUrl("/admin/collections"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        ...withAuth(),
        body: JSON.stringify(payload),
      });
      return parseOrThrow(res, "Failed to create collection");
    },

    async updateCollection(id: string, payload: { name: string; description: string }) {
      const res = await fetch(apiUrl(`/admin/collections/${id}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        ...withAuth(),
        body: JSON.stringify(payload),
      });
      return parseOrThrow(res, "Failed to update collection");
    },

    async deleteCollection(id: string) {
      const res = await fetch(apiUrl(`/admin/collections/${id}`), {
        method: "DELETE",
        credentials: "include",
        ...withAuth(),
      });
      return parseOrThrow(res, "Failed to delete collection");
    },

    // ----- Products (multipart for optional image) -----
    async listProducts() {
      const res = await fetch(apiUrl("/admin/products"), {
        cache: "no-store",
        credentials: "include",
        ...withAuth(),
      });
      return parseOrThrow(res, "Failed to load products");
    },

    async createProduct(payload: {
      name: string;
      description: string;
      price: number;
      quantity: number;
      collectionId: string;
      image?: File;
    }) {
      const fd = toFormData(payload);
      const res = await fetch(apiUrl("/admin/products"), {
        method: "POST",
        credentials: "include",
        ...withAuth(),
        body: fd, // do not set Content-Type manually
      });
      return parseOrThrow(res, "Failed to create product");
    },

    async updateProduct(
      id: string,
      payload: {
        name: string;
        description: string;
        price: number;
        quantity: number;
        collectionId: string;
        image?: File;
      }
    ) {
      const fd = toFormData(payload);
      const res = await fetch(apiUrl(`/admin/products/${id}`), {
        method: "PUT",
        credentials: "include",
        ...withAuth(),
        body: fd,
      });
      return parseOrThrow(res, "Failed to update product");
    },

    async deleteProduct(id: string) {
      const res = await fetch(apiUrl(`/admin/products/${id}`), {
        method: "DELETE",
        credentials: "include",
        ...withAuth(),
      });
      return parseOrThrow(res, "Failed to delete product");
    },

    // ----- Orders -----
    async listOrders() {
      const res = await fetch(apiUrl("/admin/orders"), {
        cache: "no-store",
        credentials: "include",
        ...withAuth(),
      });
      return parseOrThrow(res, "Failed to load orders");
    },

    async updateOrderStatus(orderId: string, status: string) {
      const res = await fetch(apiUrl(`/admin/orders/${orderId}/status`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        ...withAuth(),
        body: JSON.stringify({ status }),
      });
      return parseOrThrow(res, "Failed to update order");
    },

    async exportOrders(): Promise<Blob> {
      const res = await fetch(apiUrl("/admin/orders/export"), {
        method: "GET",
        credentials: "include",
        ...withAuth(),
      });
      if (!res.ok) throw new Error("Failed to export orders");
      return await res.blob();
    },

    async listCustomers() {
      const res = await fetch(apiUrl("/admin/customers"), {
        cache: "no-store",
        credentials: "include",
        ...withAuth(),
      });
      return parseOrThrow(res, "Failed to load customers");
    },
  },

  // Generic POST
  async post(path: string, body: unknown) {
    const res = await fetch(apiUrl(path), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      ...withAuth(),
      body: JSON.stringify(body),
    });
    return parseOrThrow(res, "Request failed");
  },
};

export default api;
