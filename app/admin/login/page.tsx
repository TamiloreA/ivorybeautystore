"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import "@/app/styles/auth.css";

export default function AdminLogin() {
  const router = useRouter();
  const circleRef = useRef<HTMLDivElement | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Optional: move fonts to your root layout if you want; keeping simple here
  // useEffect(() => {
  //   const link = document.createElement("link");
  //   link.href =
  //     "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=Montserrat:wght@200;300;400;500&display=swap";
  //   link.rel = "stylesheet";
  //   document.head.appendChild(link);
  //   return () => document.head.removeChild(link);
  // }, []);

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

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const res = await api.admin.login({ email, password });
      // Store admin token for subsequent admin-protected calls
      const token = (res as any)?.token;
      if (token) localStorage.setItem("adminToken", token);
      router.push("/admin/dashboard");
    } catch (err: any) {
      setError(err?.message || "Failed to log in. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="logo">IVORY BEAUTY</h1>
            <p className="auth-subtitle">Admin Login</p>
          </div>

          <div className="auth-content">
            {error && <div className={`error-message ${error ? "active" : ""}`}>{error}</div>}

            <form id="login-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  disabled={isLoading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="password-input-container">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    disabled={isLoading}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    aria-label="Toggle password visibility"
                    onClick={() => setShowPassword((s) => !s)}
                    disabled={isLoading}
                  >
                    <span className="eye-icon">{showPassword ? "👁️" : "🔒"}</span>
                  </button>
                </div>
              </div>

              <div className="form-options">
                <div className="remember-me">
                  <input
                    id="remember"
                    name="remember"
                    type="checkbox"
                    disabled={isLoading}
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <label htmlFor="remember">Remember me</label>
                </div>
                <Link href="/admin/forgot-password" className="forgot-password">
                  Forgot password?
                </Link>
              </div>

              <button type="submit" className="auth-button" disabled={isLoading}>
                {isLoading ? <div className="spinner" /> : "AdminLogin"}
              </button>
            </form>

            <div className="auth-footer">
              <p>
                Don&apos;t have an account? <Link href="/admin/signup">Sign up</Link>
              </p>
              <Link href="/" className="back-to-site">
                ← Back to website
              </Link>
            </div>
          </div>
        </div>

        <div className="auth-decoration">
          <div className="decoration-circle" ref={circleRef} />
        </div>
      </div>
    </div>
  );
}
