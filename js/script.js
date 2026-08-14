/* ==========================================================================
   BADRC — SCRIPT.JS
   Single consolidated script for the whole site (all 17 pages share this
   one file). Organised into seven parts:
     1. NAV        — mobile menu toggle, dropdown handling, sticky header,
                     back-to-top (every page)
     2. REVEAL     — scroll-reveal animation, reduced-motion aware (every
                     page that uses [data-reveal] elements)
     3. FILTER     — search/filter engine for Panels, Rules, Publications,
                     News, Media Gallery, Careers and Search
     4. ACCORDION  — FAQ accordion pattern (Arbitration, Mediation, Policies)
     5. LANGUAGE SWITCHER — header language menu (every page). UI-only for
                     now: opens/closes and tracks the selected language, but
                     does not yet translate content — see CONTENT-GAPS.md.
     6. SEARCH PREFILL — prefills the Search page's own search box from the
                     ?q= URL parameter (e.g. when linked from 404.html)
     7. SLIDER      — generic prev/next scroll + mouse drag for
                     [data-slider] card rows (Home's News)
   The header notice ticker is hover-to-pause only (CSS, no JS) — see the
   note at the end of this file. The Home hero's background slideshow is
   CSS-only too (see css/style.css,
   .hero__slide) — no JS part for it; see the note at the end of this file.
   Each part is a self-contained IIFE, so they don't share state and can be
   read/edited independently.
   ========================================================================== */


/* ==========================================================================
   PART 1 — NAV
   Used on: every page (mobile menu, dropdowns, sticky header shadow,
   back-to-top button).
   ========================================================================== */
