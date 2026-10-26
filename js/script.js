/* ==========================================================================
   BADRC — SCRIPT.JS
   Single consolidated script for the whole site (all 17 pages share this
   one file). Organised into seven parts:
     1. NAV        — mobile menu toggle, dropdown handling, sticky header,
                     the floating Portal button (every page)
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
     8. SIDE NAV    — collapses Home's fixed side rails to icon-only once
                     the hero is scrolled past (css/side-nav.css already
                     does this by viewport width; this adds it by scroll
                     position too, at any width)
   The header notice ticker is hover-to-pause only (CSS, no JS) — see the
   note at the end of this file. The Home hero's background video is
   CSS-only too (see css/style.css,
   .hero__video-bg) — no JS part for it; see the note at the end of this file.
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

      if (willOpen) {
        // The overlay is only ever hidden (opacity/visibility), never
        // removed, so it keeps its scroll position between opens — if a
        // visitor had scrolled down to reach a later link (or expanded a
        // dropdown, pushing everything below it further down) the panel
        // could reopen already scrolled past "Home" at the top. Reset
        // both every time it's opened so it always starts from the top.
        nav.scrollTop = 0;
        document.querySelectorAll('.has-dropdown.is-expanded').forEach(function (el) {
          el.classList.remove('is-expanded');
          var link = el.querySelector(':scope > .primary-nav__link');
          if (link) link.setAttribute('aria-expanded', 'false');
        });
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

  // Floating Portal button — a plain link (no click handler needed), just
  // shown/hidden the same way the old back-to-top button was: appears once
  // the visitor has scrolled past the fold.
  var portalButton = document.querySelector('.back-to-top');
  if (portalButton) {
    window.addEventListener('scroll', function () {
      portalButton.classList.toggle('is-visible', window.scrollY > 600);
    }, { passive: true });
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

  // Human labels for a chip group's data-filter-key, shown above the chip
  // row (e.g. "expertise" → "Practice Area"). Falls back to a capitalised
  // version of the key itself for any group not listed here.
  var CHIP_GROUP_LABELS = {
    expertise: 'Practice Area',
    status: 'Status',
    type: 'Content Type',
    category: 'Category'
  };
  function chipGroupLabel(key) {
    if (CHIP_GROUP_LABELS[key]) return CHIP_GROUP_LABELS[key];
    return key.charAt(0).toUpperCase() + key.slice(1).replace(/-/g, ' ');
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
    var chipsRow = bar.querySelector('.filter-bar__chips');

    var state = { search: '', selects: {}, chips: {} };

    // Whether a single item matches the current state, optionally ignoring
    // one select's own key — used both by apply() (all filters) and by the
    // custom dropdown (Part 3b) to count how many results each option in a
    // select would leave, holding every *other* active filter constant.
    function itemMatches(item, excludeSelectKey) {
      if (state.search) {
        var haystack = normalise(item.getAttribute('data-search') || item.textContent);
        if (haystack.indexOf(state.search) === -1) return false;
      }

      var selectMatch = true;
      Object.keys(state.selects).forEach(function (key) {
        if (key === excludeSelectKey) return;
        var val = state.selects[key];
        if (val && val !== 'all') {
          // data-* may hold several space-separated values (e.g. a person's languages)
          var itemVals = normalise(item.getAttribute('data-' + key)).split(/\s+/);
          if (itemVals.indexOf(normalise(val)) === -1) selectMatch = false;
        }
      });
      if (!selectMatch) return false;

      var chipMatch = true;
      Object.keys(state.chips).forEach(function (key) {
        var activeValues = state.chips[key];
        if (activeValues && activeValues.length) {
          var itemVal = normalise(item.getAttribute('data-' + key));
          if (activeValues.indexOf(itemVal) === -1) chipMatch = false;
        }
      });
      return chipMatch;
    }

    // Recount how many results each option of each enhanced select would
    // leave (see enhanceSelect below), given every other active filter.
    var selectCountUpdaters = [];
    function updateSelectCounts() {
      selectCountUpdaters.forEach(function (fn) { fn(); });
    }

    // Active select/chip filters (not the free-text search — that has its
    // own clear button in the field) as {label, remove()} pairs — used only
    // to drive "Clear all filters" (its visibility and what it resets).
    function activeFilters() {
      var out = [];
      selects.forEach(function (select) {
        var key = select.getAttribute('data-filter-key');
        var defaultValue = select.options.length ? select.options[0].value : 'all';
        if (state.selects[key] && state.selects[key] !== defaultValue) {
          var opt = select.options[select.selectedIndex];
          out.push({
            label: opt ? opt.textContent : state.selects[key],
            remove: function () {
              select.value = defaultValue;
              select.dispatchEvent(new Event('change', { bubbles: true }));
            }
          });
        }
      });
      chips.forEach(function (chip) {
        if (chip.getAttribute('aria-pressed') === 'true') {
          out.push({ label: chip.textContent.trim(), remove: function () { chip.click(); } });
        }
      });
      return out;
    }

    var clearAllBtn = null;
    if (chipsRow && (selects.length || chips.length)) {
      clearAllBtn = document.createElement('button');
      clearAllBtn.type = 'button';
      clearAllBtn.className = 'filter-clear-all';
      clearAllBtn.textContent = 'Clear all filters';
      clearAllBtn.addEventListener('click', function () {
        activeFilters().forEach(function (f) { f.remove(); });
      });
      chipsRow.appendChild(clearAllBtn);
    }

    var renderRecs = null;

    function apply() {
      var visibleCount = 0;
      items.forEach(function (item) {
        var matches = itemMatches(item, null);
        item.hidden = !matches;
        if (matches) visibleCount++;
      });

      if (emptyState) emptyState.hidden = visibleCount !== 0;
      if (countEl) countEl.textContent = visibleCount + (visibleCount === 1 ? ' result' : ' results');
      if (clearAllBtn) clearAllBtn.hidden = activeFilters().length === 0;
      if (renderRecs) renderRecs(visibleCount);

      updateSelectCounts();
    }

    if (searchInput) {
      var searchWrap = searchInput.closest('.filter-bar__search');
      var searchClearBtn = document.createElement('button');
      searchClearBtn.type = 'button';
      searchClearBtn.className = 'filter-search-clear';
      searchClearBtn.setAttribute('aria-label', 'Clear search');
      searchClearBtn.hidden = true;
      searchClearBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>';
      if (searchWrap) searchWrap.appendChild(searchClearBtn);

      searchInput.addEventListener('input', function () {
        state.search = normalise(searchInput.value);
        searchClearBtn.hidden = !searchInput.value;
        apply();
      });
      searchClearBtn.addEventListener('click', function () {
        searchInput.value = '';
        state.search = '';
        searchClearBtn.hidden = true;
        searchInput.focus();
        apply();
      });

      // Purely a familiar affordance next to the dropdown pills — the
      // search already runs live on input, so this just re-applies (and,
      // on narrow layouts where the field may have lost focus, moves it
      // back there) rather than submitting anything.
      var searchBtn = document.createElement('button');
      searchBtn.type = 'button';
      searchBtn.className = 'filter-search-btn';
      searchBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/><path d="M21 21l-4.3-4.3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><span>Search</span>';
      searchBtn.addEventListener('click', function () {
        apply();
        searchInput.focus();
      });
      // Joined to the field as one control: [ icon | input | clear | Search ].
      if (searchWrap) searchWrap.appendChild(searchBtn); else bar.insertBefore(searchBtn, chipsRow || null);

      // Opt-in (data-filter-suggest on the bar): a suggestion dropdown under
      // the search field while typing, and "did you mean" / popular-search
      // recommendations in the empty state when nothing matches.
      if (bar.hasAttribute('data-filter-suggest') && searchWrap) {
        var sugList = document.createElement('ul');
        sugList.className = 'filter-suggest';
        sugList.id = 'filter-suggest-' + Math.random().toString(36).slice(2, 8);
        sugList.setAttribute('role', 'listbox');
        sugList.hidden = true;
        searchWrap.appendChild(sugList);
        searchInput.setAttribute('role', 'combobox');
        searchInput.setAttribute('aria-autocomplete', 'list');
        searchInput.setAttribute('aria-expanded', 'false');
        searchInput.setAttribute('aria-controls', sugList.id);
        searchInput.setAttribute('autocomplete', 'off');

        var titleOf = function (item) {
          var t = item.querySelector('.pro-card__name, h3, h2');
          return t ? t.textContent.trim() : '';
        };
        var subOf = function (item) {
          var r = item.querySelector('.pro-card__meta');
          var first = r ? r.innerHTML.split(/<br\s*\/?>/i)[0] : '';
          var tmp = document.createElement('span');
          tmp.innerHTML = first;
          return tmp.textContent.trim();
        };
        var cap = function (w) { return w.charAt(0).toUpperCase() + w.slice(1); };

        // Distinct expertise terms with how many items carry each.
        var terms = {};
        items.forEach(function (item) {
          var e = normalise(item.getAttribute('data-expertise'));
          if (e) terms[e] = (terms[e] || 0) + 1;
        });
        var termList = Object.keys(terms).sort(function (a, b) { return terms[b] - terms[a]; });

        var suggestionsFor = function (q) {
          var out = [];
          if (!q) {
            termList.forEach(function (t) {
              out.push({ label: cap(t), sub: terms[t] + ' professionals', value: t });
            });
            return out.slice(0, 6);
          }
          var tokens = q.split(/\s+/);
          termList.forEach(function (t) {
            if (t.indexOf(q) !== -1) out.push({ label: cap(t), sub: terms[t] + ' professionals', value: t, score: 4 });
          });
          items.forEach(function (item) {
            var title = titleOf(item);
            var tl = normalise(title);
            var hay = normalise(item.getAttribute('data-search') || item.textContent);
            var score = 0;
            if (tl.indexOf(q) === 0) score = 3;
            else if (tl.indexOf(q) !== -1) score = 2;
            else if (tokens.every(function (t) { return hay.indexOf(t) !== -1; })) score = 1;
            if (score) out.push({ label: title, sub: subOf(item), value: title, score: score });
          });
          out.sort(function (a, b) { return b.score - a.score; });
          return out.slice(0, 6);
        };

        var sugActive = -1;
        var closeSuggest = function () {
          sugList.hidden = true;
          sugActive = -1;
          searchInput.setAttribute('aria-expanded', 'false');
          searchInput.removeAttribute('aria-activedescendant');
        };
        var setActive = function (i) {
          var opts = sugList.querySelectorAll('[role="option"]');
          if (!opts.length) return;
          sugActive = (i + opts.length) % opts.length;
          Array.prototype.forEach.call(opts, function (o, n) {
            o.classList.toggle('is-active', n === sugActive);
            o.setAttribute('aria-selected', String(n === sugActive));
          });
          searchInput.setAttribute('aria-activedescendant', opts[sugActive].id);
        };
        var commit = function (value) {
          searchInput.value = value;
          state.search = normalise(value);
          searchClearBtn.hidden = !value;
          closeSuggest();
          apply();
        };
        var openSuggest = function () {
          var q = normalise(searchInput.value);
          var list = suggestionsFor(q);
          sugList.innerHTML = '';
          if (!list.length) { closeSuggest(); return; }
          var head = document.createElement('li');
          head.className = 'filter-suggest__head';
          head.setAttribute('role', 'presentation');
          head.textContent = q ? 'Recommendations' : 'Suggested searches';
          sugList.appendChild(head);
          list.forEach(function (sug, n) {
            var li = document.createElement('li');
            li.id = sugList.id + '-' + n;
            li.className = 'filter-suggest__item';
            li.setAttribute('role', 'option');
            li.setAttribute('aria-selected', 'false');
            var a = document.createElement('strong');
            a.textContent = sug.label;
            var b = document.createElement('span');
            b.textContent = sug.sub;
            li.appendChild(a);
            li.appendChild(b);
            li.addEventListener('mousedown', function (e) { e.preventDefault(); });
            li.addEventListener('click', function () { commit(sug.value); });
            sugList.appendChild(li);
          });
          sugList.hidden = false;
          sugActive = -1;
          searchInput.setAttribute('aria-expanded', 'true');
        };

        searchInput.addEventListener('input', openSuggest);
        searchInput.addEventListener('focus', openSuggest);
        searchInput.addEventListener('keydown', function (e) {
          if (e.key === 'ArrowDown') { e.preventDefault(); if (sugList.hidden) openSuggest(); setActive(sugActive + 1); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(sugActive - 1); }
          else if (e.key === 'Escape') { closeSuggest(); }
          else if (e.key === 'Enter') {
            e.preventDefault();
            var act = sugList.querySelectorAll('[role="option"]')[sugActive];
            if (act && !sugList.hidden) act.click(); else commit(searchInput.value);
          }
        });
        document.addEventListener('click', function (e) {
          if (!searchWrap.contains(e.target)) closeSuggest();
        });
        // The Search button commits the typed query and closes the list.
        searchBtn.addEventListener('click', function () { commit(searchInput.value); });
        searchClearBtn.addEventListener('click', closeSuggest);

        // Empty-state recommendations: closest-spelling matches + popular terms.
        var words = {};
        items.forEach(function (item) {
          titleOf(item).toLowerCase().split(/\s+/).forEach(function (w) { if (w.length > 2) words[w] = true; });
        });
        termList.forEach(function (t) { words[t] = true; });
        var wordList = Object.keys(words);
        var dist = function (a, b) {
          var prev = [], cur, i, j;
          for (j = 0; j <= b.length; j++) prev[j] = j;
          for (i = 1; i <= a.length; i++) {
            cur = [i];
            for (j = 1; j <= b.length; j++) {
              cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
            }
            prev = cur;
          }
          return prev[b.length];
        };
        var recsBox = document.createElement('div');
        recsBox.className = 'filter-recs';
        recsBox.hidden = true;
        if (emptyState) emptyState.parentNode.insertBefore(recsBox, emptyState.nextSibling);

        renderRecs = function (visibleCount) {
          if (visibleCount !== 0) { recsBox.hidden = true; return; }
          var close = [];
          if (state.search) {
            state.search.split(/\s+/).forEach(function (tok) {
              var best = null, bestD = 99;
              wordList.forEach(function (w) {
                var d = dist(tok, w);
                if (d < bestD) { bestD = d; best = w; }
              });
              if (best && bestD <= Math.max(1, Math.floor(tok.length / 3)) && close.indexOf(best) === -1) close.push(best);
            });
          }
          recsBox.innerHTML = '';
          var group = function (title, values) {
            if (!values.length) return;
            var p = document.createElement('p');
            p.className = 'filter-recs__title';
            p.textContent = title;
            var row = document.createElement('div');
            row.className = 'filter-recs__row';
            values.forEach(function (v) {
              var btn = document.createElement('button');
              btn.type = 'button';
              btn.className = 'chip';
              btn.textContent = cap(v);
              btn.addEventListener('click', function () {
                activeFilters().forEach(function (f) { f.remove(); });
                commit(v);
              });
              row.appendChild(btn);
            });
            recsBox.appendChild(p);
            recsBox.appendChild(row);
          };
          group('Did you mean', close);
          group('Popular searches', termList);
          recsBox.hidden = !recsBox.firstChild;
        };
      }
    }

    selects.forEach(function (select) {
      var key = select.getAttribute('data-filter-key');
      select.addEventListener('change', function () {
        state.selects[key] = select.value;
        apply();
      });
      selectCountUpdaters.push(enhanceSelect(select, key, items, itemMatches));
    });

    if (chipsRow && chips.length) {
      var chipKeys = chips.map(function (c) { return c.getAttribute('data-filter-key'); });
      var sameKey = chipKeys.every(function (k) { return k === chipKeys[0]; });
      var chipsLabel = document.createElement('span');
      chipsLabel.className = 'filter-bar__chips-label';
      chipsLabel.textContent = sameKey ? chipGroupLabel(chipKeys[0]) : 'Filter';
      chipsRow.insertBefore(chipsLabel, chipsRow.firstChild);
    }

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
   PART 3b — CUSTOM FILTER DROPDOWN
   Used on: the same pages as Part 3, wherever a filter bar has a
   [data-filter-select]. Progressively enhances each plain <select> into a
   themed trigger button + floating listbox (role="listbox" pattern), so the
   open panel matches the site (navy/gold, sharp-cornered pills) instead of
   the browser's native dropdown. The original <select> stays in the DOM as
   the source of truth — Part 3's filter engine still reads/writes it via
   .value and a dispatched "change" event — but is hidden from view and
   assistive tech behind the custom control.
   ========================================================================== */
