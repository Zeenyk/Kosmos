const starfield = document.getElementById('starfield');
const numStars = 750;

for (let i = 0; i < numStars; i++) {
  const star = document.createElement('div');
  star.classList.add('star');
  
  const size = Math.random() * 2 + 1;
  const x = Math.random() * window.innerWidth;
  const y = Math.random() * window.innerHeight;
  const duration = Math.random() * 3 + 2;

  star.style.width = `${size}px`;
  star.style.height = `${size}px`;
  star.style.top = `${y}px`;
  star.style.left = `${x}px`;
  star.style.animationDuration = `${duration}s`;
  star.style.opacity = Math.random() * 0.5 + 0.3;

  starfield.appendChild(star);
}