(function () {
  'use strict';

  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.primary-nav');
  var header = document.querySelector('.site-header');
  var headerBottom = document.querySelector('.header-bottom');

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var willOpen = !nav.classList.contains('is-open');

      // header-top is no longer sticky, so the mobile nav overlay's correct
      // top offset (the live bottom edge of the sticky header-bottom bar)
      // depends on scroll position — compute it fresh each time we open.
      if (willOpen && headerBottom) {
        nav.style.top = headerBottom.getBoundingClientRect().bottom + 'px';
      }

      nav.classList.toggle('is-open', willOpen);
      toggle.setAttribute('aria-expanded', String(willOpen));
      document.body.style.overflow = willOpen ? 'hidden' : '';
    });

    // Close mobile nav on Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
        toggle.focus();
      }
    });
  }

  // Touch/click-friendly dropdown expansion on mobile (mirrors :hover on desktop)
  var dropdownParents = document.querySelectorAll('.has-dropdown > .primary-nav__link');
  dropdownParents.forEach(function (link) {
    link.addEventListener('click', function (e) {
      if (window.innerWidth > 1024) return; // desktop uses hover
      var parent = link.parentElement;
      var isExpanded = parent.classList.contains('is-expanded');
      if (!isExpanded) {
        e.preventDefault();
        document.querySelectorAll('.has-dropdown.is-expanded').forEach(function (el) {
          if (el !== parent) el.classList.remove('is-expanded');
        });
        parent.classList.add('is-expanded');
        link.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // Sticky header shadow on scroll
  if (header) {
    var lastState = false;
    window.addEventListener('scroll', function () {
      var scrolled = window.scrollY > 8;
      if (scrolled !== lastState) {
        header.classList.toggle('is-scrolled', scrolled);
        lastState = scrolled;
      }
    }, { passive: true });
  }

  // Back-to-top button
  var backToTop = document.querySelector('.back-to-top');
  if (backToTop) {
    window.addEventListener('scroll', function () {
      backToTop.classList.toggle('is-visible', window.scrollY > 600);
    }, { passive: true });
    backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    });
  }
})();


/* ==========================================================================
   PART 2 — REVEAL
   Used on: every page with [data-reveal] elements (Home, About, Arbitration,
   Mediation, etc.). Lightweight scroll-reveal using IntersectionObserver.
   Fully respects prefers-reduced-motion: when set, all [data-reveal]
   elements are made visible immediately and no observer is created.
   ========================================================================== */
(function () {
  'use strict';

  var elements = document.querySelectorAll('[data-reveal]');
  if (!elements.length) return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduceMotion || !('IntersectionObserver' in window)) {
    elements.forEach(function (el) { el.classList.add('is-visible'); });
    return;
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  elements.forEach(function (el) { observer.observe(el); });
})();


/* ==========================================================================
   PART 3 — FILTER
   Used on: Panels & Professionals, Rules & Legislation, Publications &
   Resources, News & Events, Media & Gallery, Careers & Procurement, Search.
   One reusable client-side filter/search engine, driven entirely by data
   attributes.
   Markup contract:
     <div data-filter-bar data-filter-target="#results">
       <input type="search" data-filter-search>
       <select data-filter-select data-filter-key="category">...</select>
       <button data-filter-chip data-filter-key="category" data-filter-value="rules" aria-pressed="false">...</button>
     </div>
     <div id="results">
       <div data-filter-item data-category="rules" data-search="title text ...">...</div>
     </div>
     <p data-filter-empty hidden>No results found.</p>
     <p data-filter-count></p>
   This is a UI-layer engine only — on a future backend it should be swapped
   for a real search index without changing the markup contract.
   ========================================================================== */
(function () {
  'use strict';

  function normalise(str) {
    return (str || '').toLowerCase().trim();
  }

  function initFilterBar(bar) {
    var targetSelector = bar.getAttribute('data-filter-target');
    var target = targetSelector ? document.querySelector(targetSelector) : null;
    if (!target) return;

    var items = Array.prototype.slice.call(target.querySelectorAll('[data-filter-item]'));
    var emptyState = document.querySelector(bar.getAttribute('data-filter-empty-target') || '[data-filter-empty]');
    var countEl = document.querySelector(bar.getAttribute('data-filter-count-target') || '[data-filter-count]');
    var searchInput = bar.querySelector('[data-filter-search]');
    var selects = Array.prototype.slice.call(bar.querySelectorAll('[data-filter-select]'));
    var chips = Array.prototype.slice.call(bar.querySelectorAll('[data-filter-chip]'));

    var state = { search: '', selects: {}, chips: {} };

    function apply() {
      var visibleCount = 0;
      items.forEach(function (item) {
        var matches = true;

        if (state.search) {
          var haystack = normalise(item.getAttribute('data-search') || item.textContent);
          if (haystack.indexOf(state.search) === -1) matches = false;
        }

        Object.keys(state.selects).forEach(function (key) {
          var val = state.selects[key];
          if (val && val !== 'all') {
            var itemVal = normalise(item.getAttribute('data-' + key));
            if (itemVal !== normalise(val)) matches = false;
          }
        });

        Object.keys(state.chips).forEach(function (key) {
          var activeValues = state.chips[key];
          if (activeValues && activeValues.length) {
            var itemVal = normalise(item.getAttribute('data-' + key));
            if (activeValues.indexOf(itemVal) === -1) matches = false;
          }
        });

        item.hidden = !matches;
        if (matches) visibleCount++;
      });

      if (emptyState) emptyState.hidden = visibleCount !== 0;
      if (countEl) countEl.textContent = visibleCount + (visibleCount === 1 ? ' result' : ' results');
    }

    if (searchInput) {
      searchInput.addEventListener('input', function () {
        state.search = normalise(searchInput.value);
        apply();
      });
    }

    selects.forEach(function (select) {
      var key = select.getAttribute('data-filter-key');
      select.addEventListener('change', function () {
        state.selects[key] = select.value;
        apply();
      });
    });

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var key = chip.getAttribute('data-filter-key');
        var value = normalise(chip.getAttribute('data-filter-value'));
        var pressed = chip.getAttribute('aria-pressed') === 'true';
        chip.setAttribute('aria-pressed', String(!pressed));

        state.chips[key] = state.chips[key] || [];
        if (!pressed) {
          state.chips[key].push(value);
        } else {
          state.chips[key] = state.chips[key].filter(function (v) { return v !== value; });
        }
        apply();
      });
    });

    apply();

    // Expose apply/state on the bar element so Part 5 (header search) can
    // re-run filtering after programmatically setting the search input.
    bar.__badrcFilterApply = apply;
    bar.__badrcFilterState = state;
  }

  document.querySelectorAll('[data-filter-bar]').forEach(initFilterBar);
})();


