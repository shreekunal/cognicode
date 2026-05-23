"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function Home() {
  const cursorRef = useRef(null);
  const { data: session } = useSession();
  const userID = session?.user?._id;

  useEffect(() => {
    let ctx;

    const init = async () => {
      const gsapMod = await import("gsap");
      const gsap = gsapMod.default;
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");

      gsap.registerPlugin(ScrollTrigger);

      /* ---------- hero parallax ---------- */
      const tl1 = gsap.timeline({
        scrollTrigger: {
          trigger: ".hero-section",
          start: "top 30%",
          end: "bottom 45%",
          scrub: 0.2,
        },
      });
      tl1.to(".hero-section h1", { x: -100 }, "hero");
      tl1.to(".hero-section h2", { x: 100 }, "hero");
      tl1.to(".hero-visual", { width: "93%", opacity: 1 }, "hero");

      /* ---------- custom cursor ---------- */
      const cursor = cursorRef.current;

      const onMouseMove = (e) => {
        gsap.to(cursor, {
          x: e.clientX - 9,
          y: e.clientY - 9,
          duration: 0.1,
          ease: "power2.out",
        });
      };
      document.addEventListener("mousemove", onMouseMove);

      /* cursor — video hover */
      // const videos = document.querySelectorAll(".duo-wrap video");
      // videos.forEach((video) => {
      //   video.addEventListener("mouseenter", () => {
      //     cursor.innerHTML = "Scroll";
      //     cursor.classList.add("cursor-text-active");
      //   });
      //   video.addEventListener("mouseleave", () => {
      //     cursor.classList.remove("cursor-text-active");
      //     cursor.innerHTML = "";
      //   });
      // });

      /* cursor — developer row hover (image preview) */
      const rows = document.querySelectorAll(".dev-row");
      rows.forEach((row) => {
        row.addEventListener("mouseenter", () => {
          cursor.classList.add("cursor-img");
          cursor.classList.remove("mixBlend");
          const src = row.getAttribute("data-image");
          cursor.style.backgroundImage = `url(${src})`;
        });
        row.addEventListener("mouseleave", () => {
          cursor.classList.add("mixBlend");
          cursor.classList.remove("cursor-img");
          cursor.style.backgroundImage = "";
        });
      });

      /* store context for cleanup */
      ctx = { gsap, onMouseMove, ScrollTrigger };
    };

    init();

    return () => {
      if (ctx?.onMouseMove) document.removeEventListener("mousemove", ctx.onMouseMove);
      if (ctx?.ScrollTrigger) ctx.ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return (
    <div className="duo-wrap">
      {/* Custom cursor */}
      <div ref={cursorRef} className="duo-cursor mixBlend" />

      {/* Single scroll container */}
      <div id="duo-main">

        {/* ====== HERO ====== */}
        <section className="hero-section">
          <div className="hero-content">
            <h1>Code Smarter</h1>
            <h2>AI-Powered Mastery</h2>
            
            <div className="hero-cta">
              <Link href={userID ? "/problems" : "/login"} className="main-cta">
                Start Solving
              </Link>
            </div>
          </div>
        </section>

        {/* ====== ABOUT ====== */}
        <section className="about-section">
          <div className="top">
            <h1>We are CogniCode,</h1>
          </div>
          <div className="bottom">
            <div className="left">
              <h3>YOUR INTELLIGENT COMPANION FOR ALGORITHMIC EXCELLENCE</h3>
            </div>
            <div className="right">
              <p>
                CogniCode isn't just another coding platform. We use advanced AI to provide 
                real-time code reviews, analyze your time and space complexity, and give 
                human-like hints when you're stuck.
              </p>
              <button onClick={() => document.querySelector('.features-grid')?.scrollIntoView({ behavior: 'smooth' })}>Explore Features</button>
            </div>
          </div>
        </section>

        {/* ====== FEATURES BENTO ====== */}
        <section className="features-grid">
          <div className="feature-card large">
            <img src="/coding.png" alt="AI Code Review" className="feature-icon" />
            <div className="content">
              <h4>AI Code Review</h4>
              <p>Get instant feedback on your code quality, readability, and potential bugs as if a senior engineer was sitting right next to you.</p>
            </div>
          </div>
          <div className="feature-card">
            <img src="/assignment.png" alt="Complexity" className="feature-icon" />
            <div className="content">
              <h4>Complexity Analysis</h4>
              <p>Automatically calculate Big O notation for your solutions to understand efficiency.</p>
            </div>
          </div>
          <div className="feature-card">
            <img src="/timer.png" alt="Timed" className="feature-icon" />
            <div className="content">
              <h4>Interview Mode</h4>
              <p>Practice in a pressure-cooker environment with timed challenges and AI feedback.</p>
            </div>
          </div>
          <div className="feature-card">
            <img src="/interview.png" alt="Hints" className="feature-icon" />
            <div className="content">
              <h4>Smart Hints</h4>
              <p>Never get stuck again. Our AI provides progressive hints that guide you without spoiling the answer.</p>
            </div>
          </div>
          <div className="feature-card">
            <img src="/p2p.png" alt="Community" className="feature-icon" />
            <div className="content">
              <h4>Community Support</h4>
              <p>Connect with other learners, share solutions, and grow together in a collaborative environment.</p>
            </div>
          </div>
        </section>

        {/* ====== SERVICES (Redirects) ====== */}
        <section className="services-section">
          <p>
            READY TO <br />
            GET STARTED?
          </p>

          <div className="elem">
            <img className="left img1" src="/cognicode/duo/images/page4-img1.webp" alt="" />
            <div className="text">
              <Link href={userID ? "/learn" : "/login"}><h1>Learn</h1></Link>
              <Link href={userID ? "/learn" : "/login"}><h1>Learn</h1></Link>
            </div>
            <img className="right img2" src="/cognicode/duo/images/page4-img2.webp" alt="" />
          </div>

          <div className="elem">
            <img className="left img3" src="/cognicode/duo/images/page4-img3.webp" alt="" />
            <div className="text">
              <Link href={userID ? "/problems" : "/login"}><h1>Problems</h1></Link>
              <Link href={userID ? "/problems" : "/login"}><h1>Problems</h1></Link>
            </div>
            <img className="right img4" src="/cognicode/duo/images/page4-img4.webp" alt="" />
          </div>

          <div className="elem">
            <img className="left img1" src="/cognicode/duo/images/page3-image1.webp" alt="" />
            <div className="text">
              <Link href={userID ? "/problems" : "/login"}><h1>Prepare & Test</h1></Link>
              <Link href={userID ? "/problems" : "/login"}><h1>Prepare & Test</h1></Link>
            </div>
            <img className="right img2" src="/cognicode/duo/images/page3-image2.webp" alt="" />
          </div>
        </section>

        {/* ====== DEVELOPERS ====== */}
        <section className="developers-section">
          <div className="dev-inside">
            <div className="dev-header">
              <h1>
                <span>MEET OUR</span> <span>DEVELOPERS</span>
              </h1>
            </div>
            <div className="dev-row" data-image="/cognicode/duo/images/home-mentions-verizon.webp">
              <h4>Dr. Prashant Aggarwal</h4>
              <p><span>Mentor &amp; Guide</span></p>
            </div>
            <div className="dev-row" data-image="/cognicode/duo/images/home-mentions-awwwards-honorablemention.webp">
              <h4>Kunal Singh</h4>
              <p><span>Developer</span></p>
            </div>
            <div className="dev-row" data-image="/cognicode/duo/images/home-mentions-awwwards-mobile.webp">
              <h4>Manish Pandey</h4>
              <p><span>Developer</span></p>
            </div>
            <div className="dev-row" data-image="/cognicode/duo/images/home-mentions-mindsparkle.webp">
              <h4>Kunal Malhotra</h4>
              <p><span>Developer</span></p>
            </div>
            <div className="dev-row" data-image="/cognicode/duo/images/home-mentions-orpetron.webp">
              <h4>Lavish Nehra</h4>
              <p><span>Developer</span></p>
            </div>
          </div>
        </section>

        {/* ====== FOOTER ====== */}
        <footer className="simple-footer">
          <div className="footer-content">
            <p>&copy; 2026 CogniCode. All rights reserved.</p>
            <div className="footer-links">
              <Link href="/learn">Learn</Link>
              <Link href="/problems">Problems</Link>
              <Link href="/problems">Prepare & Test</Link>
              <Link href="/profile">Profile</Link>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}
