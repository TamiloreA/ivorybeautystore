// app/products/page.tsx (or wherever this file lives)
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import "@/app/styles/products.css";
import Footer from "@/components/Footer";

type Product = {
  _id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  collectionRef?: { _id: string; name: string };
};

type Collection = { _id: string; name: string };

export default function ProductsPage() {
  const router = useRouter();
  const { user, setCartCount } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [activeCollection, setActiveCollection] = useState<string>("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const landing = await api.user.getLandingData();
        setProducts(landing?.data?.products ?? []);
        setCollections(landing?.data?.collections ?? []);
      } catch (err) {
        console.error("Failed to fetch products:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleAddToCart = async (productId: string) => {
    // If your ProductCard already gates the CTA by auth, this is just a safety check
    if (!user) {
      router.push("/login");
      return;
    }
    try {
      const res = await api.user.addToCart({ productId, quantity: 1 });
      setCartCount(res?.cartCount ?? 0);
    } catch (err) {
      console.error("Failed to add to cart:", err);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (products || []).filter((p) => {
      const matchesCollection =
        activeCollection === "all" || p.collectionRef?._id === activeCollection;
      const matchesQuery =
        !q ||
        p.name?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.collectionRef?.name?.toLowerCase().includes(q);
      return matchesCollection && matchesQuery;
    });
  }, [products, activeCollection, query]);

  return (
    <>
      <Header />

      <section className="products-hero">
        <div className="hero-content">
          <h1>Our Luxurious Collection</h1>
          <p>Discover our premium skincare products crafted with natural ingredients</p>
        </div>
      </section>

      {/* Filters */}
      <div className="filters-container">
        <div className="collection-filter">
          <button
            className={`filter-btn ${activeCollection === "all" ? "active" : ""}`}
            onClick={() => setActiveCollection("all")}
          >
            All Products
          </button>

          {collections.map((c) => (
            <button
              key={c._id}
              className={`filter-btn ${activeCollection === c._id ? "active" : ""}`}
              onClick={() => setActiveCollection(c._id)}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search products..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search products"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="products-container">
        {loading ? (
          <div className="loading">Loading products...</div>
        ) : filtered.length === 0 ? (
          <div className="no-products">
            <h3>No products found</h3>
            <p>Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          filtered.map((p) => (
            <ProductCard
              key={p._id}
              product={{
                _id: p._id,
                name: p.name,
                price: p.price,
                imageUrl: p.imageUrl,
                collectionRef: { name: p.collectionRef?.name || "Collection" },
                // pass description through so Products page can show it
                description: p.description,
              }}
              onAddToCart={handleAddToCart}
              showDescription
            />
          ))
        )}
      </div>
      <Footer/>
    </>
  );
}
