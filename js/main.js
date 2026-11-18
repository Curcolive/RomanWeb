import { GALLERY_ITEMS } from './gallery-data.js';
import { I18N_DICTIONARY, PRICING_CONFIG } from './i18n.js';

const state = {
  currentSlide: 0,
  lang: 'es',
  currency: 'USD',
  isReserved: false,
  bagCount: 0,
  studioLit: false,
  tiltMode: false,
  lightboxZoomed: false,
  toastTimer: null
};

const SEARCH_INDEX = [
  { labelEs: 'Galería del Art Toy (20 vistas)', labelEn: 'Art Toy Gallery (20 views)', target: '#galeria', tag: 'Galería' },
  { labelEs: 'Matrícula Nº 047 / 100 y Precio', labelEn: 'Serial Nº 047 / 100 & Price', target: '#terminal-compra', tag: 'Edición' },
  { labelEs: 'Historia del Personaje: Kevin Roman', labelEn: 'Character Lore: Kevin Roman', target: '#historia', tag: 'Historia' },
  { labelEs: 'Ficha Técnica: Porcelana Fría & Perfume 50 ml', labelEn: 'Tech Specs: Cold Porcelain & 50 ml Perfume', target: '#especificaciones', tag: 'Ficha' },
  { labelEs: 'Testimonios de Coleccionistas', labelEn: 'Collector Reviews', target: '#testimonios', tag: 'Reseñas' },
  { labelEs: 'Asesoría de Curador Privado', labelEn: 'Private Curator Consultation', action: 'curator', tag: 'Concierge' }
];

document.addEventListener('DOMContentLoaded', () => {
  renderThumbnails();
  updateGallery(0, false);
  initScrollEffects();
  initSpotlightAndTilt();
  initTouchSwipe();
  initModalsAndForms();
  initSwitches();
  initMobileDrawer();
  updatePricingUI();
});

/* ==========================================================================
   Gallery & Lightbox
   ========================================================================== */

function renderThumbnails() {
  const rail = document.getElementById('gallery-thumbs');
  if (!rail) return;

  rail.innerHTML = '';
  GALLERY_ITEMS.forEach((item, index) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = `thumb-card${index === state.currentSlide ? ' is-active' : ''}`;
    card.setAttribute('aria-label', item.thumbLabel);
    card.dataset.index = String(index);

    card.innerHTML = `
      <div class="thumb-frame">
        <img src="${item.src}" alt="${item.alt}" loading="lazy">
        <span class="thumb-dot" aria-hidden="true"></span>
      </div>
      <p class="thumb-label badge-micro">${state.lang === 'en' ? item.thumbLabelEn : item.thumbLabel}</p>
    `;

    card.addEventListener('click', () => updateGallery(index, true));
    rail.appendChild(card);
  });
}

function updateGallery(index, animate = true) {
  if (!GALLERY_ITEMS.length) return;
  const safeIndex = (index + GALLERY_ITEMS.length) % GALLERY_ITEMS.length;
  state.currentSlide = safeIndex;
  const item = GALLERY_ITEMS[safeIndex];

  const mainImg = document.getElementById('main-sculpture-img');
  const counter = document.getElementById('gallery-counter');
  const badgeTitle = document.getElementById('gallery-badge-title');
  const captionText = document.getElementById('gallery-caption-text');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxTitle = document.getElementById('lightbox-title');
  const lightboxCounter = document.getElementById('lightbox-counter');

  const applyContent = () => {
    if (mainImg) {
      mainImg.src = item.src;
      mainImg.alt = item.alt;
      mainImg.style.opacity = '1';
      mainImg.style.transform = 'scale(1)';
    }
    if (lightboxImg) {
      lightboxImg.src = item.src;
      lightboxImg.alt = item.alt;
    }
  };

  if (mainImg && animate) {
    mainImg.style.opacity = '0.18';
    mainImg.style.transform = 'scale(0.96)';
    setTimeout(applyContent, 160);
  } else {
    applyContent();
  }

  const labelTitle = state.lang === 'en' ? item.badgeTitleEn : item.badgeTitle;
  const labelCaption = state.lang === 'en' ? item.captionEn : item.caption;

  const formattedCounter = `${String(safeIndex + 1).padStart(2, '0')} / ${GALLERY_ITEMS.length}`;
  if (counter) counter.textContent = formattedCounter;
  if (badgeTitle) badgeTitle.textContent = labelTitle;
  if (captionText) captionText.textContent = labelCaption;
  if (lightboxTitle) lightboxTitle.textContent = labelTitle;
  if (lightboxCounter) lightboxCounter.textContent = formattedCounter;

  const rail = document.getElementById('gallery-thumbs');
  document.querySelectorAll('.thumb-card').forEach((card, idx) => {
    const active = idx === safeIndex;
    card.classList.toggle('is-active', active);
    if (active && animate && rail) {
      const railRect = rail.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      const targetLeft = rail.scrollLeft + (cardRect.left - railRect.left) - (railRect.width - cardRect.width) / 2;
      rail.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' });
    }
    const labelEl = card.querySelector('.thumb-label');
    if (labelEl && GALLERY_ITEMS[idx]) {
      labelEl.textContent = state.lang === 'en' ? GALLERY_ITEMS[idx].thumbLabelEn : GALLERY_ITEMS[idx].thumbLabel;
    }
  });
}

