# BADRC Website — Content Gap List

This document tracks every bracketed placeholder in the static site build that
must be replaced with real, BADRC-confirmed content before launch. Nothing
below should be treated as factual — figures, names, dates and partner
references are structural placeholders only, added to demonstrate layout and
content shape.

**Do not launch this site without resolving the items below.**

## Sitewide

- Office phone number, email address and full postal address (footer, header
  utility bar reference, `contact.html`, `about.html`).
- Social media links (Facebook/LinkedIn/X icons in header/footer currently
  point to `#`).
- Newsletter subscription backend integration (`index.html` and all footers —
  form is UI-only, no delivery service connected).
- Google/OSM Maps embed + API key for the interactive office map
  (`contact.html`).
- Favicon/logo usage double-checked against BADRC's approved brand guidelines
  once supplied (currently `assets/images/BADRC logo.png` used at all sizes).
- Analytics account ID (structure is in place; no tracking script is wired in
  yet, per the requirement to keep this client-controlled).
- Hero and editorial photography: `taktshang.jpg` (Home hero background),
  `thimphu.jpg` (Home hero figure), and `trongsa dzong.jpg` (News article
  placeholder image) are real, generically-representative Bhutan photographs
  supplied for this build — they stand in for genuine BADRC-owned photography
  (the Centre's own premises, hearings, staff and events) and should be
  swapped for the real thing, with proper licensing/credit confirmed, before
  launch. Every interior page's hero (About, Arbitration, Mediation, Panels,
  Rules, etc.) is a plain navy-dark banner with no photo — only the Home
  hero uses photography.

## Home (`index.html`)

- Hero background uses placeholder Bhutan photography (see sitewide note
  above) — not a photograph of BADRC's own premises. The hero no longer has
  a secondary figure/image column; it's a single-column text layout over
  the photo background.
- Latest News: 5 cards (headlines/dates) reuse the same placeholder Bhutan
  photography as card backgrounds — swap for real news photography once
  available. Titles are illustrative, written in a real headline style
  (not bracketed) to preview the finished layout — none of them are actual
  BADRC news and must not be mistaken for confirmed announcements.
- Upcoming Events: 4 cards (titles, dates, venues) — same caveat as above:
  illustrative, not bracketed, but not real scheduled events either. Titles,
  dates and venues here (e.g. "Regional Mediation Symposium", "14 Jun")
  are placeholders standing in for real event content and must be replaced
  with BADRC-confirmed events before launch.
- Featured resource titles, file sizes and dates.
- Partner/institutional logo strip now displays real logos supplied for
  this build (RGoB, RENEW, Selwa, The Happiness Farm) — but BADRC's actual,
  confirmed partnership/MoU relationship with each of these organisations
  still needs to be verified before this section is presented as fact.

## About (`about.html`)

- Legal/mandate detail beyond the Act citation itself.
- Institutional history narrative and founding detail.
- Vision, mission and values statements.
- Governance structure detail and org-chart node labels.
- Secretary General's name, portrait and message.
- Staff directory (4 placeholder entries — names, titles, photos).
- Annual report entries (title, version, size, date, download).
- Institutional milestones beyond the 2013 Act citation.

## Arbitration (`arbitration.html`) / Mediation (`mediation.html`)

- Full commencement, jurisdiction and enforcement detail.
- Model clause legal review and sign-off before publication.
- Fee schedule figures (currently `[Amount]` placeholders throughout).
- Form file sizes/versions for Notice of Arbitration, Answer, Request for
  Mediation.
- Emergency arbitrator procedure detail.
- FAQ answer content (currently placeholder or partially drafted).

## Panels & Professionals (`panels.html`)

- All 8 sample professional profiles are placeholders (no real individuals
  represented) — names, photos, nationality, languages, qualifications,
  experience, expertise and approved contact details all pending BADRC's
  panel data.

## Rules & Legislation (`rules.html`)

- Version numbers and publication dates for all rules/regulations/practice
  notes/forms/fee schedules.
- File sizes for all downloadable documents.
- Confirmation of which editions are "current" vs. "archived."

## Cases & Statistics (`cases-statistics.html`)

- All caseload, sectoral, timeline and domestic/international split figures
  are illustrative placeholders — no real BADRC statistics are used anywhere
  on this page.

## Publications & Resources (`publications.html`)

- All 8 sample publications are placeholders (titles, summaries, dates, file
  sizes) pending BADRC's actual publication library.

## News & Events (`news.html`, `news-article.html`)

- All headlines, summaries, authors, dates and event details are placeholders.
- Event registration currently routes to the general contact form; a
  dedicated registration flow is a future integration point.

## International Cooperation (`international-cooperation.html`)

- No partnership, MoU, membership or convention is asserted as confirmed —
  all listed items are structural placeholders pending BADRC verification.
  This page must not go live with unconfirmed claims of partnership.

## Media & Gallery (`media-gallery.html`)

- All photo/video entries, captions and accessible alt text are placeholders
  pending real BADRC media assets.

## Careers & Procurement (`careers.html`)

- All vacancy, consultancy and tender listings, closing dates and documents
  are placeholders.
- Application email address to be confirmed.

## Contact (`contact.html`)

- Full postal address, phone, email, office hours, and map coordinates.

## Policies (`policies.html`)

- All seven policy sections (privacy, cookies, terms, accessibility,
  copyright, disclaimer, retention) contain placeholder text pending legal
  review and BADRC sign-off. The accessibility statement's substantive
  commitment (WCAG 2.1 AA) is real and intended to stand as written; the
  contact-for-barriers instruction should be re-verified once a dedicated
  accessibility contact is designated.

## Search (`search.html`)

- The results list is a small illustrative index, not a live search. Wiring
  to a real content index (pages, news, publications, rules, forms,
  professionals, downloads) is a future integration.

## Future integration points (by design, not gaps)

The following are intentionally out of scope for this static build but the
markup/CSS/JS structure has been kept modular so they can be added without a
full redevelopment: secure e-filing, party portal, online payment, case
tracking, document exchange, virtual hearing links, e-arbitration
integration, Dzongkha (and other) language variants, and a live search index.
