"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import "@/app/styles/auth.css"; 

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const circleRef = useRef<HTMLDivElement | null>(null);

  // Load Google fonts (same as old)
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

  // Floating decoration circle animation
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
    setIsLoading(true);
    try {
      await login({ email, password, rememberMe });
      router.push("/");
    } catch (err: any) {
      setError(err?.message || "Failed to log in. Please check your credentials.");
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
            <p className="auth-subtitle">User Login</p>
          </div>

          <div className="auth-content">
            {error ? <div className="error-message active">{error}</div> : null}

            <form id="login-form" onSubmit={handleSubmit}>
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

              <div className="form-options">
                <div className="remember-me">
                  <input
                    type="checkbox"
                    id="remember"
                    name="remember"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={isLoading}
                  />
                  <label htmlFor="remember">Remember me</label>
                </div>
                <Link href="/forgot-password" className="forgot-password">
                  Forgot password?
                </Link>
              </div>

              <button type="submit" className="auth-button" disabled={isLoading}>
                {isLoading ? "Logging in..." : "Login"}
              </button>
            </form>

            <div className="auth-footer">
              <p>
                Don&apos;t have an account? <Link href="/signup">Sign up</Link>
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
      {/* <Footer /> */}
    </div>
  );
}
