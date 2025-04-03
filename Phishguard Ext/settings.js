document.addEventListener("DOMContentLoaded", function () {
  const themeSelect = document.getElementById("theme");
  const confirmButton = document.getElementById("confirmButton");
  const body = document.body;

  const blacklistTextarea = document.getElementById("blacklist");
  const saveListsButton = document.getElementById("saveLists");

  // Load saved theme from localStorage
  const savedTheme = localStorage.getItem("theme") || "light";
  body.classList.add(`${savedTheme}-theme`);
  themeSelect.value = savedTheme;

  // Handle Confirm Changes button click (Theme)
  confirmButton.addEventListener("click", function () {
    const selectedTheme = themeSelect.value;

    const isConfirmed = confirm("Are you sure you want to change the theme?");
    if (isConfirmed) {
      body.classList.remove("light-theme", "dark-theme");
      body.classList.add(`${selectedTheme}-theme`);
      localStorage.setItem("theme", selectedTheme);
      alert("Theme changed successfully!");
    }
  });

  // Load saved blacklist from chrome.storage
  chrome.storage.local.get(["blacklist"], (data) => {
    if (data.blacklist) blacklistTextarea.value = data.blacklist.join("\n");
  });

  // Handle Save List button click
  saveListsButton.addEventListener("click", () => {
    const blacklist = blacklistTextarea.value
      .split("\n")
      .map(url => url.trim())
      .filter(url => url);

    chrome.storage.local.set({ blacklist }, () => {
      alert("Blacklist saved successfully.");
    });
  });
});
