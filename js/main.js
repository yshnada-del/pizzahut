document.addEventListener('DOMContentLoaded', () => {
  const banner = document.querySelector('.hero-banner');
  const track = document.querySelector('.banner_track');
  const slides = Array.from(document.querySelectorAll('.banner_box'));
  const bullets = Array.from(document.querySelectorAll('.bullet'));
  if (!banner || !track || !slides.length) return;
  let index = 0;
  let timer;
  let hovered = false;
  let focused = false;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function render(next) {
    index = (next + slides.length) % slides.length;
    track.style.transform = `translateX(-${index * 100}%)`;
    slides.forEach((slide, i) => {
      slide.classList.toggle('is_active', i === index);
      slide.setAttribute('aria-hidden', String(i !== index));
      slide.inert = i !== index;
    });
    bullets.forEach((bullet, i) => {
      bullet.classList.toggle('is_active', i === index);
      bullet.setAttribute('aria-current', String(i === index));
    });
  }
  function schedule() {
    clearInterval(timer);
    if (hovered || focused || document.hidden || reducedMotion.matches) return;
    timer = setInterval(() => render(index + 1), 3000);
  }
  bullets.forEach((bullet, i) => bullet.addEventListener('click', () => { render(i); schedule(); }));
  banner.addEventListener('pointerenter', () => { hovered = true; schedule(); });
  banner.addEventListener('pointerleave', () => { hovered = false; schedule(); });
  banner.addEventListener('focusin', () => { focused = true; schedule(); });
  banner.addEventListener('focusout', (event) => { focused = banner.contains(event.relatedTarget); schedule(); });
  document.addEventListener('visibilitychange', schedule);
  reducedMotion.addEventListener('change', schedule);
  render(0);
  schedule();
});
