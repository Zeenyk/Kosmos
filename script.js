let lastScrollY = window.scrollY;
const sections = document.querySelectorAll('.my-section');

window.addEventListener('scroll', () => {
  const currentScrollY = window.scrollY;

  sections.forEach((section) => {
    if (currentScrollY > lastScrollY) {
      section.style.position = 'relative';
    } else if (currentScrollY < lastScrollY) {
      section.style.position = 'absolute';
    }
  });

  lastScrollY = currentScrollY;
});