function initSpotlightAndTilt() {
  const stage = document.getElementById('plinth-stage');
  const wrap = document.getElementById('plinth-image-wrap');
  const btnPrev = document.getElementById('gallery-prev');
  const btnNext = document.getElementById('gallery-next');
  const btnStudio = document.getElementById('btn-studio-light');
  const btnTilt = document.getElementById('btn-3d-inspect');
  const btnZoom = document.getElementById('btn-zoom-macro');

  btnPrev?.addEventListener('click', () => updateGallery(state.currentSlide - 1, true));
  btnNext?.addEventListener('click', () => updateGallery(state.currentSlide + 1, true));

  btnStudio?.addEventListener('click', () => {
    state.studioLit = !state.studioLit;
    stage?.classList.toggle('is-studio-lit', state.studioLit);
    btnStudio.classList.toggle('is-active', state.studioLit);
    showToast(
      state.lang === 'en'
        ? (state.studioLit ? 'Gallery Spotlight Activated' : 'Standard Ambient Mode')
        : (state.studioLit ? 'Iluminación de Estudio Activada' : 'Iluminación Ambiente Estándar'),
      state.lang === 'en' ? 'Adjustable pedestal contrast' : 'Contraste de pedestal ajustado'
    );
  });

  btnTilt?.addEventListener('click', () => {
    state.tiltMode = !state.tiltMode;
    stage?.classList.toggle('is-3d-active', state.tiltMode);
    btnTilt.classList.toggle('is-active', state.tiltMode);
    if (!state.tiltMode && wrap) {
      wrap.style.transform = '';
    }
    showToast(
      state.lang === 'en'
        ? (state.tiltMode ? '3D Perspective Inspection ON' : '3D Inspection OFF')
        : (state.tiltMode ? 'Inspección 3D Activada' : 'Inspección 3D Desactivada'),
      state.lang === 'en'
        ? 'Move cursor over the piece to inspect angles'
        : 'Desliza el cursor sobre la pieza para inclinar el ángulo'
    );
  });

  btnZoom?.addEventListener('click', openLightbox);
  wrap?.addEventListener('click', () => {
    if (!state.tiltMode) openLightbox();
  });

  stage?.addEventListener('mousemove', (event) => {
    const rect = stage.getBoundingClientRect();
    const xPct = ((event.clientX - rect.left) / rect.width) * 100;
    const yPct = ((event.clientY - rect.top) / rect.height) * 100;
    stage.style.setProperty('--spot-x', `${xPct.toFixed(1)}%`);
    stage.style.setProperty('--spot-y', `${yPct.toFixed(1)}%`);

    if (state.tiltMode && wrap) {
      const rotateY = ((xPct - 50) / 50) * 12;
      const rotateX = ((50 - yPct) / 50) * 10;
      wrap.style.transform = `rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale(1.04)`;
    }
  });

  stage?.addEventListener('mouseleave', () => {
    stage.style.setProperty('--spot-x', '50%');
    stage.style.setProperty('--spot-y', '38%');
    if (wrap) wrap.style.transform = '';
  });

  document.addEventListener('keydown', (e) => {
    const lightboxOpen = document.getElementById('lightbox-modal')?.classList.contains('is-open');
    if (e.key === 'Escape') {
      closeAllModals();
      closeMobileDrawer();
      return;
    }
    if (e.key === 'ArrowLeft') {
      updateGallery(state.currentSlide - 1, true);
    } else if (e.key === 'ArrowRight') {
      updateGallery(state.currentSlide + 1, true);
    } else if (e.key === ' ' && lightboxOpen) {
      e.preventDefault();
      toggleLightboxZoom();
    }
  });
}

