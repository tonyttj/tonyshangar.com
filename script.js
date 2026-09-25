/* Tony’s Hangar — interactions. Vanilla JS, no dependencies.
   Everything degrades gracefully: without JS the page is fully readable,
   the story renders as a static two-photo sequence and the departures
   board shows plain text. The hangar doors are pure CSS (see the inline
   script in <head>); this file only remembers that they have opened. */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* the doors play once per visit */
  try { sessionStorage.setItem('hangarOpen', '1'); } catch (e) {}

  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  /* progress 0→1 across [a, b] */
  function ramp(p, a, b) { return clamp((p - a) / (b - a), 0, 1); }

  /* ---------- reveal on scroll ---------- */
  (function () {
    var items = document.querySelectorAll('.reveal');
    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '1000% 0px -8% 0px' });
    items.forEach(function (el) { io.observe(el); });
  })();

  /* ---------- nav: taxi-line progress + active bay ---------- */
  (function () {
    var nav = document.querySelector('.nav');
    if (!nav) return;
    var line = nav.querySelector('.taxi-line');
    var plane = nav.querySelector('.taxi-plane');
    var linkBox = nav.querySelector('.nav-links');
    var links = [].slice.call(linkBox.querySelectorAll('a'));
    var sections = links.map(function (a) {
      return document.getElementById(a.getAttribute('href').slice(1));
    });
    var active = null;
    var queued = false;

    function setActive(a) {
      if (a === active) return;
      if (active) { active.classList.remove('active'); active.removeAttribute('aria-current'); }
      active = a;
      if (!a) return;
      a.classList.add('active');
      a.setAttribute('aria-current', 'location');
      /* keep the active sign in view when the link row scrolls (phones) */
      var box = linkBox.getBoundingClientRect();
      var r = a.getBoundingClientRect();
      if (r.left < box.left + 8 || r.right > box.right - 8) {
        linkBox.scrollBy({ left: r.left - box.left - 24, behavior: reduceMotion ? 'auto' : 'smooth' });
      }
    }

    /* phone menu */
    var toggle = nav.querySelector('.nav-toggle');
    function setOpen(open) {
      nav.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.querySelector('.nt-label').textContent = open ? 'Close' : 'Menu';
    }
    if (toggle) {
      toggle.addEventListener('click', function () { setOpen(!nav.classList.contains('open')); });
      links.forEach(function (a) { a.addEventListener('click', function () { setOpen(false); }); });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && nav.classList.contains('open')) { setOpen(false); toggle.focus(); }
      });
      document.addEventListener('click', function (e) {
        if (nav.classList.contains('open') && !nav.contains(e.target)) setOpen(false);
      });
    }

    function update() {
      queued = false;
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var p = max > 0 ? clamp(window.scrollY / max, 0, 1) : 0;
      line.style.transform = 'scaleX(' + p + ')';
      plane.style.transform = 'translateX(' + p * (nav.clientWidth - 18) + 'px)';

      var probe = window.innerHeight * 0.42;
      var hit = null;
      sections.forEach(function (s, i) {
        if (!s) return;
        var r = s.getBoundingClientRect();
        if (r.top <= probe && r.bottom > probe) hit = links[i];
      });
      if (p > 0.995) hit = links[links.length - 1];
      setActive(hit);
    }

    function queue() {
      if (!queued) { queued = true; window.requestAnimationFrame(update); }
    }
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
    update();
  })();

  /* ---------- pinned story: my build → TU/e tunnel ---------- */
  (function () {
    var story = document.querySelector('.story');
    if (!story) return;
    if (reduceMotion) { story.classList.add('static'); return; }

    var imgA = story.querySelector('.img-diy');
    var imgB = story.querySelector('.img-tue');
    var capA = story.querySelector('.cap-a');
    var capB = story.querySelector('.cap-b');
    var queued = false;

    function update() {
      queued = false;
      var rect = story.getBoundingClientRect();
      var vh = window.innerHeight;
      var total = rect.height - vh;
      if (total <= 0) return;
      var p = clamp(-rect.top / total, 0, 1);

      /* crossfade window ~ middle of the scroll */
      var x = ramp(p, 0.38, 0.58);
      imgA.style.opacity = String(1 - x);
      imgB.style.opacity = String(x);
      /* continuous forward motion: fly toward the DIY fan, then on into the TU/e tunnel */
      imgA.style.transform = 'scale(' + (1 + 0.18 * ramp(p, 0, 0.58)) + ')';
      imgB.style.transform = 'scale(' + (1 + 0.15 * ramp(p, 0.38, 1)) + ')';

      /* captions: A in early, out before the fade; B in after, hold to the end */
      var aIn = ramp(p, 0.03, 0.13), aOut = 1 - ramp(p, 0.30, 0.40);
      var bIn = ramp(p, 0.62, 0.74), bOut = 1 - ramp(p, 0.96, 1);
      capA.style.opacity = String(Math.min(aIn, aOut));
      capA.style.transform = 'translateY(' + (1 - aIn) * 26 + 'px)';
      capB.style.opacity = String(Math.min(bIn, bOut));
      capB.style.transform = 'translateY(' + (1 - bIn) * 26 + 'px)';
    }

    function queue() {
      if (!queued) { queued = true; window.requestAnimationFrame(update); }
    }
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
    update();
  })();

  /* ---------- split-flap departures board ---------- */
  (function () {
    var board = document.querySelector('.board');
    if (!board) return;
    var CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    var NBSP = ' ';
    var tiles = [];

    board.querySelectorAll('.flaps').forEach(function (field) {
      var text = field.textContent.trim();
      var width = parseInt(field.getAttribute('data-width'), 10) || text.length;
      field.textContent = '';
      for (var i = 0; i < width; i++) {
        var ch = text.charAt(i) || ' ';
        var tile = document.createElement('span');
        tile.className = 'flap';
        tile.textContent = ch === ' ' ? NBSP : ch;
        field.appendChild(tile);
        tiles.push({ el: tile, ch: ch });
      }
    });

    if (reduceMotion || !('IntersectionObserver' in window)) return;

    tiles.forEach(function (t) { t.el.textContent = NBSP; });

    function flip(t, delay) {
      var flips = t.ch === ' ' ? 0 : 6 + Math.floor(Math.random() * 10);
      var n = 0;
      setTimeout(function step() {
        if (n < flips) {
          t.el.textContent = CHARS.charAt(Math.floor(Math.random() * CHARS.length));
          t.el.classList.remove('tick');
          void t.el.offsetWidth; /* restart the tick animation */
          t.el.classList.add('tick');
          n++;
          setTimeout(step, 55);
        } else {
          t.el.textContent = t.ch === ' ' ? NBSP : t.ch;
        }
      }, delay);
    }

    var io = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      tiles.forEach(function (t, i) { flip(t, 250 + i * 32); });
    }, { threshold: 0.6 });
    io.observe(board);
  })();
})();
