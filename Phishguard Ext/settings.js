document.addEventListener("DOMContentLoaded", function () {
  const themeSelect = document.getElementById("theme");
  const confirmButton = document.getElementById("confirmButton");
  const body = document.body;

  // Load saved theme from localStorage
  const savedTheme = localStorage.getItem("theme") || "light";
  body.classList.add(`${savedTheme}-theme`);
  themeSelect.value = savedTheme;

  // Handle Confirm Changes button click
  confirmButton.addEventListener("click", function () {
    const selectedTheme = themeSelect.value;

    // Show confirmation dialog
    const isConfirmed = confirm("Are you sure you want to change the theme?");
    if (isConfirmed) {
      // Remove existing theme class
      body.classList.remove("light-theme", "dark-theme");

      // Add new theme class
      body.classList.add(`${selectedTheme}-theme`);

      // Save theme preference to localStorage
      localStorage.setItem("theme", selectedTheme);

      alert("Theme changed successfully!");
    }
  });
});