function initTouchSwipe() {
  const stage = document.getElementById('plinth-stage');
  if (!stage) return;
  let touchStartX = 0;

  stage.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  stage.addEventListener('touchend', (e) => {
    const deltaX = e.changedTouches[0].screenX - touchStartX;
    if (Math.abs(deltaX) > 42) {
      if (deltaX < 0) updateGallery(state.currentSlide + 1, true);
      else updateGallery(state.currentSlide - 1, true);
    }
  }, { passive: true });
}

function openLightbox() {
  const modal = document.getElementById('lightbox-modal');
  const img = document.getElementById('lightbox-img');
  if (!modal) return;
  state.lightboxZoomed = false;
  img?.classList.remove('is-zoomed');
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
}

function toggleLightboxZoom() {
  const img = document.getElementById('lightbox-img');
  if (!img) return;
  state.lightboxZoomed = !state.lightboxZoomed;
  img.classList.toggle('is-zoomed', state.lightboxZoomed);
}

/* ==========================================================================
   Scroll Reveals, Sticky Header & Active Section Tracking
   ========================================================================== */

function initScrollEffects() {
  const header = document.getElementById('site-header');
  const progressBar = document.getElementById('serial-progress-fill');

  const onScroll = () => {
    if (header) {
      header.classList.toggle('is-scrolled', window.scrollY > 28);
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const revealIfVisible = () => {
    const vh = window.innerHeight || document.documentElement.clientHeight;
    document.querySelectorAll('[data-reveal]:not(.is-revealed)').forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < vh * 0.96) {
        const delay = el.getAttribute('data-delay');
        if (delay) el.style.transitionDelay = `${delay}ms`;
        el.classList.add('is-revealed');
        if (el.id === 'serial-block' && progressBar) {
          progressBar.classList.add('is-filled');
        }
      }
    });
  };

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const delay = entry.target.getAttribute('data-delay');
          if (delay) entry.target.style.transitionDelay = `${delay}ms`;
          entry.target.classList.add('is-revealed');

          if (entry.target.id === 'serial-block' && progressBar) {
            progressBar.classList.add('is-filled');
          }
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -20px 0px' }
  );

  document.querySelectorAll('[data-reveal]').forEach((el) => revealObserver.observe(el));
  window.addEventListener('scroll', revealIfVisible, { passive: true });
  revealIfVisible();
  setTimeout(revealIfVisible, 180);

  // Trigger progress bar right away if above the fold
  setTimeout(() => {
    if (progressBar) progressBar.classList.add('is-filled');
  }, 300);

  // Active section highlight in nav
  const navLinks = document.querySelectorAll('.main-nav .nav-link');
  const sections = Array.from(navLinks)
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  const navObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const targetId = `#${entry.target.id}`;
          navLinks.forEach((l) => l.classList.toggle('is-active', l.getAttribute('href') === targetId));
        }
      });
    },
    { rootMargin: '-35% 0px -55% 0px' }
  );

  sections.forEach((sec) => navObserver.observe(sec));
}

/* ==========================================================================
   Language & Currency Switches
   ========================================================================== */

function initSwitches() {
  document.querySelectorAll('[data-lang-btn]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const nextLang = btn.getAttribute('data-lang-btn');
      if (nextLang && nextLang !== state.lang) {
        state.lang = nextLang;
        document.documentElement.lang = nextLang;
        document.querySelectorAll('[data-lang-btn]').forEach((b) =>
          b.classList.toggle('is-active', b.getAttribute('data-lang-btn') === nextLang)
        );
        applyTranslations();
        updateGallery(state.currentSlide, false);
        updatePricingUI();
      }
    });
  });

  document.querySelectorAll('[data-currency-btn]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const nextCurr = btn.getAttribute('data-currency-btn');
      if (nextCurr && nextCurr !== state.currency) {
        state.currency = nextCurr;
        document.querySelectorAll('[data-currency-btn]').forEach((b) =>
          b.classList.toggle('is-active', b.getAttribute('data-currency-btn') === nextCurr)
        );
        updatePricingUI();
      }
    });
  });
}

