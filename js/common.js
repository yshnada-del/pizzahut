document.addEventListener('DOMContentLoaded', () => {
    const moreBtn = document.querySelector('.more_btn');
    const lnb = document.querySelector('.lnb');
    const headerLogoLink = document.querySelector('header .left_info h1 a');

    if (headerLogoLink) {
        headerLogoLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    if (moreBtn && lnb) {
        moreBtn.addEventListener('click', (e) => {
            e.preventDefault();
            lnb.classList.toggle('active');
            moreBtn.classList.toggle('on');
        });

        document.addEventListener('click', (e) => {
            if (!moreBtn.contains(e.target) && !lnb.contains(e.target)) {
                lnb.classList.remove('active');
                moreBtn.classList.remove('on');
            }
        });
    }
}); //dom end
