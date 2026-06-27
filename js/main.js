document.addEventListener("DOMContentLoaded", () => {
  const bannerTrack = document.querySelector(".banner_track");
  const slides = document.querySelectorAll(".banner_box");
  const bannerControl = document.querySelector(".banner_control");
  const prevButton = document.querySelector(".banner_prev");
  const nextButton = document.querySelector(".banner_next");
  const bullets = document.querySelectorAll(".bullet_all .bullet");
  if (bannerTrack && slides.length > 0) {
    let currentIndex = 0;
    const autoSlideDelay = 3000;
    let autoSlideTimer = null;

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
        slide.classList.toggle("is_active", idx === currentIndex);
      });

      if (bannerControl) {
        slides[currentIndex].appendChild(bannerControl);
      }

      bullets.forEach((bullet, idx) => {
        const isActive = idx === currentIndex;
        bullet.classList.toggle("is_active", isActive);
        bullet.setAttribute("aria-current", isActive ? "true" : "false");
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

    const stopAutoSlide = () => {
      if (autoSlideTimer) {
        window.clearInterval(autoSlideTimer);
        autoSlideTimer = null;
      }
    };

    const startAutoSlide = () => {
      stopAutoSlide();
      autoSlideTimer = window.setInterval(() => {
        goTo(currentIndex + 1);
      }, autoSlideDelay);
    };

    const restartAutoSlide = () => {
      startAutoSlide();
    };

    if (prevButton) {
      prevButton.addEventListener("click", () => {
        goTo(currentIndex - 1);
        restartAutoSlide();
      });
    }

    if (nextButton) {
      nextButton.addEventListener("click", () => {
        goTo(currentIndex + 1);
        restartAutoSlide();
      });
    }

    bullets.forEach((bullet, idx) => {
      bullet.addEventListener("click", () => {
        goTo(idx);
        restartAutoSlide();
      });
    });

    window.addEventListener("resize", renderBanner);
    renderBanner();
    startAutoSlide();
  }

  const menuViewport = document.querySelector(".menu .img_all");
  const menuTrack = document.querySelector(".menu .images");

  if (menuViewport && menuTrack) {
    const originalItems = Array.from(menuTrack.children);
    let segmentWidth = 0;
    let currentTranslateX = 0;
    let lastFrameTime = 0;
    let isPaused = false;
    let isPointerDown = false;
    let startX = 0;
    let startTranslateX = 0;
    let shouldBlockClick = false;
    const marqueeSpeed = 70;

    originalItems.forEach((item) => {
      const clone = item.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      clone.classList.add("menu_clone");
      clone.querySelectorAll("a, button").forEach((element) => {
        element.setAttribute("tabindex", "-1");
      });
      menuTrack.appendChild(clone);
    });

    const normalizeTranslate = (value) => {
      if (!segmentWidth) {
        return 0;
      }

      let normalized = value % segmentWidth;
      if (normalized > 0) {
        normalized -= segmentWidth;
      }
      return normalized;
    };

    const applyMenuTranslate = () => {
      menuTrack.style.transform = `translateX(${currentTranslateX}px)`;
    };

    const updateMenuMarqueeSize = () => {
      const trackStyle = window.getComputedStyle(menuTrack);
      const gap = Number.parseFloat(trackStyle.columnGap || trackStyle.gap) || 0;
      segmentWidth = originalItems.reduce(
        (total, item) => total + item.getBoundingClientRect().width + gap,
        0,
      );
      currentTranslateX = normalizeTranslate(currentTranslateX);
      applyMenuTranslate();
    };

    const animateMenuMarquee = (time) => {
      if (!lastFrameTime) {
        lastFrameTime = time;
      }

      const deltaTime = time - lastFrameTime;
      lastFrameTime = time;

      if (!isPaused && !isPointerDown) {
        currentTranslateX = normalizeTranslate(
          currentTranslateX - (marqueeSpeed * deltaTime) / 1000,
        );
        applyMenuTranslate();
      }

      window.requestAnimationFrame(animateMenuMarquee);
    };

    const onPointerUp = () => {
      if (!isPointerDown) {
        return;
      }

      isPointerDown = false;
      menuTrack.classList.remove("is_dragging");
    };

    menuViewport.addEventListener("pointerenter", () => {
      isPaused = true;
    });

    menuViewport.addEventListener("pointerleave", () => {
      isPaused = false;
    });

    menuTrack.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) {
        return;
      }

      isPointerDown = true;
      isPaused = true;
      shouldBlockClick = false;
      startX = event.clientX;
      startTranslateX = currentTranslateX;
      menuTrack.classList.add("is_dragging");
      menuTrack.setPointerCapture(event.pointerId);
    });

    menuTrack.addEventListener("pointermove", (event) => {
      if (!isPointerDown) {
        return;
      }

      const deltaX = event.clientX - startX;
      if (Math.abs(deltaX) > 4) {
        shouldBlockClick = true;
      }

      currentTranslateX = normalizeTranslate(startTranslateX + deltaX);
      applyMenuTranslate();
    });

    menuTrack.addEventListener("pointerup", onPointerUp);
    menuTrack.addEventListener("pointercancel", onPointerUp);
    menuTrack.addEventListener("lostpointercapture", onPointerUp);

    menuTrack.addEventListener(
      "click",
      (event) => {
        if (!shouldBlockClick) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        shouldBlockClick = false;
      },
      true,
    );

    window.addEventListener("resize", updateMenuMarqueeSize);
    updateMenuMarqueeSize();
    window.requestAnimationFrame(animateMenuMarquee);
  }
});
