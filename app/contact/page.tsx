"use client";

import { useEffect, useRef, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CustomCursor from "@/components/CustomCursor";
import ScrollReveal from "@/components/ScrollReveal";
import api from "@/lib/api";
import "@/app/styles/contact.css";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const circleRef = useRef<HTMLDivElement | null>(null);
  const destination = "Lagos, Nigeria";

  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=Montserrat:wght@200;300;400;500&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => {
      document.head.contains(link) && document.head.removeChild(link);
    };
  }, []);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    if (!name || !email || !message) {
      setError("Please fill name, email and message");
      return;
    }
    try {
      setLoading(true);
      await api.post("/contact", { name, email, subject, message });
      setSent(true);
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch (err: any) {
      setError(err?.message || "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  const openMaps = () => {
    const q = encodeURIComponent(destination);
    window.open(`https://www.google.com/maps/search/?api=1&query=${q}`);
  };

  const getDirections = () => {
    const q = encodeURIComponent(destination);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          window.open(`https://www.google.com/maps/dir/?api=1&origin=${latitude},${longitude}&destination=${q}`);
        },
        () => window.open(`https://www.google.com/maps/dir/?api=1&destination=${q}`)
      );
    } else {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${q}`);
    }
  };

  return (
    <div className="contact-page">
      <CustomCursor />
      <Header />

      <main className="contact-main">
        <section className="contact-hero">
          <div className="contact-hero-content">
            <h1 className="fade-in">Get In <span className="highlight">Touch</span></h1>
            <p className="fade-in delay-1">We would love to hear from you</p>
          </div>
          <div className="contact-hero-decoration">
            <div className="decoration-circle" ref={circleRef}></div>
          </div>
        </section>

        <section className="contact-section">
          <div className="contact-container">
            <ScrollReveal className="contact-form">
              <h2>Send a Message</h2>
              {error && <div className="error-message active">{error}</div>}
              {sent && <div className="success-message">Thanks for reaching out</div>}
              <form onSubmit={onSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">Name</label>
                    <input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="subject">Subject</label>
                  <input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
                </div>
                <div className="form-group">
                  <label htmlFor="message">Message</label>
                  <textarea id="message" rows={6} value={message} onChange={(e) => setMessage(e.target.value)} required />
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn" disabled={loading}>{loading ? "Sending…" : "Send Message"}</button>
                </div>
              </form>
            </ScrollReveal>

            <ScrollReveal className="contact-info" delay={300}>
              <h2>Contact Information</h2>
              <div className="info-list">
                <div className="info-item">
                  <div className="info-icon">📍</div>
                  <div>
                    <div className="info-title">Address</div>
                    <div className="info-text">Lagos, Nigeria</div>
                  </div>
                </div>
                <div className="info-item">
                  <div className="info-icon">✉️</div>
                  <div>
                    <div className="info-title">Email</div>
                    <div className="info-text">hello@ivorybeauty.com</div>
                  </div>
                </div>
                <div className="info-item">
                  <div className="info-icon">☎️</div>
                  <div>
                    <div className="info-title">Phone</div>
                    <div className="info-text">+234 000 000 0000</div>
                  </div>
                </div>
              </div>
              <div className="social-links">
                <a href="#" aria-label="Instagram">Instagram</a>
                <a href="#" aria-label="Twitter">Twitter</a>
                <a href="#" aria-label="Facebook">Facebook</a>
              </div>
            </ScrollReveal>
          </div>
        </section>

        <section className="location-section">
          <div className="location-container">
            <ScrollReveal className="map-card">
              <div className="map-frame">
                <iframe
                  title="Location Map"
                  src={`https://www.google.com/maps?q=${encodeURIComponent(destination)}&output=embed`}
                  aria-label="Location"
                />
              </div>
              <div className="map-actions">
                <button className="btn" onClick={openMaps}>Open in Google Maps</button>
                <button className="btn-outline" onClick={getDirections}>Get Directions</button>
              </div>
            </ScrollReveal>

            <ScrollReveal className="location-details" delay={300}>
              <h3>Visit Us</h3>
              <p>{destination}</p>
              <p>Mon–Fri: 9:00–17:00</p>
            </ScrollReveal>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}