"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import "@/app/styles/auth.css"; 

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const circleRef = useRef<HTMLDivElement | null>(null);

  // Load Google fonts
  useEffect(() => {
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=Montserrat:wght@200;300;400;500&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => {
      document.head.contains(link) && document.head.removeChild(link);
    };
  }, []);

  // Decoration circle
  useEffect(() => {
    const circle = circleRef.current;
    if (!circle) return;
    const randomPosition = () => {
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      const scale = 0.8 + Math.random() * 0.4;
      circle.style.top = `${y}%`;
      circle.style.left = `${x}%`;
      circle.style.transform = `translate(-50%, -50%) scale(${scale})`;
    };
    randomPosition();
    const id = setInterval(randomPosition, 5000);
    return () => clearInterval(id);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      await signup({
        name,
        email,
        password,
        confirmPassword,
        address,
        phone,
      });
      router.push("/login");
    } catch (err: any) {
      setError(err?.message || "Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* <Header /> */}
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="logo">IVORY BEAUTY</h1>
            <p className="auth-subtitle">Create Account</p>
          </div>

          <div className="auth-content">
            {error ? <div className="error-message active">{error}</div> : null}

            <form id="signup-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  id="name"
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="password-input-container">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    aria-label="Toggle password visibility"
                    onClick={() => setShowPassword((v) => !v)}
                    disabled={isLoading}
                  >
                    <span className="eye-icon">{showPassword ? "👁️‍🗨️" : "👁️"}</span>
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className="password-input-container">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    aria-label="Toggle confirm password visibility"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    disabled={isLoading}
                  >
                    <span className="eye-icon">{showConfirmPassword ? "👁️‍🗨️" : "👁️"}</span>
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="address">Address</label>
                <input
                  id="address"
                  name="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <button type="submit" className="auth-button" disabled={isLoading}>
                {isLoading ? "Creating Account..." : "Sign Up"}
              </button>
            </form>

            <div className="auth-footer">
              <p>
                Already have an account? <Link href="/login">Log in</Link>
              </p>
              <Link href="/" className="back-to-site">
                ← Back to website
              </Link>
            </div>
          </div>
        </div>

        <div className="auth-decoration">
          <div className="decoration-circle" ref={circleRef}></div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