function applyTranslations() {
  const dict = I18N_DICTIONARY[state.lang];
  if (!dict) return;

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (key && dict[key]) {
      el.textContent = dict[key];
    }
  });

  const reserveText = document.getElementById('reserve-btn-text');
  if (reserveText) {
    reserveText.textContent = state.isReserved ? dict.cta_reserved_done : dict.cta_reserve;
  }
}

function updatePricingUI() {
  const cfg = PRICING_CONFIG[state.currency];
  const priceEl = document.getElementById('price-amount');
  const codeEl = document.getElementById('price-code');
  const instEl = document.getElementById('price-installments');
  const bagPriceEl = document.getElementById('bag-summary-price');

  if (priceEl) {
    priceEl.style.transform = 'translateY(-4px)';
    priceEl.style.opacity = '0.5';
    setTimeout(() => {
      priceEl.textContent = cfg.priceFormatted;
      if (codeEl) codeEl.textContent = cfg.code;
      if (instEl) instEl.textContent = state.lang === 'en' ? cfg.installmentTextEn : cfg.installmentText;
      if (bagPriceEl) bagPriceEl.textContent = `${cfg.priceFormatted} ${cfg.code}`;
      priceEl.style.transform = 'translateY(0)';
      priceEl.style.opacity = '1';
    }, 120);
  }
}

/* ==========================================================================
   Modals, Interactive Mockup Actions & Forms
   ========================================================================== */

function initModalsAndForms() {
  // Lightbox controls
  document.getElementById('lightbox-close')?.addEventListener('click', closeAllModals);
  document.getElementById('lightbox-prev')?.addEventListener('click', () => updateGallery(state.currentSlide - 1, false));
  document.getElementById('lightbox-next')?.addEventListener('click', () => updateGallery(state.currentSlide + 1, false));
  document.getElementById('lightbox-img')?.addEventListener('click', toggleLightboxZoom);
  document.getElementById('lightbox-zoom-btn')?.addEventListener('click', toggleLightboxZoom);

  // Reserve & Scroll CTA
  document.getElementById('reserve-btn')?.addEventListener('click', handleReserveMockup);
  document.getElementById('urgency-scroll-btn')?.addEventListener('click', () => {
    document.getElementById('terminal-compra')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  // Curator Modal
  document.getElementById('open-curator-btn')?.addEventListener('click', () => openModal('curator-modal'));
  document.getElementById('curator-close')?.addEventListener('click', closeAllModals);
  document.getElementById('curator-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.target;
    const feedback = document.getElementById('curator-feedback');
    if (feedback) {
      feedback.textContent = state.lang === 'en'
        ? 'Request logged (Demo). Our Atelier concierge will reply within 2 hours.'
        : 'Solicitud registrada (Mockup). El equipo de curaduría responderá en menos de 2 horas.';
    }
    form.reset();
    setTimeout(() => {
      closeAllModals();
      if (feedback) feedback.textContent = '';
      showToast(
        state.lang === 'en' ? 'Curator Inquiry Sent' : 'Consulta Enviada al Atelier',
        state.lang === 'en' ? 'Priority serial check in progress' : 'Verificación prioritaria de matrícula'
      );
    }, 1300);
  });

  // Bag / Reservation Drawer Modal
  document.getElementById('open-bag-btn')?.addEventListener('click', () => openModal('bag-modal'));
  document.getElementById('bag-close')?.addEventListener('click', closeAllModals);
  document.getElementById('bag-confirm-btn')?.addEventListener('click', () => {
    handleReserveMockup();
    closeAllModals();
  });

  // Quick Search Modal
  document.getElementById('open-search-btn')?.addEventListener('click', () => {
    openModal('search-modal');
    renderSearchResults('');
    setTimeout(() => document.getElementById('search-input')?.focus(), 120);
  });
  document.getElementById('search-close')?.addEventListener('click', closeAllModals);
  document.getElementById('search-input')?.addEventListener('input', (e) => {
    renderSearchResults(e.target.value);
  });

  // Close modal on backdrop click
  document.querySelectorAll('.modal-overlay').forEach((overlay) => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeAllModals();
    });
  });

  // Footer Newsletter Form
  document.getElementById('newsletter-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('newsletter-email');
    const feedback = document.getElementById('newsletter-feedback');
    if (!input || !input.value.trim()) return;
    if (feedback) {
      feedback.textContent = state.lang === 'en'
        ? `Registered ${input.value.trim()} for Monumental Series private drops.`
        : `Suscripción registrada para ${input.value.trim()} (Acceso Privado).`;
    }
    input.value = '';
  });
}

