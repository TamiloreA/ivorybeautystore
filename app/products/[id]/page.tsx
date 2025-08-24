"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import ProductCard from "@/components/ProductCard"; 

type Product = {
  _id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  collectionRef?: { _id: string; name: string };
};

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const { user, setCartCount } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [related, setRelated] = useState<Product[]>([]);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const p = await api.user.getProductDetails(id);
        setProduct(p);
        if (p?.collectionRef?._id) {
          const r = await api.user.getCollectionProducts(p.collectionRef._id);
          setRelated((r || []).filter((x: Product) => x._id !== id));
        }
      } catch (err) {
        console.error("Failed to fetch product:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const addToCart = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (!product) return;
    setAdding(true);
    try {
      const res = await api.user.addToCart({ productId: product._id, quantity: 1 });
      setCartCount(res.cartCount ?? 0);
    } catch (err) {
      console.error("Add to cart failed:", err);
    } finally {
      setAdding(false);
    }
  };

  if (loading) return <div style={{ padding: "2rem" }}>Loading product...</div>;
  if (!product) return <div style={{ padding: "2rem" }}>Product not found</div>;

  return (
    <div className="product-detail">
      <div className="product-images">
        {/* Optional gallery */}
        <img
          src={product.imageUrl || "/placeholder.svg"}
          alt={product.name}
          style={{ maxWidth: 420, width: "100%", borderRadius: 8 }}
        />
      </div>

      <div className="product-info">
        <h1>{product.name}</h1>
        <div className="price">₦{(product.price ?? 0).toFixed(2)}</div>
        <p>{product.description}</p>

        <button className="btn" onClick={addToCart} disabled={adding}>
          {adding ? "Adding..." : "Add to Cart"}
        </button>
      </div>

      {related.length > 0 && (
        <div className="related-products" style={{ marginTop: "3rem" }}>
          <h2>Related Products</h2>
          <div className="products-container">
            {related.map((prod) => (
              <a key={prod._id} href={`/products/${prod._id}`} className="product-card">
                <div className="product-image-container">
                  <img
                    src={prod.imageUrl || "/placeholder.svg"}
                    alt={prod.name}
                    className="product-image"
                  />
                </div>
                <div className="product-info">
                  <h3 className="product-title">{prod.name}</h3>
                  <div className="product-collection">
                    {prod.collectionRef?.name || "Collection"}
                  </div>
                  <div className="product-price">₦{(prod.price ?? 0).toFixed(2)}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
