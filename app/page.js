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
      tl1.to(".hero-section video", { width: "93%" }, "hero");

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
      const videos = document.querySelectorAll(".duo-wrap video");
      videos.forEach((video) => {
        video.addEventListener("mouseenter", () => {
          cursor.innerHTML = "SOUND ON";
          cursor.classList.add("cursor-text-active");
        });
        video.addEventListener("mouseleave", () => {
          cursor.classList.remove("cursor-text-active");
          cursor.innerHTML = "";
        });
      });

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
          <div>
            <h1>Code Practice</h1>
            <h2>AI-Powered Growth</h2>
            <video autoPlay muted loop src="/duo/Video/section1-video.mp4" />
          </div>
        </section>

        {/* ====== ABOUT ====== */}
        <section className="about-section">
          <div className="top">
            <h1>We are CogniCode,</h1>
          </div>
          <div className="bottom">
            <div className="left">
              <h3>AN AI-POWERED PLATFORM BUILT TO SHARPEN YOUR CODING SKILLS</h3>
            </div>
            <div className="right">
              <p>
                We combine structured learning paths with AI-driven code review, complexity
                analysis, and smart recommendations to accelerate your problem-solving journey.
                Practice 45+ curated problems, get instant hints, and track your progress —
                all in one place.
              </p>
              <button>About us</button>
            </div>
          </div>
        </section>

        {/* ====== SERVICES ====== */}
        <section className="services-section">
          <p>
            EXPLORE OUR <br />
            FEATURES
          </p>

          <div className="elem">
            <img className="left img1" src="/duo/images/page4-img1.webp" alt="" />
            <div className="text">
              <Link href={userID ? "/learn" : "/login"}><h1>Learn</h1></Link>
              <Link href={userID ? "/learn" : "/login"}><h1>Learn</h1></Link>
            </div>
            <img className="right img2" src="/duo/images/page4-img2.webp" alt="" />
          </div>

          <div className="elem">
            <img className="left img3" src="/duo/images/page4-img3.webp" alt="" />
            <div className="text">
              <Link href={userID ? "/problems" : "/login"}><h1>Problems</h1></Link>
              <Link href={userID ? "/problems" : "/login"}><h1>Problems</h1></Link>
            </div>
            <img className="right img4" src="/duo/images/page4-img4.webp" alt="" />
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
            <div className="dev-row" data-image="/duo/images/home-mentions-verizon.webp">
              <h4>Dr. Prashant Aggarwal</h4>
              <p><span>Mentor &amp; Guide</span></p>
            </div>
            <div className="dev-row" data-image="/duo/images/home-mentions-awwwards-honorablemention.webp">
              <h4>Kunal Singh</h4>
              <p><span>Developer</span></p>
            </div>
            <div className="dev-row" data-image="/duo/images/home-mentions-awwwards-mobile.webp">
              <h4>Manish Pandey</h4>
              <p><span>Developer</span></p>
            </div>
            <div className="dev-row" data-image="/duo/images/home-mentions-mindsparkle.webp">
              <h4>Kunal Malhotra</h4>
              <p><span>Developer</span></p>
            </div>
            <div className="dev-row" data-image="/duo/images/home-mentions-orpetron.webp">
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
              <Link href="/profile">Profile</Link>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}
