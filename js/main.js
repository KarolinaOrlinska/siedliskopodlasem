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

// Powiększanie zdjęć (galeria i domki)
const lightbox = document.getElementById('lightbox');
const lbImg = lightbox.querySelector('img');
document.querySelectorAll('.gallery img, .unit-img img').forEach(img => {
  img.style.cursor = 'zoom-in';
  img.addEventListener('click', () => {
    lbImg.src = img.src;
    lbImg.alt = img.alt;
    lightbox.hidden = false;
  });
});
const closeLightbox = () => { lightbox.hidden = true; lbImg.src = ''; };
lightbox.addEventListener('click', e => { if (e.target !== lbImg) closeLightbox(); });
document.addEventListener('keydown', e => {
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
