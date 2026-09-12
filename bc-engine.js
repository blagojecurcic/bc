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

    // 4. MUZIKA NA SVIM STRANICAMA
    function initBackgroundAudio() {
        if (window.__bcBackgroundAudioReady) return;
        window.__bcBackgroundAudioReady = true;

        const storageKey = "bc-audio-muted";
        let audio = document.getElementById("bcBackgroundAudio");
        let toggle = document.getElementById("bcAudioToggle");
        let playInFlight = false;
        let autoplayBlocked = false;
        let mutedByChoice = false;

        try {
            mutedByChoice = window.localStorage.getItem(storageKey) === "1";
        } catch (err) {}

        if (!audio) {
            audio = document.createElement("audio");
            audio.id = "bcBackgroundAudio";
            audio.loop = true;
            audio.preload = "auto";
            audio.setAttribute("playsinline", "");

            const source = document.createElement("source");
            source.src = "pesma.mp3";
            source.type = "audio/mpeg";
            audio.appendChild(source);
            document.body.appendChild(audio);
        }

        audio.loop = true;
        audio.preload = "auto";
        audio.volume = 0.74;
        audio.setAttribute("playsinline", "");

        if (!toggle) {
            toggle = document.createElement("button");
            toggle.type = "button";
            toggle.id = "bcAudioToggle";
            document.body.appendChild(toggle);
        }

        toggle.setAttribute("aria-label", "Kontrola zvuka pesme");
        toggle.innerHTML = '<span class="bc-audio-dot" aria-hidden="true"></span><span class="bc-audio-label">Звук</span><span class="bc-audio-state" id="bcAudioText">укљ.</span>';

        function rememberMuted(value) {
            mutedByChoice = value;
            try {
                if (value) {
                    window.localStorage.setItem(storageKey, "1");
                } else {
                    window.localStorage.removeItem(storageKey);
                }
            } catch (err) {}
        }

        function updateToggle() {
            const isAudible = !audio.paused && !audio.muted && !mutedByChoice;
            const state = toggle.querySelector(".bc-audio-state");

            toggle.classList.toggle("bc-audio-muted", mutedByChoice);
            toggle.classList.toggle("bc-audio-blocked", autoplayBlocked && !mutedByChoice && !isAudible);
            toggle.setAttribute("aria-pressed", String(isAudible));
            toggle.title = isAudible ? "Isključi zvuk" : "Uključi zvuk";

            if (state) {
                if (mutedByChoice) {
                    state.textContent = "искљ.";
                } else if (autoplayBlocked && !isAudible) {
                    state.textContent = "додир";
                } else {
                    state.textContent = isAudible ? "укљ." : "укљ.";
                }
            }
        }

        function stopWakeEvents() {
            document.removeEventListener("pointerdown", wakeAudio, true);
            document.removeEventListener("touchstart", wakeAudio, true);
            document.removeEventListener("click", wakeAudio, true);
            document.removeEventListener("keydown", wakeAudio, true);
            window.removeEventListener("scroll", wakeAudio, true);
        }

        function tryPlay() {
            if (mutedByChoice || playInFlight) {
                updateToggle();
                return;
            }

            playInFlight = true;
            audio.muted = false;

            const playPromise = audio.play();
            if (!playPromise || typeof playPromise.then !== "function") {
                playInFlight = false;
                autoplayBlocked = false;
                updateToggle();
                stopWakeEvents();
                return;
            }

            playPromise.then(function () {
                playInFlight = false;
                autoplayBlocked = false;
                updateToggle();
                stopWakeEvents();
            }).catch(function () {
                playInFlight = false;
                autoplayBlocked = true;
                updateToggle();
            });
        }

        function wakeAudio(e) {
            const target = e && e.target;
            if (target && target.closest && target.closest("#bcAudioToggle")) return;
            tryPlay();
        }

        toggle.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation();

            const isAudible = !audio.paused && !audio.muted;
            if (isAudible) {
                rememberMuted(true);
                autoplayBlocked = false;
                audio.pause();
                audio.muted = true;
                updateToggle();
                return;
            }

            rememberMuted(false);
            autoplayBlocked = false;
            audio.muted = false;
            tryPlay();
        });

        audio.addEventListener("play", updateToggle);
        audio.addEventListener("pause", updateToggle);
        audio.addEventListener("volumechange", updateToggle);

        document.addEventListener("pointerdown", wakeAudio, true);
        document.addEventListener("touchstart", wakeAudio, true);
        document.addEventListener("click", wakeAudio, true);
        document.addEventListener("keydown", wakeAudio, true);
        window.addEventListener("scroll", wakeAudio, true);

        if (mutedByChoice) {
            audio.muted = true;
            audio.pause();
        } else {
            setTimeout(tryPlay, 60);
        }

        updateToggle();
    }

    // 5. LER / INERCIJALNI SKROL ZA MIŠ (Samo desktop)
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

    function initSiteEngine() {
        initReveal();
        initBackgroundAudio();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initSiteEngine);
    } else {
        initSiteEngine();
    }
})();
