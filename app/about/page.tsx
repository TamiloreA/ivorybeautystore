"use client";

import { useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CustomCursor from "@/components/CustomCursor";
import ScrollReveal from "@/components/ScrollReveal";

export default function AboutPage() {
  useEffect(() => {
    // fonts + FA (same behavior as your original)
    const g = document.createElement("link");
    g.rel = "stylesheet";
    g.href =
      "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=Montserrat:wght@200;300;400;500&display=swap";
    const fa = document.createElement("link");
    fa.rel = "stylesheet";
    fa.href =
      "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css";
    document.head.appendChild(g);
    document.head.appendChild(fa);
    return () => {
      document.head.contains(g) && document.head.removeChild(g);
      document.head.contains(fa) && document.head.removeChild(fa);
    };
  }, []);

  const viewJobs = () => console.log("View career opportunities");

  return (
    <div className="about-page">
      <CustomCursor />
      <Header />

      <main>
        {/* Hero */}
        <section className="about-hero">
          <div className="about-hero-content">
            <h1 className="fade-in">
              Our <span className="highlight">Story</span>
            </h1>
            <p className="fade-in delay-1">
              Founded on the belief that beauty thrives in simplicity
            </p>
          </div>
          <div className="about-hero-image fade-in delay-2">
            <div
              className="image-container"
              style={{ backgroundImage: "url('/IMG_2759.JPG')" }}
            ></div>
          </div>
        </section>

        {/* Mission */}
        <section className="mission">
          <ScrollReveal className="mission-content">
            <h2>Our Mission</h2>
            <p>
              At IVORY BEAUTY, we believe that skincare should be a celebration
              of your natural beauty, not a complex regimen of countless
              products.
            </p>
            <p>
              We strip away the unnecessary and focus on what truly matters:
              quality ingredients, thoughtful formulations, and results you can
              see and feel.
            </p>
          </ScrollReveal>
        </section>

        {/* Founders */}
        <section className="founders">
          <ScrollReveal className="founders-image">
            <div className="image-container" style={{ backgroundImage: "url('/IMG_2433.JPG')" }}></div>
          </ScrollReveal>
          <ScrollReveal className="founders-content" delay={300}>
            <h2>The Founders</h2>
            <p>
              IVORY BEAUTY was born from a shared vision between two friends,
              Claire and Sophia, who were frustrated by the overwhelming
              complexity of modern skincare.
            </p>
            <p>
              With backgrounds in cosmetic chemistry and holistic wellness, they
              set out to create a line that embodied their belief that beauty
              thrives in simplicity.
            </p>
            <p>
              Five years later, their vision has grown into a collection that
              has helped thousands rediscover the joy of simple, effective
              skincare.
            </p>
          </ScrollReveal>
        </section>

        {/* Values */}
        <section className="values">
          <ScrollReveal>
            <h2 className="section-title">Our Values</h2>
          </ScrollReveal>
          <div className="values-container">
            <ScrollReveal className="value-item">
              <div className="value-icon-fixed">
                <div className="value-circle-fixed"></div>
                <div className="value-emoji">🌿</div>
              </div>
              <h3>Simplicity</h3>
              <p>
                We believe in doing more with less. Our formulations focus on
                essential ingredients that deliver real results.
              </p>
            </ScrollReveal>
            <ScrollReveal className="value-item" delay={300}>
              <div className="value-icon-fixed">
                <div className="value-circle-fixed"></div>
                <div className="value-emoji">✨</div>
              </div>
              <h3>Transparency</h3>
              <p>
                We're committed to clear, honest communication about our
                ingredients, sourcing, and manufacturing processes.
              </p>
            </ScrollReveal>
            <ScrollReveal className="value-item" delay={600}>
              <div className="value-icon-fixed">
                <div className="value-circle-fixed"></div>
                <div className="value-emoji">♻️</div>
              </div>
              <h3>Sustainability</h3>
              <p>
                Our commitment to simplicity extends to our environmental
                impact, with mindful packaging and responsible sourcing.
              </p>
            </ScrollReveal>
          </div>
        </section>

        {/* Process */}
        <section className="process">
          <ScrollReveal className="process-content">
            <h2>Our Process</h2>
            <p>
              Every IVORY BEAUTY product begins with a question: What does your
              skin truly need?
            </p>
            <p>
              We test extensively, refine continuously, and only release
              products that meet our exacting standards for efficacy and
              experience.
            </p>
          </ScrollReveal>
          <ScrollReveal className="process-image" delay={300}>
            <div className="image-container" style={{ backgroundImage: "url('/IMG_2758.JPG')" }}></div>
          </ScrollReveal>
        </section>

        {/* Team */}
        <section className="team">
          <ScrollReveal>
            <h2 className="section-title">Meet Our Team</h2>
          </ScrollReveal>
          <div className="team-container">
            <ScrollReveal className="team-member">
              <div className="member-image">
                <div className="hover-reveal"></div>
              </div>
              <h3>Isioma</h3>
              <p>Co-Founder & Formulator</p>
            </ScrollReveal>
            <ScrollReveal className="team-member" delay={300}>
              <div className="member-image">
                <div className="hover-reveal"></div>
              </div>
              <h3>Sophia Lin</h3>
              <p>Co-Founder & Creative Director</p>
            </ScrollReveal>
            <ScrollReveal className="team-member" delay={600}>
              <div className="member-image">
                <div className="hover-reveal"></div>
              </div>
              <h3>James Wilson</h3>
              <p>Head of Product Development</p>
            </ScrollReveal>
          </div>
        </section>

        {/* CTA */}
        <section className="join-us">
          <ScrollReveal className="join-us-content">
            <h2>Join Our Journey</h2>
            <p>
              We're always looking for passionate individuals who share our
              vision of beauty in simplicity.
            </p>
            <button className="btn" onClick={viewJobs}>
              View Opportunities
            </button>
          </ScrollReveal>
        </section>
      </main>

      <Footer />
    </div>
  );
}
