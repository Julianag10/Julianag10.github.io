const eyes = document.querySelectorAll(".creepy-btn__pupil");
const button = document.querySelector(".creepy-btn");

button.addEventListener("mousemove", e => {
  const rect = button.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width - 0.5;
  const y = (e.clientY - rect.top) / rect.height - 0.5;

  eyes.forEach(p => {
    p.style.transform = `translate(${x * 12}px, ${y * 12}px)`;
  });
});

button.addEventListener("mouseleave", () => {
  eyes.forEach(p => p.style.transform = "translate(0,0)");
});
