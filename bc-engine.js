/* =========================================================
   BLAGOJE ĆURČIĆ — ULTRABRZI JAVASCRIPT ENGINE
   Instant navigacija, pametni skrol i mikro-interakcije
========================================================= */

(function () {
    "use strict";

    // 1. INSTANT PREFETCH (brže učitavanje na dodir)
    document.addEventListener("mouseover", prefetchLink);
    document.addEventListener("touchstart", prefetchLink, { passive: true });

    function prefetchLink(e) {
        const link = e.target.closest("a");
        if (!link || !link.href || link.href.startsWith("mailto:") || link.href.startsWith("tel:") || link.href.includes("#")) return;

        const linkUrl = new URL(link.href, window.location.href);
        if (linkUrl.origin === window.location.origin) {
            if (!document.querySelector(`link[rel="prefetch"][href="${link.href}"]`)) {
                const prefetch = document.createElement("link");
                prefetch.rel = "prefetch";
                prefetch.href = link.href;
                document.head.appendChild(prefetch);
            }
        }
    }

    // Meki prelaz bez blicanja ekrana
    document.addEventListener("click", function (e) {
        const link = e.target.closest("a");
        if (!link || !link.href || link.target === "_blank") return;

        const targetUrl = new URL(link.href, window.location.href);

        if (targetUrl.origin === window.location.origin && !targetUrl.hash && targetUrl.pathname !== window.location.pathname) {
            e.preventDefault();
            document.body.classList.add("bc-page-transition");
            setTimeout(function () {
                window.location.href = link.href;
            }, 180);
        }
    });

    // 2. GLATKI SKROL DO ANCHOR LINKOVA (#about, #principles...)
    document.addEventListener("click", function (e) {
        const link = e.target.closest('a[href*="#"]');
        if (!link) return;

        const url = new URL(link.href, window.location.href);
        if (url.pathname === window.location.pathname && url.hash) {
            const target = document.querySelector(url.hash);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        }
    });

    // 3. FADE-IN ANIMACIJE
    function initReveal() {
        const elements = document.querySelectorAll(
            "section, article, .bc-stp-section, .bc-fr-section, .bc-inst-principles, .bc-prop-card, .bc-hero-credo-card"
        );

        if (!("IntersectionObserver" in window)) {
            elements.forEach(el => el.classList.add("bc-revealed"));
            return;
        }

        const observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add("bc-revealed");
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.05,
            rootMargin: "0px 0px -25px 0px"
        });

        elements.forEach(function (el) {
            el.classList.add("bc-reveal");
            observer.observe(el);
        });
    }

    // 4. LER / INERCIJALNI SKROL ZA MIŠ (Samo desktop)
    const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (!isTouch && window.innerWidth > 960) {
        let currentY = window.scrollY;
        let targetY = window.scrollY;
        let isMoving = false;

        window.addEventListener("wheel", function (e) {
            if (document.querySelector(".bc-modal-active, .bc-open")) return;

            e.preventDefault();
            targetY += e.deltaY * 0.82;
            targetY = Math.max(0, Math.min(targetY, document.documentElement.scrollHeight - window.innerHeight));

            if (!isMoving) {
                isMoving = true;
                requestAnimationFrame(runScroll);
            }
        }, { passive: false });

        function runScroll() {
            currentY += (targetY - currentY) * 0.10;
            window.scrollTo(0, currentY);

            if (Math.abs(targetY - currentY) > 0.6) {
                requestAnimationFrame(runScroll);
            } else {
                isMoving = false;
            }
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initReveal);
    } else {
        initReveal();
    }
})();