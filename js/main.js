// Siedlisko pod Lasem – drobne funkcje strony

// Nagłówek: przezroczysty na zdjęciu, jasny po przewinięciu
const header = document.querySelector('.site-header');
const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 40);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

// Menu na cały ekran
const toggle = document.querySelector('.menu-toggle');
const menu = document.getElementById('menu');
const setMenu = open => {
  menu.hidden = !open;
  document.body.classList.toggle('menu-open', open);
  document.body.style.overflow = open ? 'hidden' : '';
  toggle.setAttribute('aria-expanded', open);
  toggle.setAttribute('aria-label', open ? 'Zamknij menu' : 'Otwórz menu');
  toggle.querySelector('.menu-label').textContent = open ? 'Zamknij' : 'Menu';
};
toggle.addEventListener('click', () => setMenu(menu.hidden));
menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));

// Rok w stopce
document.getElementById('year').textContent = new Date().getFullYear();

// "Zapytaj o ten domek" – od razu wybiera domek w formularzu
const domekSelect = document.getElementById('form-domek');
document.querySelectorAll('[data-domek]').forEach(btn => {
  btn.addEventListener('click', () => { domekSelect.value = btn.dataset.domek; });
});

// Daty w formularzu: nie można wybrać przeszłości, wyjazd po przyjeździe
const form = document.getElementById('contact-form');
const arrive = form.querySelector('[name="Przyjazd"]');
const leave = form.querySelector('[name="Wyjazd"]');
const today = new Date().toISOString().split('T')[0];
arrive.min = today;
leave.min = today;
arrive.addEventListener('change', () => {
  leave.min = arrive.value || today;
  if (leave.value && leave.value <= arrive.value) leave.value = '';
});

// Wysyłanie formularza (Web3Forms -> e-mail)
const statusEl = form.querySelector('.form-status');
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  statusEl.className = 'form-status';

  let valid = true;
  form.querySelectorAll('[required]').forEach(field => {
    const ok = field.type === 'checkbox' ? field.checked : field.checkValidity() && field.value.trim() !== '';
    field.classList.toggle('invalid', !ok);
    if (!ok) valid = false;
  });
  if (!valid) {
    statusEl.textContent = 'Uzupełnij, proszę, pola oznaczone gwiazdką.';
    statusEl.classList.add('err');
    return;
  }

  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  button.textContent = 'Wysyłanie…';

  try {
    const data = Object.fromEntries(new FormData(form));
    if (data.email) data.replyto = data.email;
    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    form.reset();
    statusEl.textContent = 'Dziękujemy! Zapytanie zostało wysłane – odezwiemy się najszybciej, jak to możliwe.';
    statusEl.classList.add('ok');
  } catch (err) {
    statusEl.textContent = 'Nie udało się wysłać wiadomości. Zadzwoń do nas: 509 280 516.';
    statusEl.classList.add('err');
  } finally {
    button.disabled = false;
    button.textContent = 'Wyślij zapytanie';
  }
});

// Strzałki przy opiniach
const reviews = document.getElementById('reviews');
document.querySelectorAll('.rev-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const step = reviews.querySelector('.review').offsetWidth + parseFloat(getComputedStyle(reviews).columnGap || 0);
    const atEnd = reviews.scrollLeft + reviews.clientWidth >= reviews.scrollWidth - 5;
    const atStart = reviews.scrollLeft <= 5;
    const dir = Number(btn.dataset.dir);
    if (dir > 0 && atEnd) reviews.scrollTo({ left: 0 });
    else if (dir < 0 && atStart) reviews.scrollTo({ left: reviews.scrollWidth });
    else reviews.scrollBy({ left: dir * step });
  });
});

// Powiększanie zdjęć z przewijaniem (strzałki, klawiatura, przesunięcie palcem)
const lightbox = document.getElementById('lightbox');
const lbImg = lightbox.querySelector('img');
const lbCount = lightbox.querySelector('.lightbox-count');
let lbSet = [];
let lbIndex = 0;

const showPhoto = i => {
  lbIndex = (i + lbSet.length) % lbSet.length;
  lbImg.src = lbSet[lbIndex].src;
  lbImg.alt = lbSet[lbIndex].alt;
  lbCount.textContent = lbSet.length > 1 ? `${lbIndex + 1} / ${lbSet.length}` : '';
  lightbox.classList.toggle('single', lbSet.length < 2);
};
const openLightbox = (set, i) => {
  lbSet = set;
  showPhoto(i);
  lightbox.hidden = false;
  document.body.style.overflow = 'hidden';
};
const closeLightbox = () => {
  lightbox.hidden = true;
  lbImg.src = '';
  document.body.style.overflow = '';
};
const toItem = img => ({ src: img.dataset.src || img.src, alt: img.alt });

// Grupy zdjęć: galeria, album jesienny, każdy domek osobno
const galleryImgs = [...document.querySelectorAll('.gallery > figure:not(.album) > img')];
const groups = [galleryImgs, ...[...document.querySelectorAll('.unit-media')].map(m => [...m.querySelectorAll('img')])];
groups.forEach(imgs => {
  const set = imgs.map(toItem);
  imgs.forEach((img, i) => {
    img.style.cursor = 'zoom-in';
    img.addEventListener('click', () => openLightbox(set, i));
  });
});
document.querySelectorAll('.album').forEach(album => {
  const set = [...album.querySelectorAll('.album-photos img')].map(toItem);
  album.style.cursor = 'zoom-in';
  album.addEventListener('click', () => openLightbox(set, 0));
});

lightbox.querySelector('.lightbox-prev').addEventListener('click', e => { e.stopPropagation(); showPhoto(lbIndex - 1); });
lightbox.querySelector('.lightbox-next').addEventListener('click', e => { e.stopPropagation(); showPhoto(lbIndex + 1); });
lightbox.addEventListener('click', e => { if (e.target === lightbox || e.target.classList.contains('lightbox-close')) closeLightbox(); });
let touchX = null;
lightbox.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
lightbox.addEventListener('touchend', e => {
  if (touchX === null) return;
  const dx = e.changedTouches[0].clientX - touchX;
  if (Math.abs(dx) > 40) showPhoto(lbIndex + (dx < 0 ? 1 : -1));
  touchX = null;
});
document.addEventListener('keydown', e => {
  if (!lightbox.hidden) {
    if (e.key === 'ArrowRight') showPhoto(lbIndex + 1);
    if (e.key === 'ArrowLeft') showPhoto(lbIndex - 1);
  }
  if (e.key !== 'Escape') return;
  closeLightbox();
  if (!menu.hidden) setMenu(false);
});

// Sekcje delikatnie pojawiają się przy przewijaniu
if ('IntersectionObserver' in window) {
  const els = document.querySelectorAll('.section h2, .section .lead, .photo-pair figure, .features, .unit, .equipment, .price-list, .gallery figure, .places li, .scores, .review, .contact > *');
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('visible'); io.unobserve(en.target); }
    });
  }, { threshold: 0.1 });
  els.forEach(el => { el.classList.add('reveal'); io.observe(el); });
}
