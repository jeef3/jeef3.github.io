(function () {
  const carouselEl = document.querySelector("[data-carousel]");

  const scrollerEl = carouselEl.querySelector("[data-carousel-scroller]");

  const indexEl = carouselEl.querySelector("[data-carousel-index]");
  const indexButtonEls = indexEl.querySelectorAll("[data-carousel-index-card]");

  scrollerEl.addEventListener("scroll", handleScrollerScroll);
  indexButtonEls.forEach((bt) =>
    bt.addEventListener("click", handleIdxCardClick),
  );

  let debouncer = null;

  function handleScrollerScroll() {
    if (debouncer) {
      clearTimeout(debouncer);
    }

    debouncer = setTimeout(() => {
      debouncer = null;
      scrollerEl.querySelectorAll("[data-carousel-card]").forEach((el) => {
        if (el.offsetLeft === scrollerEl.scrollLeft) {
          const target = el.getAttribute("data-carousel-card");

          indexButtonEls.forEach((bt) => bt.classList.remove("active"));
          indexEl
            .querySelector(`[data-carousel-index-card="${target}"]`)
            .classList.add("active");
        }
      });
    }, 200);
  }

  function handleIdxCardClick(e) {
    const show = e.currentTarget.getAttribute("data-carousel-index-card");

    const fig = carouselEl.querySelector(`[data-carousel-card="${show}"]`);

    scrollerEl.scrollTo({ left: fig.offsetLeft, behavior: "smooth" });
  }
})();