function enhanceSelect(select, key, items, itemMatches) {
  var group = select.closest('.filter-bar__group');
  if (!group) return function () {};

  function normalise(str) {
    return (str || '').toLowerCase().trim();
  }

  var options = Array.prototype.slice.call(select.options);
  var labelText = (group.querySelector('label') || {}).textContent || select.getAttribute('aria-label') || 'Filter';
  var triggerId = (select.id || 'filter-select') + '-trigger';
  var panelId = (select.id || 'filter-select') + '-panel';

  // Hide the native select from view and assistive tech; the custom
  // button + listbox below becomes the only interactive control.
  select.setAttribute('aria-hidden', 'true');
  select.tabIndex = -1;
  select.classList.add('filter-select__native');

  var trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'filter-trigger';
  trigger.id = triggerId;
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-controls', panelId);
  trigger.innerHTML =
    '<span class="filter-trigger__label"></span>' +
    '<svg class="filter-trigger__chevron" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
    '<path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var triggerLabel = trigger.querySelector('.filter-trigger__label');

  var panel = document.createElement('div');
  panel.className = 'filter-panel';
  panel.id = panelId;
  panel.setAttribute('role', 'listbox');
  panel.setAttribute('aria-labelledby', triggerId);
  panel.hidden = true;

  var heading = document.createElement('p');
  heading.className = 'filter-panel__heading';
  heading.textContent = labelText;
  panel.appendChild(heading);

  var list = document.createElement('ul');
  list.className = 'filter-panel__list';
  panel.appendChild(list);

  var optionEls = options.map(function (option) {
    var li = document.createElement('li');
    li.className = 'filter-panel__option';
    li.setAttribute('role', 'option');
    li.dataset.value = option.value;
    li.tabIndex = -1;
    li.innerHTML =
      '<span class="filter-panel__option-label">' + option.textContent + '</span>' +
      '<span class="filter-panel__option-count"></span>' +
      '<svg class="filter-panel__option-check" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
      '<path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    list.appendChild(li);
    return { el: li, count: li.querySelector('.filter-panel__option-count'), option: option };
  });

  group.insertBefore(trigger, select);
  group.insertBefore(panel, select);
  group.classList.add('filter-bar__group--custom');

  function selectedOption() {
    return options[select.selectedIndex] || options[0];
  }

  function syncFromSelect() {
    var current = selectedOption();
    triggerLabel.textContent = current ? current.textContent : '';
    trigger.classList.toggle('has-value', !!current && options.indexOf(current) !== 0);
    optionEls.forEach(function (entry) {
      var isSelected = entry.option === current;
      entry.el.classList.toggle('is-selected', isSelected);
      entry.el.setAttribute('aria-selected', String(isSelected));
    });
  }
  // Keep the trigger in sync when something outside this module changes
  // the underlying <select> (e.g. a "Clear all filters" or a removable
  // active-filter tag resetting it and dispatching "change").
  select.addEventListener('change', syncFromSelect);

  function refreshCounts() {
    optionEls.forEach(function (entry) {
      var value = entry.option.value;
      var n = 0;
      if (value === 'all') {
        items.forEach(function (item) { if (itemMatches(item, key)) n++; });
      } else {
        items.forEach(function (item) {
          if (!itemMatches(item, key)) return;
          if (normalise(item.getAttribute('data-' + key)).split(/\s+/).indexOf(normalise(value)) !== -1) n++;
        });
      }
      entry.count.textContent = String(n);
    });
  }

  function openPanel() {
    document.querySelectorAll('.filter-panel:not([hidden])').forEach(function (open) {
      if (open !== panel) closeOwnerPanel(open);
    });
    panel.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    trigger.classList.add('is-open');
    var current = list.querySelector('.filter-panel__option.is-selected') || optionEls[0].el;
    if (current) current.focus();
  }

  function closePanel(returnFocus) {
    panel.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    trigger.classList.remove('is-open');
    if (returnFocus) trigger.focus();
  }

  function closeOwnerPanel(openPanelEl) {
    var ownerTrigger = document.getElementById(openPanelEl.getAttribute('aria-labelledby'));
    openPanelEl.hidden = true;
    if (ownerTrigger) {
      ownerTrigger.setAttribute('aria-expanded', 'false');
      ownerTrigger.classList.remove('is-open');
    }
  }

  function choose(entry) {
    select.value = entry.option.value;
    syncFromSelect();
    closePanel(true);
    select.dispatchEvent(new Event('change', { bubbles: true }));
  }

  trigger.addEventListener('click', function () {
    if (panel.hidden) openPanel(); else closePanel(false);
  });

  optionEls.forEach(function (entry, index) {
    entry.el.addEventListener('click', function () { choose(entry); });
    entry.el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        choose(entry);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        (optionEls[index + 1] || optionEls[0]).el.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        (optionEls[index - 1] || optionEls[optionEls.length - 1]).el.focus();
      } else if (e.key === 'Home') {
        e.preventDefault();
        optionEls[0].el.focus();
      } else if (e.key === 'End') {
        e.preventDefault();
        optionEls[optionEls.length - 1].el.focus();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closePanel(true);
      } else if (e.key === 'Tab') {
        closePanel(false);
      }
    });
  });

  document.addEventListener('click', function (e) {
    if (!panel.hidden && !group.contains(e.target)) closePanel(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !panel.hidden) closePanel(true);
  });

  syncFromSelect();
  return refreshCounts;
}


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
   Dzongkha, Hindi and Nepali are all wired to the Google Website
   Translator widget each page loads (see the hidden
   #google_translate_element + script tags near the end of <body>) —
   picking one actually machine-translates the visible page. This is
   machine translation, not an official BADRC translation — for Dzongkha
   in particular (BADRC's own national-language content, once supplied —
   see CONTENT-GAPS.md — should eventually replace this rather than sit
   alongside it), but it's real, working translation today rather than a
   "coming soon" placeholder.

   TEMPORARILY DISABLED at the user's request — TRANSLATOR_ENABLED below
   is false. The header icon/button and its dropdown stay fully in place
   and interactive (opens/closes, picking a language still updates the
   checkmark/label) — only the actual machine-translation call is skipped,
   so picking a language is currently cosmetic. The Google Translate
   <script> tags each page loads near the end of <body> still exist in the
   HTML but are inert too (type="text/plain", not "text/javascript") — see
   those pages, right before <script src="js/script.js">. Flip
   TRANSLATOR_ENABLED back to true AND restore those two script tags'
   type="text/javascript" to fully re-enable real translation.
   ========================================================================== */
(function () {
  'use strict';

  var TRANSLATOR_ENABLED = false;

  var switcher = document.querySelector('.lang-switcher');
  if (!switcher) return;

  var toggle = switcher.querySelector('.lang-switcher__toggle');
  var menu = switcher.querySelector('.lang-switcher__menu');
  var label = switcher.querySelector('.lang-switcher__label');
  var options = Array.prototype.slice.call(switcher.querySelectorAll('.lang-switcher__option'));
  if (!toggle || !menu) return;

  // Google's widget only understands its own language codes ('dz', 'hi',
  // 'ne'); '' means "original" (English, the page's real language).
  var GOOGLE_LANG = { EN: '', DZ: 'dz', HI: 'hi', NE: 'ne' };

  function getCookie(name) {
    var match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : '';
  }

  // Google's own widget reads/writes this cookie itself (format "/en/hi")
  // to decide whether to auto-translate a freshly-loaded page — setting it
  // here is what makes the chosen language persist across page navigations
  // on a static, backend-less site.
  function currentGoogleLang() {
    var parts = getCookie('googtrans').split('/');
    return parts[2] || '';
  }

  function setGoogleCookie(code) {
    var value = code ? '/en/' + code : '';
    var expiry = code ? '' : '; expires=Thu, 01 Jan 1970 00:00:00 UTC';
    document.cookie = 'googtrans=' + value + '; path=/' + expiry;
    document.cookie = 'googtrans=' + value + '; path=/; domain=' + location.hostname + expiry;
  }

  function applyGoogleTranslate(code) {
    setGoogleCookie(code);
    // The widget builds a real <select> once its script has finished
    // loading (asynchronously) — driving it directly translates in place,
    // no reload. Before that, or on a page that's never loaded the widget
    // this session, falling back to a reload lets the cookie above do the
    // work instead (Google's script auto-applies it on init).
    var combo = document.querySelector('select.goog-te-combo');
    if (combo) {
      combo.value = code;
      combo.dispatchEvent(new Event('change'));
    } else {
      location.reload();
    }
  }

  function syncFromCurrentLanguage() {
    var active = currentGoogleLang();
    options.forEach(function (option) {
      var code = option.getAttribute('data-lang-code');
      var isActive = GOOGLE_LANG.hasOwnProperty(code) && GOOGLE_LANG[code] === active;
      option.setAttribute('aria-current', String(isActive));
      option.setAttribute('aria-checked', String(isActive));
      if (isActive && label) label.textContent = code;
    });
  }

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

      var code = option.getAttribute('data-lang-code');
      closeMenu();
      if (TRANSLATOR_ENABLED && (GOOGLE_LANG[code] || '') === currentGoogleLang()) return; // already active

      options.forEach(function (o) { o.setAttribute('aria-current', 'false'); o.setAttribute('aria-checked', 'false'); });
      option.setAttribute('aria-current', 'true');
      option.setAttribute('aria-checked', 'true');
      if (label) label.textContent = code;

      if (TRANSLATOR_ENABLED) applyGoogleTranslate(GOOGLE_LANG[code] || '');
    });
  });

  if (TRANSLATOR_ENABLED) syncFromCurrentLanguage();
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


/* ==========================================================================
   PART 8 — SIDE NAV
   Used on: Home only ([data-side-nav-watch], the hero section the side
   rails sit over — see index.html; other pages no longer carry the side
   rails). css/side-nav.css already collapses .side-nav-link to icon-only
   under 900px; this adds the same collapse at ANY width once the hero has
   scrolled out of view, via an IntersectionObserver toggling
   .side-nav-compact on <body>.
   ========================================================================== */
(function () {
  'use strict';

  var hero = document.querySelector('[data-side-nav-watch]');
  if (!hero || !('IntersectionObserver' in window)) return;

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      document.body.classList.toggle('side-nav-compact', !entry.isIntersecting);
    });
  }, { threshold: 0, rootMargin: '-1px 0px 0px 0px' });

  observer.observe(hero);
})();


/* The header ticker (.header-ticker__track) is intentionally hover-to-pause
   only — see the :hover / :focus-within rule in css/style.css. A mouse-drag
   interaction was tried here and removed again: it's not needed for a
   passive notice strip, and pausing on hover already lets a visitor read
   or click a notice without it sliding away. */
