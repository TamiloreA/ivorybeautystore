import Link from "next/link";

const Footer = () => {
  return (
    <footer>
      <div className="footer-content">
        <div className="footer-logo">IVORY BEAUTY</div>
        <div className="footer-links">
          <div className="footer-column">
            <h4>Shop</h4>
            <ul>
              <li><Link href="/products">All Products</Link></li>
              <li><a href="#">Bestsellers</a></li>
              <li><a href="#">New Arrivals</a></li>
              <li><a href="#">Gift Sets</a></li>
            </ul>
          </div>
          <div className="footer-column">
            <h4>About</h4>
            <ul>
              <li><Link href="/about">Our Story</Link></li>
              <li><a href="#">Ingredients</a></li>
              <li><a href="#">Sustainability</a></li>
              <li><a href="#">Blog</a></li>
            </ul>
          </div>
          <div className="footer-column">
            <h4>Help</h4>
            <ul>
              <li><a href="#">Contact Us</a></li>
              <li><a href="#">Shipping & Returns</a></li>
              <li><Link href="/admin/signup">Admin Signup</Link></li>
              <li><a href="#">Track Order</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-social">
          <a
            href="https://www.instagram.com/ivorybeautyempire?igsh=MW9hM3MybDc1bG50cw=="
            className="social-icon"
            target="_blank"
            rel="noreferrer"
          >
            <i className="fab fa-instagram"></i>
          </a>
          <a href="#" className="social-icon"><i className="fab fa-facebook-f"></i></a>
          <a href="#" className="social-icon"><i className="fab fa-pinterest"></i></a>
          <a href="#" className="social-icon"><i className="fab fa-twitter"></i></a>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2025 Ivory Beauty. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