/* ==========================================================================
   PART 4 — ACCORDION
   Used on: Arbitration FAQ, Mediation FAQ, Policies & Legal Notices.
   Accessible accordion pattern using aria-expanded / aria-hidden and the
   max-height transition defined in css/style.css. Multiple accordions per
   page are supported; each accordion allows only one open panel at a time
   by default unless data-accordion-multi is present on the root.
   ========================================================================== */
(function () {
  'use strict';

  document.querySelectorAll('.accordion').forEach(function (accordion) {
    var allowMultiple = accordion.hasAttribute('data-accordion-multi');
    var triggers = Array.prototype.slice.call(accordion.querySelectorAll('.accordion__trigger'));

    triggers.forEach(function (trigger) {
      var panel = document.getElementById(trigger.getAttribute('aria-controls'));
      if (!panel) return;

      trigger.addEventListener('click', function () {
        var isOpen = trigger.getAttribute('aria-expanded') === 'true';

        if (!allowMultiple) {
          triggers.forEach(function (other) {
            if (other === trigger) return;
            var otherPanel = document.getElementById(other.getAttribute('aria-controls'));
            other.setAttribute('aria-expanded', 'false');
            if (otherPanel) {
              otherPanel.style.maxHeight = null;
              otherPanel.setAttribute('aria-hidden', 'true');
            }
          });
        }

        trigger.setAttribute('aria-expanded', String(!isOpen));
        panel.setAttribute('aria-hidden', String(isOpen));
        panel.style.maxHeight = isOpen ? null : panel.scrollHeight + 'px';
      });
    });

    // Open the first item by default for immediate content visibility
    if (triggers.length && accordion.hasAttribute('data-accordion-open-first')) {
      triggers[0].click();
    }
  });
})();


/* ==========================================================================
   PART 5 — LANGUAGE SWITCHER
   Used on: every page (header). Accessible toggle-button + menu pattern —
   the same shape as the mega-menu dropdowns, but for language selection.
   Selecting a language updates the toggle's label and the active checkmark;
   it does not yet translate page content (English is the only language
   with real content today — see CONTENT-GAPS.md for the Dzongkha rollout
   this markup/JS is structured to support without a rebuild).
   ========================================================================== */
(function () {
  'use strict';

  var switcher = document.querySelector('.lang-switcher');
  if (!switcher) return;

  var toggle = switcher.querySelector('.lang-switcher__toggle');
  var menu = switcher.querySelector('.lang-switcher__menu');
  var label = switcher.querySelector('.lang-switcher__label');
  var options = Array.prototype.slice.call(switcher.querySelectorAll('.lang-switcher__option'));
  if (!toggle || !menu) return;

  function closeMenu() {
    menu.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
  }

  function openMenu() {
    menu.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
  }

  toggle.addEventListener('click', function () {
    if (menu.hidden) { openMenu(); } else { closeMenu(); }
  });

  document.addEventListener('click', function (e) {
    if (!switcher.contains(e.target)) closeMenu();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !menu.hidden) {
      closeMenu();
      toggle.focus();
    }
  });

  options.forEach(function (option) {
    option.addEventListener('click', function () {
      if (option.hasAttribute('disabled')) return;

      options.forEach(function (o) { o.setAttribute('aria-current', 'false'); });
      option.setAttribute('aria-current', 'true');
      if (label) label.textContent = option.getAttribute('data-lang-code') || option.textContent.trim();
      closeMenu();
    });
  });
})();


/* ==========================================================================
   PART 6 — SEARCH PREFILL
   Used on: search.html, which reads the "q" query parameter back out on
   load (e.g. when linked from 404.html's own search box) and prefills/
   reruns the filter defined in Part 3.
   ========================================================================== */