function handleReserveMockup() {
  const btn = document.getElementById('reserve-btn');
  const btnText = document.getElementById('reserve-btn-text');
  const bagCount = document.getElementById('bag-count');
  const dict = I18N_DICTIONARY[state.lang];

  if (!btn || state.isReserved) {
    openModal('bag-modal');
    return;
  }

  btn.disabled = true;
  if (btnText) {
    btnText.textContent = state.lang === 'en' ? 'Reserving Edition 047...' : 'Procesando Reserva Oficial...';
  }

  setTimeout(() => {
    state.isReserved = true;
    state.bagCount = 1;
    btn.disabled = false;
    btn.classList.add('is-reserved');
    if (btnText) btnText.textContent = dict.cta_reserved_done;

    if (bagCount) {
      bagCount.textContent = '1';
      bagCount.classList.add('is-bumped');
      setTimeout(() => bagCount.classList.remove('is-bumped'), 350);
    }

    const bagStatus = document.getElementById('bag-status-badge');
    if (bagStatus) {
      bagStatus.textContent = state.lang === 'en' ? 'RESERVED FOR 15 MIN' : 'RESERVADA POR 15 MIN';
    }

    showToast(
      state.lang === 'en' ? 'Reservation Hold Active (047/100)' : 'Reserva en Proceso (047/100)',
      state.lang === 'en' ? 'Piece held for 15 minutes at Atelier' : 'Pieza separada por 15 minutos en el Atelier'
    );
  }, 650);
}

function renderSearchResults(query) {
  const container = document.getElementById('search-results');
  if (!container) return;
  const q = query.trim().toLowerCase();

  const matches = SEARCH_INDEX.filter((item) => {
    const label = state.lang === 'en' ? item.labelEn : item.labelEs;
    return !q || label.toLowerCase().includes(q) || item.tag.toLowerCase().includes(q);
  });

  container.innerHTML = '';
  matches.forEach((item) => {
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'search-result-item';
    const label = state.lang === 'en' ? item.labelEn : item.labelEs;
    row.innerHTML = `<span>${label}</span><span class="badge-micro text-gold">${item.tag}</span>`;
    row.addEventListener('click', () => {
      closeAllModals();
      if (item.action === 'curator') {
        openModal('curator-modal');
      } else if (item.target) {
        document.querySelector(item.target)?.scrollIntoView({ behavior: 'smooth' });
      }
    });
    container.appendChild(row);
  });
}

function openModal(id) {
  closeAllModals();
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
}

function closeAllModals() {
  document.querySelectorAll('.modal-overlay').forEach((m) => {
    m.classList.remove('is-open');
    m.setAttribute('aria-hidden', 'true');
  });
}

function showToast(title, subtitle) {
  const toast = document.getElementById('toast-notify');
  const titleEl = document.getElementById('toast-title');
  const subEl = document.getElementById('toast-subtitle');
  if (!toast) return;

  if (titleEl) titleEl.textContent = title;
  if (subEl) subEl.textContent = subtitle;

  toast.classList.add('is-visible');
  if (state.toastTimer) clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => {
    toast.classList.remove('is-visible');
  }, 4200);
}

/* ==========================================================================
   Mobile Drawer
   ========================================================================== */

function initMobileDrawer() {
  const openBtn = document.getElementById('mobile-menu-open');
  const closeBtn = document.getElementById('mobile-menu-close');
  const backdrop = document.getElementById('mobile-drawer-backdrop');
  const drawer = document.getElementById('mobile-drawer');

  openBtn?.addEventListener('click', () => drawer?.classList.add('is-open'));
  closeBtn?.addEventListener('click', closeMobileDrawer);
  backdrop?.addEventListener('click', closeMobileDrawer);

  document.querySelectorAll('.mobile-drawer-link').forEach((link) => {
    link.addEventListener('click', closeMobileDrawer);
  });
}

function closeMobileDrawer() {
  document.getElementById('mobile-drawer')?.classList.remove('is-open');
}
