"use client";
import { useState, useEffect } from "react";
import ProductCard from "./ProductCard";

type Product = any;
type Collection = { _id: string; name: string; products?: Product[] };

export default function BestsellersSection({
  collections = [],
  onAddToCart,
}: {
  collections?: Collection[];
  onAddToCart?: (productId: string, quantity?: number) => Promise<void> | void;
}) {
  const [activeTab, setActiveTab] = useState<string>("");

  useEffect(() => {
    if (collections.length > 0) setActiveTab(collections[0]._id);
  }, [collections]);

  if (collections.length === 0) return null;

  return (
    <section className="bestsellers">
      <h2 className="section-title reveal">Bestselling Collections</h2>
      <div className="collection-tabs">
        {collections.map((c) => (
          <button
            key={c._id}
            className={`tab-btn ${activeTab === c._id ? "active" : ""}`}
            onClick={() => setActiveTab(c._id)}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="collections-container">
        {collections.map((c) => (
          <div key={c._id} className={`collection-tab ${activeTab === c._id ? "active" : ""}`}>
            <div className="collection-grid">
              {c.products && c.products.length > 0 ? (
                c.products.slice(0, 3).map((p: Product) => (
                  <ProductCard key={(p as any)._id} product={p} onAddToCart={onAddToCart} />
                ))
              ) : (
                <div className="no-products"><p>No products in this collection</p></div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
