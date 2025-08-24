"use client";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { useState, useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProductCard from "@/components/ProductCard";
import TestimonialSlider from "../components/TestimonialSlider";
import BestsellersSection from "../components/BestsellersSection";
import ScrollReveal from "../components/ScrollReveal";
import CustomCursor from "../components/CustomCursor";
import Loader from "../components/Loader";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";

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

  useEffect(() => {
    const els = Array.from(
      document.querySelectorAll<HTMLElement>("[data-animate], [data-stagger]")
    );

    // For stagger containers, mark children with an index once
    els.forEach((el) => {
      if (el.hasAttribute("data-stagger")) {
        Array.from(el.children).forEach((child, i) => {
          (child as HTMLElement).style.setProperty("--i", String(i));
        });
      }
    });

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).classList.add("animate-in");
            io.unobserve(entry.target); // fire once
          }
        });
      },
      { root: null, rootMargin: "0px 0px -10% 0px", threshold: 0.15 }
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  

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
    const email =
      (
        e.currentTarget.querySelector(
          'input[type="email"]'
        ) as HTMLInputElement | null
      )?.value || "";
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
      if (heroImage)
        heroImage.style.transform = `translateY(${scrollPosition * 0.1}px)`;
      if (circle)
        circle.style.transform = `translateY(${scrollPosition * 0.05}px)`;
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
            <h1
              data-animate="fade-right"
              style={{ ["--delay" as any]: "80ms" }}
            >
              Beauty in <span className="highlight">Simplicity</span>
            </h1>
            <p
              data-animate="fade-right"
              style={{ ["--delay" as any]: "180ms" }}
            >
              Discover skincare that celebrates your natural essence
            </p>
            <a
              href="/products"
              data-animate="fade-right"
              style={{ ["--delay" as any]: "280ms" }}
            >
              <button className="btn">Explore Collection</button>
            </a>
          </div>

          <div
            className="hero-image"
            data-animate="zoom"
            data-blur
            style={{ ["--delay" as any]: "120ms" }}
          >
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
            <div className="container mx-auto px-4">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {featuredProducts.map((product: any) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="no-products">
              <p>No featured products found</p>
            </div>
          )}
        </section>

        <BestsellersSection
          collections={collections}
          onAddToCart={handleAddToCart}
        />

        <section className="philosophy">
          <ScrollReveal className="philosophy-content">
            <h2 data-animate="fade-up">Our Philosophy</h2>
            <p data-animate="fade-up" style={{ ["--delay" as any]: "90ms" }}>
              We believe in the power of simplicity...
            </p>
            <a
              href="/about"
              className="text-link"
              data-animate="fade-up"
              style={{ ["--delay" as any]: "180ms" }}
            >
              Learn more about us
            </a>
          </ScrollReveal>
          <ScrollReveal className="philosophy-image" delay={300}>
            <div
              className="image-container"
              data-animate="zoom"
              data-blur
            ></div>
          </ScrollReveal>
        </section>

        <TestimonialSlider />

        <section className="why-choose-us">
          <ScrollReveal>
            <h2 className="section-title" data-animate="fade-up">
              Why Choose Ivory Beauty
            </h2>
          </ScrollReveal>
          <div className="features-grid" data-stagger>
            <ScrollReveal className="feature">
              <div data-animate="fade-up">
                <div className="feature-icon">
                  <div className="circle"></div>
                </div>
                <h3>Clean Ingredients</h3>
                <p>
                  Our products are formulated without harmful chemicals,
                  ensuring they're gentle on your skin and the environment.
                </p>
              </div>
            </ScrollReveal>
            <ScrollReveal className="feature" delay={300}>
              <div data-animate="fade-up">
                <div className="feature-icon">
                  <div className="circle"></div>
                </div>
                <h3>Cruelty-Free</h3>
                <p>
                  We never test on animals and are committed to ethical beauty
                  practices at every step.
                </p>
              </div>
            </ScrollReveal>
            <ScrollReveal className="feature" delay={600}>
              <div data-animate="fade-up">
                <div className="feature-icon">
                  <div className="circle"></div>
                </div>
                <h3>Sustainable Packaging</h3>
                <p>
                  Our packaging is designed to minimize waste and environmental
                  impact without sacrificing elegance.
                </p>
              </div>
            </ScrollReveal>
            <ScrollReveal className="feature" delay={900}>
              <div data-animate="fade-up">
                <div className="feature-icon">
                  <div className="circle"></div>
                </div>
                <h3>Proven Results</h3>
                <p>
                  Clinically tested formulations that deliver visible results
                  and lasting benefits for your skin.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>

        <section className="newsletter">
          <div className="newsletter-content" data-animate="fade-up">
            <h2>Join Our Community</h2>
            <p>
              Subscribe to receive updates, skincare tips, and exclusive offers.
            </p>
            <form
              onSubmit={handleNewsletterSubmit}
              data-animate="fade-up"
              style={{ ["--delay" as any]: "120ms" }}
            >
              <input type="email" placeholder="Your email address" required />
              <button type="submit" className="btn">
                Subscribe
              </button>
            </form>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
