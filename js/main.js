document.addEventListener('DOMContentLoaded', () => {
     const bannerTrack = document.querySelector('.banner_track');
    const slides = document.querySelectorAll('.banner_box');
    const prevButtons = document.querySelectorAll('.banner_prev');
    const nextButtons = document.querySelectorAll('.banner_next');
    const allBulletSets = document.querySelectorAll('.bullet_all');
    if (bannerTrack && slides.length > 0) {
        let currentIndex = 0;

        const getStepSize = () => {
            const firstSlide = slides[0];
            const gapValue = window.getComputedStyle(bannerTrack).gap;
            const gap = Number.parseFloat(gapValue) || 0;
            return firstSlide.offsetWidth + gap;
        };

        const renderBanner = () => {
            const step = getStepSize();
            bannerTrack.style.transform = `translateX(-${currentIndex * step}px)`;

            slides.forEach((slide, idx) => {
                slide.classList.toggle('is_active', idx === currentIndex);
            });

            allBulletSets.forEach((set) => {
                const bullets = set.querySelectorAll('.bullet');
                bullets.forEach((bullet, idx) => {
                    const isActive = idx === currentIndex;
                    bullet.classList.toggle('is_active', isActive);
                    bullet.setAttribute('aria-current', isActive ? 'true' : 'false');
                });
            });
        };

        const goTo = (nextIndex) => {
            const last = slides.length - 1;
            if (nextIndex < 0) {
                currentIndex = last;
            } else if (nextIndex > last) {
                currentIndex = 0;
            } else {
                currentIndex = nextIndex;
            }
            renderBanner();
        };

        prevButtons.forEach((btn) => {
            btn.addEventListener('click', () => {
                goTo(currentIndex - 1);
            });
        });

        nextButtons.forEach((btn) => {
            btn.addEventListener('click', () => {
                goTo(currentIndex + 1);
            });
        });

        allBulletSets.forEach((set) => {
            const bullets = set.querySelectorAll('.bullet');
            bullets.forEach((bullet, idx) => {
                bullet.addEventListener('click', () => {
                    goTo(idx);
                });
            });
        });

        window.addEventListener('resize', renderBanner);
        renderBanner();
    }

    const menuViewport = document.querySelector('.menu .img_all');
    const menuTrack = document.querySelector('.menu .images');

    if (menuViewport && menuTrack) {
        let isPointerDown = false;
        let startX = 0;
        let startTranslateX = 0;
        let currentTranslateX = 0;
        let maxDragX = 0;
        let shouldBlockClick = false;

        const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

        const applyTranslate = () => {
            menuTrack.style.transform = `translateX(${currentTranslateX}px)`;
        };

        const updateDragBounds = () => {
            const viewportWidth = menuViewport.clientWidth;
            const trackWidth = menuTrack.scrollWidth;
            maxDragX = Math.max(0, trackWidth - viewportWidth);
            currentTranslateX = clamp(currentTranslateX, -maxDragX, 0);
            applyTranslate();
        };

        const onPointerMove = (event) => {
            if (!isPointerDown) {
                return;
            }

            const deltaX = event.clientX - startX;
            if (Math.abs(deltaX) > 4) {
                shouldBlockClick = true;
            }

            currentTranslateX = clamp(startTranslateX + deltaX, -maxDragX, 0);
            applyTranslate();
        };

        const onPointerUp = () => {
            if (!isPointerDown) {
                return;
            }
            isPointerDown = false;
            menuTrack.classList.remove('is_dragging');
        };

        menuTrack.addEventListener('pointerdown', (event) => {
            if (event.button !== 0) {
                return;
            }

            isPointerDown = true;
            shouldBlockClick = false;
            startX = event.clientX;
            startTranslateX = currentTranslateX;
            menuTrack.classList.add('is_dragging');
            menuTrack.setPointerCapture(event.pointerId);
        });

        menuTrack.addEventListener('pointermove', onPointerMove);
        menuTrack.addEventListener('pointerup', onPointerUp);
        menuTrack.addEventListener('pointercancel', onPointerUp);
        menuTrack.addEventListener('lostpointercapture', onPointerUp);

        menuTrack.addEventListener('click', (event) => {
            if (!shouldBlockClick) {
                return;
            }
            event.preventDefault();
            event.stopPropagation();
            shouldBlockClick = false;
        }, true);

        window.addEventListener('resize', updateDragBounds);
        updateDragBounds();
    }
});