(function () {
  'use strict';

  var params = new URLSearchParams(window.location.search);
  var q = params.get('q');
  if (!q) return;

  var input = document.getElementById('site-search');
  if (!input) return;

  input.value = q;
  input.dispatchEvent(new Event('input', { bubbles: true }));
})();


/* A hero background-slider JS part was retired earlier: the Home hero's
   background cycle is driven entirely by CSS (see .hero__slide /
   @keyframes hero-slide-cycle in css/style.css) using staggered
   animation-delay per slide instead of a JS setInterval swapping an
   .is-active class. That JS-driven swap was the cause of a visible
   "stop, then jump" between slides — removing a class mid-transition
   snapped the transform back to its base value instantly. The pure-CSS
   version keeps fade and zoom continuously in motion and respects
   prefers-reduced-motion on its own, so no script is needed for it. */


/* ==========================================================================
   PART 7 — SLIDER
   Used on: Home's News card row ([data-slider]). Two things:
     - prev/next buttons that advance by roughly one card's width, and
       disable themselves at either end of the track
     - click-and-drag scrolling with a mouse (native overflow-x already
       covers touch/trackpad; a mouse has no native way to drag-scroll a
       horizontal region, so this adds that interaction via Pointer Events)
   ========================================================================== */
(function () {
  'use strict';

  document.querySelectorAll('[data-slider]').forEach(function (slider) {
    var track = slider.querySelector('[data-slider-track]');
    var prevBtn = slider.querySelector('[data-slider-prev]');
    var nextBtn = slider.querySelector('[data-slider-next]');
    if (!track) return;

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function step() {
      var firstCard = track.firstElementChild;
      var cardWidth = firstCard ? firstCard.getBoundingClientRect().width : track.clientWidth;
      var gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || '0');
      return cardWidth + gap;
    }

    function updateButtons() {
      var maxScroll = track.scrollWidth - track.clientWidth - 1;
      if (prevBtn) prevBtn.disabled = track.scrollLeft <= 0;
      if (nextBtn) nextBtn.disabled = track.scrollLeft >= maxScroll;
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        track.scrollBy({ left: -step(), behavior: reduceMotion ? 'auto' : 'smooth' });
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        track.scrollBy({ left: step(), behavior: reduceMotion ? 'auto' : 'smooth' });
      });
    }

    track.addEventListener('scroll', updateButtons, { passive: true });
    updateButtons();

    // Mouse drag-to-scroll
    var isDragging = false;
    var dragMoved = false;
    var startX = 0;
    var startScrollLeft = 0;

    track.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse') return; // touch/pen already drag natively
      isDragging = true;
      dragMoved = false;
      startX = e.clientX;
      startScrollLeft = track.scrollLeft;
      track.classList.add('is-dragging');
      track.setPointerCapture(e.pointerId);
      // Stops the browser's native "drag this link" gesture from starting
      // and fighting the custom scroll drag below.
      e.preventDefault();
    });

    track.addEventListener('pointermove', function (e) {
      if (!isDragging) return;
      var delta = e.clientX - startX;
      if (Math.abs(delta) > 4) dragMoved = true;
      track.scrollLeft = startScrollLeft - delta;
    });

    function endDrag() {
      isDragging = false;
      track.classList.remove('is-dragging');
    }
    track.addEventListener('pointerup', endDrag);
    track.addEventListener('pointercancel', endDrag);

    // Dragging a card shouldn't also follow its link
    track.addEventListener('click', function (e) {
      if (dragMoved) {
        e.preventDefault();
        e.stopPropagation();
        dragMoved = false;
      }
    }, true);
  });
})();


/* The header ticker (.header-ticker__track) is intentionally hover-to-pause
   only — see the :hover / :focus-within rule in css/style.css. A mouse-drag
   interaction was tried here and removed again: it's not needed for a
   passive notice strip, and pausing on hover already lets a visitor read
   or click a notice without it sliding away. */
