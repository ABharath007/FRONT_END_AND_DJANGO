import React, { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function LandingPageScroll({ onLoginClick, onRegisterClick, onTeamRegisterClick }) {
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const testimonialsRef = useRef(null);
  const aboutRef = useRef(null);
  const contactRef = useRef(null);

  useEffect(() => {
    // Hero animation
    gsap.fromTo(heroRef.current, { opacity: 0, y: 80 }, { opacity: 1, y: 0, duration: 1.2, ease: "power3.out" });

    // Features animation
    const featureCards = featuresRef.current.querySelectorAll(".feature-card");
    gsap.fromTo(featureCards, { opacity: 0, y: 50 }, {
      opacity: 1, y: 0, stagger: 0.2, duration: 0.8, ease: "power2.out",
      scrollTrigger: { trigger: featuresRef.current, start: "top 85%" }
    });

    // Testimonials animation
    const testimonialItems = testimonialsRef.current.querySelectorAll(".testimonial");
    gsap.fromTo(testimonialItems, { opacity: 0, y: 50 }, {
      opacity: 1, y: 0, stagger: 0.2, duration: 0.8, ease: "power2.out",
      scrollTrigger: { trigger: testimonialsRef.current, start: "top 85%" }
    });

    // About section animation
    gsap.fromTo(aboutRef.current, { opacity: 0, y: 50 }, {
      opacity: 1, y: 0, duration: 1, ease: "power3.out",
      scrollTrigger: { trigger: aboutRef.current, start: "top 85%" }
    });
  }, []);

  const features = [
    { title: "💬 Basic Chat / Messaging", desc: "Instantly communicate to coordinate during emergencies." },
    { title: "🗺️ Location Sharing (GPS)", desc: "Share your live location for faster response." },
    { title: "🔔 Notifications / Alerts", desc: "Stay updated with critical emergency alerts." },
    { title: "🚨 SOS Button", desc: "One-tap emergency alert sharing your live location." },
    { title: "🗺️ Incident Heatmap", desc: "Visualize high-risk zones in real time." },
    { title: "👥 Crowdsourced Verification", desc: "Community-verified reports improve reliability." },
    { title: "📞 Emergency Service Integration", desc: "Auto-forward emergencies to official hotlines." },
    { title: "⚡ AI-Powered Prediction", desc: "Detect patterns and forecast possible emergencies." },
    { title: "📊 Personal Dashboard", desc: "Track your alerts, reports, and safety stats." },
  ];

  return (
    <div className="landing-container">
      <div className="landing-content">
        {/* Header */}
        <header className="header">
          <h2 className="logo">🚨 ResQ</h2>
          <nav className="nav-links">
            <a href="#features">Features</a>
            <a href="#testimonials">Testimonials</a>
            <a href="#about">About</a>
            <a href="#contact">Contact</a>
          </nav>
          <div className="header-buttons">
            <button onClick={onLoginClick} className="header-login">Login</button>
            <button onClick={onRegisterClick} className="header-register">Register</button>
            <button onClick={onTeamRegisterClick} className="header-team">Team Join</button>
          </div>
        </header>

        {/* Hero Section */}
        <div className="landing-card" ref={heroRef}>
          <h1>🚨 Welcome to ResQ</h1>
          <p>
            A <b>real-time emergency response platform</b> connecting people in
            need with responders. <br /> Join us and be part of the mission to save lives.
          </p>
          <div className="cta-buttons">
            <button onClick={onRegisterClick} className="cta-primary">Get Started</button>
            <button className="cta-secondary">Learn More</button>
          </div>
        </div>

        {/* Features Section */}
        <section className="features" id="features" ref={featuresRef}>
          <h2>🔥 Core & Future Features</h2>
          <div className="feature-grid">
            {features.map((feature, i) => (
              <div key={i} className="feature-card">
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section className="testimonials" id="testimonials" ref={testimonialsRef}>
          <h2>💡 What Our Users Say</h2>
          <div className="testimonial-grid">
            <div className="testimonial">
              <p>"ResQ helped me get quick help during an accident. Lifesaver!"</p>
              <span>- Anjali, Student</span>
            </div>
            <div className="testimonial">
              <p>"The SOS button and alerts are so fast. I feel safer every day."</p>
              <span>- Rohit, IT Professional</span>
            </div>
            <div className="testimonial">
              <p>"The incident heatmap is brilliant for avoiding unsafe areas."</p>
              <span>- Meera, Traveler</span>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section className="about" id="about" ref={aboutRef}>
          <h2>About ResQ</h2>
          <p>
            ResQ is designed to make communities safer through technology.
            Combining crowdsourced intelligence, AI prediction, and real-time response
            systems, we aim to reduce emergency response times and save lives.
          </p>
        </section>
        {/* Contact */}
        <section className="contact" id="contact" ref={contactRef}>
          <h2>Contact Us</h2>
          <p>If you have any questions or need support, feel free to reach out!</p>
          <p>Email:resq@gmail.com</p>
          <p>Phone: 9390761897</p>
        </section>

        {/* Footer */}
        <footer className="footer" id="contact">
          <div className="footer-links">
            <a href="#features">Features</a>
            <a href="#about">About</a>
            <a href="#testimonials">Testimonials</a>
            <a href="#contact">Contact</a>
          </div>
          <p>Made with ❤️ by ResQ Team | © 2025</p>
        </footer>
      </div>
    </div>
  );
}
