/* Manish Kandel — site interactions */
(() => {
  if (window.top !== window.self) { document.documentElement.style.display = "none"; try { window.top.location.replace(window.self.location.href); } catch (e) {} return; } // never render inside another site's frame
  const root = document.documentElement;
  root.classList.add("js");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Load sequence ---------- */
  const loaded = () => root.classList.add("is-loaded");
  if (document.fonts && document.fonts.ready) {
    Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 1800))]).then(() => setTimeout(loaded, 350));
  } else {
    window.addEventListener("load", loaded);
  }
  setTimeout(loaded, 3000); // failsafe: never leave the curtain up

  /* ---------- Smooth scroll (Lenis) ---------- */
  let lenis = null;
  if (!reduced && window.Lenis) {
    lenis = new window.Lenis({ duration: 1.25, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    const raf = time => { lenis.raf(time); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener("click", e => {
      const id = a.getAttribute("href");
      const target = id === "#top" ? document.body : document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      closeMenu();
      if (lenis) lenis.scrollTo(id === "#top" ? 0 : target, { offset: 0 });
      else (id === "#top" ? window.scrollTo({ top: 0 }) : target.scrollIntoView());
    });
  });

  /* ---------- Nav: background on scroll, hide on scroll down ---------- */
  const nav = document.getElementById("nav");
  let lastY = 0;
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle("is-scrolled", y > 40);
    const menuOpen = toggle.getAttribute("aria-expanded") === "true";
    nav.classList.toggle("is-hidden", !menuOpen && y > 400 && y > lastY + 4);
    if (y < lastY - 4 || y < 400) nav.classList.remove("is-hidden");
    lastY = y;
  };

  /* ---------- Mobile menu ---------- */
  const toggle = document.getElementById("navToggle");
  const panel = document.getElementById("navPanel");
  function closeMenu() {
    if (toggle.getAttribute("aria-expanded") !== "true") return;
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open menu");
    panel.hidden = true;
    if (lenis) lenis.start();
  }
  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") !== "true";
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    panel.hidden = !open;
    nav.classList.add("is-scrolled");
    if (lenis) open ? lenis.stop() : lenis.start();
  });
  window.addEventListener("keydown", e => { if (e.key === "Escape") closeMenu(); });

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Active nav link ---------- */
  const links = [...document.querySelectorAll(".nav__links a")];
  const sections = links.map(l => document.querySelector(l.getAttribute("href"))).filter(Boolean);
  const spy = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      links.forEach(l => l.toggleAttribute("aria-current", l.getAttribute("href") === "#" + en.target.id));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  sections.forEach(s => spy.observe(s));

  /* ---------- Scroll reveal ---------- */
  const revealEls = document.querySelectorAll(".reveal, .sec-head");
  const groups = new Map();
  revealEls.forEach(el => {
    const parent = el.parentElement;
    const i = groups.get(parent) || 0;
    el.style.setProperty("--d", Math.min(i * 0.09, 0.45) + "s");
    groups.set(parent, i + 1);
  });
  if (reduced || !("IntersectionObserver" in window)) {
    revealEls.forEach(el => el.classList.add("is-in"));
  } else {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    revealEls.forEach(el => io.observe(el));
  }

  /* ---------- Hero canvas: slow drifting gold constellation ---------- */
  const canvas = document.getElementById("heroCanvas");
  if (canvas && !reduced) {
    const ctx = canvas.getContext("2d");
    let w, h, dpr, pts = [], running = true, mouse = { x: -9999, y: -9999 };
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(70, (w * h) / 22000));
      pts = Array.from({ length: n }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - .5) * .18, vy: (Math.random() - .5) * .18,
        r: Math.random() * 1.4 + .4
      }));
    };
    const draw = () => {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        const dx = p.x - mouse.x, dy = p.y - mouse.y, dist = Math.hypot(dx, dy);
        if (dist < 140) { p.x += dx / dist * .6; p.y += dy / dist * .6; }
      }
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const a = pts[i], b = pts[j], d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 150) {
            ctx.strokeStyle = `rgba(212,175,106,${(1 - d / 150) * .16})`;
            ctx.lineWidth = .6;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      for (const p of pts) {
        ctx.fillStyle = "rgba(230,204,151,.7)";
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      }
      requestAnimationFrame(draw);
    };
    resize(); draw();
    window.addEventListener("resize", resize);
    canvas.parentElement.addEventListener("pointermove", e => {
      const r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    });
    canvas.parentElement.addEventListener("pointerleave", () => { mouse.x = mouse.y = -9999; });
    new IntersectionObserver(([en]) => {
      const was = running; running = en.isIntersecting;
      if (running && !was) draw();
    }).observe(canvas);
  }

  /* ---------- Count-up for the 5+ years stat ---------- */
  document.querySelectorAll("[data-count]").forEach(el => {
    const end = +el.dataset.count;
    if (reduced || end > 100) return;
    el.textContent = "0";
    const start = () => {
      const t0 = performance.now(), dur = 1600;
      const step = now => {
        const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 4);
        el.textContent = Math.round(end * e);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    setTimeout(start, 1700);
  });

  /* ---------- Live GitHub projects ---------- */
  const repoBox = document.getElementById("repos");
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pretty = n => n.replace(/[-_]+/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  // GitHub allows 60 API calls an hour per IP address, which a shared office or college network
  // can use up. So: reuse a copy saved in this browser for an hour, fall back to an older saved copy,
  // and finally to the built-in list below, so the projects always show.
  const CACHE_KEY = "gh-repos-v1", CACHE_MS = 60 * 60 * 1000;
  const FALLBACK = [
    { name: "SlideRelay", html_url: "https://github.com/mk-manishkandel/SlideRelay", language: "Rust", pushed_at: "2026-11-08T10:37:11Z",
      description: "Show your live PowerPoint slideshow on everyone's phone over local Wi-Fi. Viewers scan a QR code, nothing to install. Free, open source, no cloud, no telemetry. Windows & macOS." },
    { name: "Paisa-Aayo", html_url: "https://github.com/mk-manishkandel/Paisa-Aayo", language: "Kotlin", pushed_at: "2026-11-07T08:21:29Z",
      description: "पैसा आयो · Free, open-source payment speaker for Android. Announces eSewa, Khalti, Fonepay QR and bank SMS payments aloud in Nepali or English. No ads, no internet permission." },
    { name: "ScanToPrint", html_url: "https://github.com/mk-manishkandel/ScanToPrint", language: "Rust", pushed_at: "2026-11-04T12:25:44Z",
      description: "QR-code document printing for print shops. Customers scan, upload PDFs, photos or Office files from their phone, then send to the counter or print themselves. Runs on the shop's Windows PC, no cloud. Written in Rust." },
    { name: "EmbedDriveToWordpress", html_url: "https://github.com/mk-manishkandel/EmbedDriveToWordpress", language: "PHP", pushed_at: "2026-11-01T14:18:51Z",
      description: "Show Google Drive folders and files on your WordPress site. File browser, previews, search, ZIP downloads and multiple accounts. Open source, no licence keys or tracking." },
    { name: "MacClipboard", html_url: "https://github.com/mk-manishkandel/MacClipboard", language: "Swift", pushed_at: "2026-10-29T08:58:36Z",
      description: "Free, private clipboard manager for macOS. Encrypted local history, one-click paste, automatic updates. Fork of Maccy." }
  ];
  const readCache = () => { try { return JSON.parse(localStorage.getItem(CACHE_KEY)); } catch (e) { return null; } };
  const saved = readCache();
  const fresh = saved && Array.isArray(saved.repos) && Date.now() - saved.t < CACHE_MS;
  (fresh ? Promise.resolve(saved.repos)
    : fetch("https://api.github.com/users/mk-manishkandel/repos?sort=updated&per_page=30",
            { signal: typeof AbortSignal.timeout === "function" ? AbortSignal.timeout(6000) : undefined })
        .then(r => r.ok ? r.json() : Promise.reject(r.status))
        .then(repos => {
          if (!Array.isArray(repos)) throw new Error("bad response");
          const slim = repos.map(({ name, html_url, description, language, pushed_at, fork }) => ({ name, html_url, description, language, pushed_at, fork }));
          try { localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), repos: slim })); } catch (e) {}
          return slim;
        }))
    .catch(() => (saved && Array.isArray(saved.repos) ? saved.repos : FALLBACK))
    .then(repos => {
      const HIDE = ["mk-manishkandel", "manishkandel", "hack-your-tv", "pos-for-restaurant", "minisync", "trackyourmoney"]; // never shown (featured above)
      const FEATURE = [];                            // always shown
      const pool = repos.filter(r => r && typeof r.name === "string" && !r.fork && !HIDE.includes(r.name.toLowerCase()) && /^https:\/\/github\.com\//.test(r.html_url));
      const featured = pool.filter(r => FEATURE.includes(r.name.toLowerCase()));
      const rest = pool.filter(r => !FEATURE.includes(r.name.toLowerCase()));
      const list = featured.concat(rest).slice(0, 5)
        .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at));
      if (!list.length) return;
      const cards = list.map(r => `
        <a class="repo reveal" href="${esc(r.html_url)}" target="_blank" rel="noopener">
          <span class="repo__arrow" aria-hidden="true">↗</span>
          <span class="repo__name">${esc(pretty(r.name))}</span>
          <span class="repo__desc">${esc(r.description || "A project on GitHub.")}</span>
          <span class="repo__meta">
            ${r.language ? `<span class="lang">${esc(r.language)}</span>` : ""}
            <span>Updated ${new Date(r.pushed_at).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}</span>
          </span>
        </a>`).join("");
      repoBox.insertAdjacentHTML("afterbegin", cards);
      repoBox.querySelectorAll(".repo.reveal").forEach((el, i) => {
        el.style.setProperty("--d", (i * 0.08) + "s");
        requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("is-in")));
      });
    })
    .catch(() => { /* keep the GitHub link card */ });

  /* ---------- Year ---------- */
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
})();

