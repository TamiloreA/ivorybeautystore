"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import TestimonialSlider from "@/components/TestimonialSlider";
import BestsellersSection from "@/components/BestsellersSection";
import ScrollReveal from "@/components/ScrollReveal";
import CustomCursor from "@/components/CustomCursor";
import Loader from "@/components/Loader";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

type Product = any;

export default function Home() {
  const { setCartCount } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
        try {
          setIsLoading(true);
          const landing = await api.user.getLandingData();
    
          if (!landing.success) {
            throw new Error(landing.message || "Failed to load data");
          }
    
          setCartCount(landing.data.cartCount ?? 0);
          setProducts(landing.data.products ?? []);
          setCollections(landing.data.collections ?? []);
        } catch (err: any) {
          console.error("Failed to fetch data:", err);
          setError(err.message || "Failed to load data. Please try again later.");
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    }, [setCartCount]);

  const featuredProducts = products.slice(0, 3);

  const handleAddToCart = async (productId: string, quantity = 1) => {
    try {
      await api.post("/cart/add", { productId, quantity });
      setCartCount((prev) => prev + quantity);
    } catch (error) {
      console.error("Error adding to cart:", error);
    }
  };

  const handleNewsletterSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const email = (e.currentTarget.querySelector('input[type="email"]') as HTMLInputElement | null)?.value || "";
    if (email.trim()) {
      console.log("Newsletter signup:", email);
      e.currentTarget.reset();
    }
  };

  useEffect(() => {
    // Parallax effect
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const heroImage = document.querySelector<HTMLElement>(".hero-image");
      const circle = document.querySelector<HTMLElement>(".circle");
      if (heroImage) heroImage.style.transform = `translateY(${scrollPosition * 0.1}px)`;
      if (circle) circle.style.transform = `translateY(${scrollPosition * 0.05}px)`;
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <CustomCursor />
      {isLoading && <Loader onComplete={() => setIsLoading(false)} />}

      <Header />

      <main>
        <section className="hero">
          <div className="hero-content">
            <h1 className="fade-in">
              Beaut in <span className="highlight">Simplicity</span>
            </h1>
            <p className="fade-in delay-1">Discover skincare that celebrates your natural essence</p>
            <a href="/products">
              <button className="btn fade-in delay-2">Explore Collection</button>
            </a>
          </div>
          <div className="hero-image fade-in delay-1">
            <div className="product-image"></div>
            <div className="circle"></div>
          </div>
        </section>

        <section className="featured">
          <h2 className="section-title reveal">Featured Products</h2>
          {error ? (
            <div className="error-message">
              <p>{error}</p>
              <button onClick={() => window.location.reload()}>Retry</button>
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="products-container">
              {featuredProducts.map((product: any) => (
                <ProductCard key={product._id} product={product} onAddToCart={handleAddToCart} />
              ))}
            </div>
          ) : (
            <div className="no-products">
              <p>No featured products found</p>
            </div>
          )}
        </section>

        <BestsellersSection collections={collections} onAddToCart={handleAddToCart} />

        <section className="philosophy">
          <ScrollReveal className="philosophy-content">
            <h2>Our Philosophy</h2>
            <p>
              We believe in the power of simplicity. Our products are crafted with minimal, high-quality ingredients
              that work in harmony with your skin.
            </p>
            <a href="/about" className="text-link">Learn more about us</a>
          </ScrollReveal>
          <ScrollReveal className="philosophy-image" delay={300}>
            <div className="image-container"></div>
          </ScrollReveal>
        </section>

        <TestimonialSlider />

        <section className="why-choose-us">
          <ScrollReveal>
            <h2 className="section-title">Why Choose Ivory Beauty</h2>
          </ScrollReveal>
          <div className="features-grid">
            <ScrollReveal className="feature">
              <div className="feature-icon"><div className="circle"></div></div>
              <h3>Clean Ingredients</h3>
              <p>
                Our products are formulated without harmful chemicals, ensuring they're gentle on your skin and the environment.
              </p>
            </ScrollReveal>
            <ScrollReveal className="feature" delay={300}>
              <div className="feature-icon"><div className="circle"></div></div>
              <h3>Cruelty-Free</h3>
              <p>We never test on animals and are committed to ethical beauty practices at every step.</p>
            </ScrollReveal>
            <ScrollReveal className="feature" delay={600}>
              <div className="feature-icon"><div className="circle"></div></div>
              <h3>Sustainable Packaging</h3>
              <p>Our packaging is designed to minimize waste and environmental impact without sacrificing elegance.</p>
            </ScrollReveal>
            <ScrollReveal className="feature" delay={900}>
              <div className="feature-icon"><div className="circle"></div></div>
              <h3>Proven Results</h3>
              <p>Clinically tested formulations that deliver visible results and lasting benefits for your skin.</p>
            </ScrollReveal>
          </div>
        </section>

        <section className="newsletter">
          <ScrollReveal className="newsletter-content">
            <h2>Join Our Community</h2>
            <p>Subscribe to receive updates, skincare tips, and exclusive offers.</p>
            <form onSubmit={handleNewsletterSubmit}>
              <input type="email" placeholder="Your email address" required />
              <button type="submit" className="btn">Subscribe</button>
            </form>
          </ScrollReveal>
        </section>
      </main>

      {/* <Footer /> */}
    </>
  );
}
