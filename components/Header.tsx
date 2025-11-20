"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { User, ShoppingCart, LogOut, Menu, X, Search } from "lucide-react";

const Header = () => {
  const { user, cartCount, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    let last = false;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const sc = window.scrollY > 100;
        if (sc !== last) {
          setIsScrolled(sc);
          last = sc;
        }
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setIsMobileNavOpen(false);
    document.body.style.overflow = "";
  }, [pathname]);

  const toggleMobileNav = () => {
    setIsMobileNavOpen(!isMobileNavOpen);
    document.body.style.overflow = !isMobileNavOpen ? "hidden" : "";
  };

  const closeMobileNav = () => {
    setIsMobileNavOpen(false);
    document.body.style.overflow = "";
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input = (e.currentTarget.querySelector(".search-input") as HTMLInputElement | null);
    const searchTerm = input?.value ?? "";
    if (searchTerm.trim()) {
      router.push(`/search?query=${encodeURIComponent(searchTerm)}`);
      closeMobileNav();
    }
  };

  const handleLogout = async () => {
    await logout();
    closeMobileNav();
    router.push("/");
  };

  return (
    <header
      style={{
        padding: isScrolled ? "1rem 5%" : "2rem 5%",
        boxShadow: isScrolled ? "0 5px 20px rgba(0, 0, 0, 0.05)" : "none",
      }}
    >
      <div className="logo">IVORY BEAUTY</div>

      <div className="search-container">
        <form onSubmit={handleSearch}>
          <input type="text" placeholder="Search products..." className="search-input" />
          <button type="submit" className="search-btn" aria-label="Search">
            <Search className="search-icon" size={18} />
          </button>
        </form>
      </div>

      <nav className="desktop-nav">
        <ul>
          <li><Link href="/">Home</Link></li>
          <li><Link href="/about">About</Link></li>
          <li><Link href="/products">Products</Link></li>
          <li><Link href="/contact">Contact</Link></li>
        </ul>
      </nav>

      <div className="header-icons">
        {user ? (
          <>
            <Link href="/profile" className="icon-btn" aria-label="Profile">
              <User className="icon" />
            </Link>
            <div className="cart-icon">
              <Link href="/cart" className="icon-btn" aria-label="Shopping cart">
                <ShoppingCart className="icon" />
                {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
              </Link>
            </div>
            <button onClick={handleLogout} className="icon-btn" aria-label="Logout">
              <LogOut className="icon" />
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="icon-btn" aria-label="Sign in">
              <User className="icon" />
            </Link>
            <div className="cart-icon">
              <Link href="/cart" className="icon-btn" aria-label="Shopping cart">
                <ShoppingCart className="icon" />
                {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
              </Link>
            </div>
          </>
        )}
      </div>

      <button
        className="hamburger-menu"
        onClick={toggleMobileNav}
        aria-label={isMobileNavOpen ? "Close menu" : "Open menu"}
        aria-expanded={isMobileNavOpen}
        aria-controls="mobile-nav"
        type="button"
      >
        {isMobileNavOpen ? <X /> : <Menu />}
      </button>

      <div id="mobile-nav" className={`mobile-nav ${isMobileNavOpen ? "active" : ""}`}>
        <div className="mobile-nav-header">
          <div className="logo">IVORY BEAUTY</div>
          <button className="close-menu" onClick={closeMobileNav} aria-label="Close menu">×</button>
        </div>
        <ul>
          <li><Link href="/" onClick={closeMobileNav}>Home</Link></li>
          <li><Link href="/about" onClick={closeMobileNav}>About</Link></li>
          <li><Link href="/products" onClick={closeMobileNav}>Products</Link></li>
          <li><Link href="/contact" onClick={closeMobileNav}>Contact</Link></li>
        </ul>
        <div className="mobile-nav-footer">
          <div className="mobile-search">
            <form onSubmit={handleSearch}>
              <input type="text" placeholder="Search products..." className="search-input" />
              <button type="submit" className="search-btn">
                <span className="search-icon">&#9906;</span>
              </button>
            </form>
          </div>
          <div className="mobile-actions">
            {user ? (
              <button onClick={handleLogout} className="btn-outline">Logout</button>
            ) : (
              <>
                <Link href="/login" className="btn-outline" onClick={closeMobileNav}>Sign In</Link>
                <Link href="/signup" className="btn" onClick={closeMobileNav}>Sign Up</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
