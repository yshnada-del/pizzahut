document.addEventListener('DOMContentLoaded', () => {
  const moreButton = document.querySelector('.more_btn');
  const menu = document.querySelector('.lnb');
  if (!moreButton || !menu) return;
  const setOpen = (open) => {
    menu.classList.toggle('active', open);
    moreButton.classList.toggle('on', open);
    moreButton.setAttribute('aria-expanded', String(open));
  };
  moreButton.addEventListener('click', (event) => {
    event.preventDefault();
    setOpen(!menu.classList.contains('active'));
  });
  document.addEventListener('click', (event) => {
    if (!moreButton.contains(event.target) && !menu.contains(event.target)) setOpen(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menu.classList.contains('active')) {
      setOpen(false);
      moreButton.focus();
    }
  });
});
