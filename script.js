/* tonyshangar.com — Rev. D. Small, dependency-free progressive enhancement.
   Without JavaScript everything is visible and the marks are already drawn. */

(function () {
  'use strict';

  var d = document;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  /* 1. Quiet reveal — only for text blocks that start below the fold */
  if (!reduce && hasIO) {
    var blocks = d.querySelectorAll(
      '.case-title, .case-lead, .specs, .notes, .index-list, .brief-list, .about-lead, .cv, .contact-title'
    );
    var vh = window.innerHeight;
    var reveal = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        reveal.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    blocks.forEach(function (el) {
      if (el.getBoundingClientRect().top > vh) {
        el.classList.add('rv');
        reveal.observe(el);
      }
    });
  }

  /* 2. Hand-drawn marks draw themselves once they are in view */
  if (!reduce && hasIO) {
    var draw = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var path = e.target.querySelector('path');
        window.requestAnimationFrame(function () { path.style.strokeDashoffset = '0'; });
        draw.unobserve(e.target);
      });
    }, { threshold: 0.9 });
    d.querySelectorAll('.mark').forEach(function (mark) {
      var path = mark.querySelector('path');
      var len = Math.ceil(path.getTotalLength()) + 1;
      path.style.strokeDasharray = len + ' ' + len;
      path.style.strokeDashoffset = String(len);
      mark.getBoundingClientRect(); /* commit the hidden state before transitions switch on */
      mark.classList.add('is-armed');
      draw.observe(mark);
    });
  }

  /* 3. Header: out of the way when reading down, back when scrolling up */
  var head = d.querySelector('.site-head');
  if (head) {
    var lastY = window.scrollY;
    var queued = false;
    window.addEventListener('scroll', function () {
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(function () {
        var y = window.scrollY;
        head.classList.toggle('is-scrolled', y > 8);
        if (y > lastY + 6 && y > 240 && !head.contains(d.activeElement)) head.classList.add('is-hidden');
        else if (y < lastY - 6 || y <= 240) head.classList.remove('is-hidden');
        lastY = y;
        queued = false;
      });
    }, { passive: true });
    head.addEventListener('focusin', function () { head.classList.remove('is-hidden'); });
  }

  /* 4. Index: the preview slot follows whichever project you point at */
  var slot = d.querySelector('.index-preview');
  if (slot && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var imgs = slot.querySelectorAll('img');
    var front = 0;
    var current = imgs[0].getAttribute('src');
    var links = d.querySelectorAll('.index-list a[data-preview]');
    var warmed = false;

    var warm = function () {
      if (warmed) return;
      warmed = true;
      links.forEach(function (a) { new Image().src = a.getAttribute('data-preview'); });
    };
    var swap = function (back) {
      back.classList.add('on');
      imgs[front].classList.remove('on');
      front = 1 - front;
    };
    var show = function (src) {
      if (src === current) return;
      current = src;
      var back = imgs[1 - front];
      if (back.getAttribute('src') === src && back.complete) { swap(back); return; }
      back.onload = function () { if (current === src) swap(back); };
      back.src = src;
    };
    links.forEach(function (a) {
      var src = a.getAttribute('data-preview');
      a.addEventListener('pointerenter', function () { warm(); show(src); });
      a.addEventListener('focus', function () { show(src); });
    });
  }

  /* 5. Local time in Eindhoven */
  var clocks = d.querySelectorAll('[data-clock]');
  if (clocks.length && window.Intl) {
    var fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Amsterdam', hour: '2-digit', minute: '2-digit' });
    var tick = function () {
      var now = new Date();
      clocks.forEach(function (c) { c.textContent = fmt.format(now); });
    };
    tick();
    var loop = function () { tick(); setTimeout(loop, 60000 - (Date.now() % 60000)); };
    setTimeout(loop, 60000 - (Date.now() % 60000));
  }
})();
