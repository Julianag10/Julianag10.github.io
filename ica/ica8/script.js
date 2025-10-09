document.addEventListener("DOMContentLoaded", () => {
  // ---------------- FORM PAGE ----------------
  const form = document.getElementById("volunteerForm");
  if (form) {
    const messages = document.getElementById("formMessages");

    form.addEventListener("submit", function(event) {
      event.preventDefault();
      let errors = [];

      const name = document.getElementById("name").value.trim();
      const email = document.getElementById("email").value.trim();
      const program = document.getElementById("program").value;

      if (localStorage.getItem("allowDataCollection") !== "false") {
        localStorage.setItem("name", name);
        localStorage.setItem("email", email);
        localStorage.setItem("program", program);
      }

      if (name === "") errors.push("Name is required.");
      if (email === "" || !/\S+@\S+\.\S+/.test(email)) errors.push("A valid email is required.");
      if (program === "") errors.push("Please select a program.");

      if (errors.length > 0) {
        messages.innerHTML = errors.map(err => `<p class="error">${err}</p>`).join("");
      } else {
        messages.innerHTML = `<p class="success">Thank you for signing up, ${name}! We’ll be in touch soon.</p>`;
        form.reset();
      }
    });
  }

//============= SETTINGS PAGE =======================================
  const clearBtn = document.getElementById("clearData");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      localStorage.clear();
      alert("All your saved data has been cleared!");
    });
  }

  const optOutCheckbox = document.getElementById("dataCollection");
  if (optOutCheckbox) {
    // Load saved preference (if it exists)
    let optIn = localStorage.getItem("allowDataCollection");

    if (optIn === null) {
      optIn = "true"; // default
      localStorage.setItem("allowDataCollection", "true");
    }

    // Set checkbox state based on stored value
    optOutCheckbox.checked = (optIn === "true");

    // Save new preference when user toggles checkbox
    optOutCheckbox.addEventListener("change", () => {
      localStorage.setItem("allowDataCollection", optOutCheckbox.checked);
    });
  }

  // ---------------- HAMBURGER ----------------
  const navToggle = document.querySelector(".nav-toggle");
  const navMenu = document.querySelector(".nav-menu");

  if (navToggle && navMenu) {
    navToggle.addEventListener("click", () => {
      navToggle.classList.toggle("active"); // animate lines into "X"
      navMenu.classList.toggle("show");     // show/hide dropdown menu

      // accessibility update
      const expanded = navToggle.getAttribute("aria-expanded") === "true";
      navToggle.setAttribute("aria-expanded", !expanded);
    });
  }
});