/* ---------- Contact form (Web3Forms) ---------- */
(() => {
  const form = document.getElementById("contactForm");
  if (!form) return;
  const status = document.getElementById("cf-status");
  const btn = form.querySelector("button[type=submit]");
  const label = form.querySelector(".form__btn-label");
  const setStatus = (msg, kind) => { status.textContent = msg; status.className = "form__status" + (kind ? " is-" + kind : ""); };

  form.addEventListener("submit", async e => {
    e.preventDefault();
    if (form._honey.value) return; // bot
    let ok = true;
    ["name", "email", "message"].forEach(n => {
      const el = form.elements[n];
      const valid = el.value.trim() !== "" && (n !== "email" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim()));
      el.closest(".field").classList.toggle("is-invalid", !valid);
      if (!valid) ok = false;
    });
    if (!ok) { setStatus("Please fill in your name, a valid email and a message.", "err"); return; }

    btn.disabled = true; label.textContent = "Sending…"; setStatus("");
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 10000); // don't leave visitors waiting on a slow service
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        signal: ctrl.signal,
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: "6eef9a91-06c4-4272-acf2-367ab4557d1f", // public Web3Forms key: only delivers to hello@manishkandel.com.np
          subject: "New message from manishkandel.com.np: " + form.topic.value,
          from_name: "manishkandel.com.np",
          name: form.name.value.trim(),
          email: form.email.value.trim(),
          topic: form.topic.value,
          message: form.message.value.trim(),
          botcheck: ""
        })
      });
      clearTimeout(timer);
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false || data.success === "false") throw new Error(data.message || res.status);
      form.reset();
      setStatus("Thanks, your message was sent. I'll reply soon.", "ok");
    } catch (err) {
      // Service unreachable: hand the visitor's message to their email app so nothing is lost.
      const subject = "Website enquiry: " + form.topic.value;
      const body = form.message.value.trim() + "\n\n" + form.name.value.trim() + "\n" + form.email.value.trim();
      const href = "mailto:hello@manishkandel.com.np?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
      const link = document.createElement("a");
      link.href = href;
      link.textContent = "Send it with your email app instead →";
      status.className = "form__status is-err";
      status.replaceChildren("The form couldn't send just now. ", link, " (your message is filled in).");
    } finally {
      btn.disabled = false; label.textContent = "Send message";
    }
  });
})();
