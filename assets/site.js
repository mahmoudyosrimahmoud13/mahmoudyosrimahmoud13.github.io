// Blueprint site: theme, exploded hero, tilting screenshots, drawn notes, lightbox. No libraries.
(function () {
  var root = document.documentElement;
  try { var saved = localStorage.getItem("theme"); if (saved) root.setAttribute("data-theme", saved); } catch (e) {}
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia && window.matchMedia("(pointer: fine)").matches;

  document.addEventListener("DOMContentLoaded", function () {
    // Theme: blueprint (default) or whiteprint
    var btn = document.querySelector("[data-theme-toggle]");
    function label() {
      if (!btn) return;
      var light = root.getAttribute("data-theme") === "light";
      btn.querySelector("span").textContent = light ? "Blueprint" : "Whiteprint";
      btn.setAttribute("aria-label", light ? "Switch to the blue blueprint theme" : "Switch to the white theme");
    }
    if (btn) {
      label();
      btn.addEventListener("click", function () {
        var next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
        root.setAttribute("data-theme", next);
        try { localStorage.setItem("theme", next); } catch (e) {}
        label();
      });
    }

    // Hero: exploded view
    var hero = document.querySelector(".exploded");
    if (hero) {
      var stack = hero.querySelector(".stack");
      var svg = hero.querySelector(".leaders");
      var callouts = hero.querySelectorAll(".callout[data-target]");
      var coords = document.querySelector(".coords");
      function drawLeaders() {
        var box = hero.getBoundingClientRect();
        var out = "";
        callouts.forEach(function (c) {
          var layer = hero.querySelector(c.getAttribute("data-target"));
          if (!layer) return;
          var cr = c.getBoundingClientRect(), lr = layer.getBoundingClientRect();
          var right = c.classList.contains("c2");
          var x1 = (right ? cr.left - 8 : cr.right + 8) - box.left;
          var y1 = cr.top + Math.min(18, cr.height / 2) - box.top;
          var fx = parseFloat(c.getAttribute("data-fx") || "0.5"), fy = parseFloat(c.getAttribute("data-fy") || "0.5");
          var x2 = lr.left + lr.width * fx - box.left;
          var y2 = lr.top + lr.height * fy - box.top;
          var mx = (x1 + x2) / 2;
          out += '<path d="M' + x1 + "," + y1 + " C" + mx + "," + y1 + " " + mx + "," + y2 + " " + x2 + "," + y2 + '"/>' +
                 '<circle cx="' + x2 + '" cy="' + y2 + '" r="4"/>';
        });
        svg.innerHTML = out;
      }
      requestAnimationFrame(function () {
        drawLeaders();
        setTimeout(function () { hero.classList.remove("loading"); }, 120);
        setTimeout(drawLeaders, 1300);
      });
      window.addEventListener("resize", drawLeaders);
      if (fine && !reduce) {
        var area = document.querySelector(".hero");
        var raf = 0;
        area.addEventListener("pointermove", function (e) {
          var r = hero.getBoundingClientRect();
          var px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
          stack.style.setProperty("--rz", (-38 + px * 16) + "deg");
          stack.style.setProperty("--rx", (52 - py * 14) + "deg");
          if (coords) coords.textContent = "x " + String(Math.round(e.clientX)).padStart(4, "0") + "   y " + String(Math.round(e.clientY)).padStart(4, "0");
          cancelAnimationFrame(raf);
          raf = requestAnimationFrame(function () { setTimeout(drawLeaders, 260); });
        });
        area.addEventListener("pointerleave", function () {
          stack.style.removeProperty("--rz"); stack.style.removeProperty("--rx");
          setTimeout(drawLeaders, 300);
        });
      }
    }

    // Screenshots that tilt toward the pointer
    if (fine && !reduce) {
      document.querySelectorAll(".rig").forEach(function (rig) {
        var t = rig.querySelector(".tilt");
        rig.addEventListener("pointermove", function (e) {
          var r = rig.getBoundingClientRect();
          var px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
          t.style.transform = "rotateY(" + (px * 9) + "deg) rotateX(" + (-py * 7) + "deg)";
        });
        rig.addEventListener("pointerleave", function () { t.style.transform = ""; });
      });
    }

    // Handwritten notes draw themselves when their screenshot comes into view
    var rigs = document.querySelectorAll(".rig");
    if ("IntersectionObserver" in window && !reduce) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("drawn"); io.unobserve(en.target); } });
      }, { threshold: 0.2 });
      rigs.forEach(function (r) { io.observe(r); });
    } else { rigs.forEach(function (r) { r.classList.add("drawn"); }); }

    // Lightbox for every screenshot
    var imgs = Array.prototype.slice.call(document.querySelectorAll(".shot img, .cover img"));
    if (imgs.length) {
      var box = document.createElement("div");
      box.className = "lightbox";
      box.setAttribute("role", "dialog");
      box.setAttribute("aria-modal", "true");
      box.innerHTML = '<img alt="">' +
        '<button class="lb-close" aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
        '<button class="lb-prev" aria-label="Previous"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 6l-6 6 6 6"/></svg></button>' +
        '<button class="lb-next" aria-label="Next"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg></button>' +
        '<div class="lb-cap"></div>';
      document.body.appendChild(box);
      var big = box.querySelector("img"), cap = box.querySelector(".lb-cap"), i = 0;
      function show(n) {
        i = (n + imgs.length) % imgs.length;
        var src = imgs[i];
        big.src = src.currentSrc || src.src; big.alt = src.alt;
        var fig = src.closest("figure"), fc = fig && fig.querySelector("figcaption");
        cap.textContent = fc ? fc.textContent : src.alt;
        box.classList.toggle("tall", src.naturalHeight > src.naturalWidth * 1.8 && src.naturalWidth > 1000);
        box.scrollTop = 0;
      }
      function open(n) { show(n); box.classList.add("open"); document.body.style.overflow = "hidden"; box.querySelector(".lb-close").focus(); }
      function close() { box.classList.remove("open"); document.body.style.overflow = ""; if (imgs[i].focus) imgs[i].focus(); }
      imgs.forEach(function (im, n) {
        im.tabIndex = 0;
        im.addEventListener("click", function () { open(n); });
        im.addEventListener("keydown", function (e) { if (e.key === "Enter") open(n); });
      });
      box.querySelector(".lb-close").addEventListener("click", close);
      box.querySelector(".lb-prev").addEventListener("click", function () { show(i - 1); });
      box.querySelector(".lb-next").addEventListener("click", function () { show(i + 1); });
      box.addEventListener("click", function (e) { if (e.target === box) close(); });
      document.addEventListener("keydown", function (e) {
        if (!box.classList.contains("open")) return;
        if (e.key === "Escape") close();
        if (e.key === "ArrowLeft") show(i - 1);
        if (e.key === "ArrowRight") show(i + 1);
      });
    }
  });
})();
