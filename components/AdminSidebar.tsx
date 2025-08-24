"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminSidebar({ isActive, toggleSidebar }: { isActive: boolean; toggleSidebar?: () => void }) {
  const pathname = usePathname();
  const isActiveRoute = (path: string) => pathname === path;

  return (
    <aside className={`sidebar ${isActive ? "active" : ""}`}>
      <div className="sidebar-header">
        <h1 className="logo">IVORY BEAUTY</h1>
        <p className="admin-label">Admin Panel</p>
      </div>
      <nav className="sidebar-nav">
        <ul>
          <li className={isActiveRoute("/admin/dashboard") ? "active" : ""}>
            <Link href="/admin/dashboard"><span className="icon">📊</span> Dashboard</Link>
          </li>
          <li className={isActiveRoute("/admin/collections") ? "active" : ""}>
            <Link href="/admin/collections"><span className="icon">📁</span> Collections</Link>
          </li>
          <li className={isActiveRoute("/admin/products") ? "active" : ""}>
            <Link href="/admin/products"><span className="icon">🏷️</span> Products</Link>
          </li>
          <li className={isActiveRoute("/admin/orders") ? "active" : ""}>
            <Link href="/admin/orders"><span className="icon">📦</span> Orders</Link>
          </li>
          <li className={isActiveRoute("/admin/customers") ? "active" : ""}>
            <Link href="/admin/customers"><span className="icon">👥</span> Customers</Link>
          </li>
          <li><a href="#settings"><span className="icon">⚙️</span> Settings</a></li>
        </ul>
      </nav>
      <div className="sidebar-footer">
        <Link href="/" className="view-site-btn"><span className="icon">🌐</span> View Site</Link>
        <Link href="/admin/logout" className="logout-btn"><span className="icon">🚪</span> Logout</Link>
      </div>
    </aside>
  );
}
