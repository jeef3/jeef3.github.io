(function () {
  const carousel = document.querySelector("[data-carousel]");
  const scroller = carousel.querySelector("[data-carousel-scroller]");

  const idx = carousel.querySelector("[data-carousel-index]");

  const buttons = idx.querySelectorAll("[data-carousel-index-card]");
  buttons.forEach((bt) => bt.addEventListener("click", handleIdxCardClick));

  function handleIdxCardClick(e) {
    const show = e.currentTarget.getAttribute("data-carousel-index-card");

    buttons.forEach((bt) => bt.classList.remove("active"));

    e.currentTarget.classList.add("active");

    const fig = carousel.querySelector(`[data-carousel-card="${show}"]`);

    scroller.scrollTo({ left: fig.offsetLeft, behavior: "smooth" });
  }
})();
