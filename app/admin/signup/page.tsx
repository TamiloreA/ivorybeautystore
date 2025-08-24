"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import "@/app/styles/auth.css";

type SignupFormData = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  adminCode: string;
};

type Errors = Partial<Record<keyof SignupFormData, string>>;

export default function AdminSignup() {
  const router = useRouter();

  const [formData, setFormData] = useState<SignupFormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    adminCode: "",
  });

  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    setPasswordStrength(strength);
  };

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const { name, value } = e.target as HTMLInputElement;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name as keyof SignupFormData]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (name === "password") calculatePasswordStrength(value);
  };

  const validateForm = () => {
    const newErrors: Errors = {};
    if (!formData.name.trim()) newErrors.name = "Full name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    if (!formData.adminCode) newErrors.adminCode = "Admin code is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setSubmitError("");

    try {
      await api.admin.signup({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        adminCode: formData.adminCode,
      });
      router.push("/admin/login");
    } catch (error: any) {
      setSubmitError(error?.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const strengthText = ["Very Weak", "Weak", "Medium", "Good", "Strong"][passwordStrength] ?? "";
  const strengthClass = ["", "weak", "medium", "good", "strong"][passwordStrength] ?? "";

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="logo">IVORY BEAUTY</h1>
            <p className="auth-subtitle">Admin Signup</p>
          </div>

          {submitError && <div className="error-message active">{submitError}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={errors.name ? "input-error" : ""}
                disabled={loading}
              />
              {errors.name && <div className="error-text">{errors.name}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? "input-error" : ""}
                disabled={loading}
              />
              {errors.email && <div className="error-text">{errors.email}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="password-input-container">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  className={errors.password ? "input-error" : ""}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label="Toggle password visibility"
                >
                  <span className="eye-icon">{showPassword ? "👁️" : "🔒"}</span>
                </button>
              </div>

              <div className="password-strength">
                <div className="strength-meter">
                  <div
                    className={`strength-bar ${strengthClass}`}
                    style={{ width: `${(passwordStrength / 4) * 100}%` }}
                  />
                </div>
                <span className="strength-text">{formData.password ? strengthText : "Password strength"}</span>
              </div>

              {errors.password && <div className="error-text">{errors.password}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="confirm-password">Confirm Password</label>
              <div className="password-input-container">
                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={errors.confirmPassword ? "input-error" : ""}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowConfirmPassword((s) => !s)}
                  aria-label="Toggle password visibility"
                >
                  <span className="eye-icon">{showConfirmPassword ? "👁️" : "🔒"}</span>
                </button>
              </div>
              {errors.confirmPassword && <div className="error-text">{errors.confirmPassword}</div>}
            </div>

            <div className="form-group">
              <div className="admin-code-container">
                <label htmlFor="admin-code">Admin Access Code</label>
                <div className="tooltip">
                  <span className="info-icon">ℹ️</span>
                  <span className="tooltip-text">Required code provided by system administrator</span>
                </div>
              </div>
              <input
                id="admin-code"
                name="adminCode"
                value={formData.adminCode}
                onChange={handleChange}
                className={errors.adminCode ? "input-error" : ""}
                disabled={loading}
              />
              {errors.adminCode && <div className="error-text">{errors.adminCode}</div>}
            </div>

            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? <div className="spinner" /> : "Create Account"}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Already have an account? <Link href="/admin/login">Login</Link>
            </p>
            <Link href="/" className="back-to-site">
              ← Back to website
            </Link>
          </div>
        </div>

        <div className="auth-decoration">
          <div className="decoration-circle" />
        </div>
      </div>
    </div>
  );
}
