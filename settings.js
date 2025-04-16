document.addEventListener("DOMContentLoaded", function () {
  const themeSelect = document.getElementById("theme");
  const languageSelect = document.getElementById("language");
  const confirmButton = document.getElementById("confirmButton");
  const blacklistTextarea = document.getElementById("blacklist");
  const saveListsButton = document.getElementById("saveLists");
  const body = document.body;

  let selectedTheme = localStorage.getItem("theme") || "light";
  let selectedLang = "en";

  body.classList.add(`${selectedTheme}-theme`);
  if (themeSelect) themeSelect.value = selectedTheme;

  // === Load language and apply ===
  chrome.storage.local.get("selectedLang", async (data) => {
    selectedLang = data.selectedLang || "en";
    if (languageSelect) languageSelect.value = selectedLang;
    const langData = await loadLanguageFile(selectedLang);
    applyTranslations(langData);
  });

  // === Confirm changes (settings.html only) ===
  if (confirmButton) {
    confirmButton.addEventListener("click", async () => {
      const newTheme = themeSelect?.value;
      const newLang = languageSelect?.value;

      if (confirm("Are you sure you want to apply your changes?")) {
        body.classList.remove("light-theme", "dark-theme");
        body.classList.add(`${newTheme}-theme`);
        localStorage.setItem("theme", newTheme);

        const langData = await loadLanguageFile(newLang);
        applyTranslations(langData);
        chrome.storage.local.set({ selectedLang: newLang });

        alert("Changes applied successfully!");
      }
    });
  }

  // === Load blacklist ===
  if (blacklistTextarea) {
    chrome.storage.local.get(["blacklist"], (data) => {
      if (data.blacklist) {
        blacklistTextarea.value = data.blacklist.join("\n");
      }
    });
  }

  // === Save blacklist ===
  if (saveListsButton) {
    saveListsButton.addEventListener("click", () => {
      const blacklist = blacklistTextarea.value
        .split("\n")
        .map((url) => url.trim())
        .filter((url) => url);

      chrome.storage.local.set({ blacklist }, () => {
        alert("Blacklist saved successfully.");
      });
    });
  }

  // === Load language JSON ===
  async function loadLanguageFile(lang) {
    try {
      const res = await fetch(`lang/lang-${lang}.json`);
      return await res.json();
    } catch (err) {
      console.error("Failed to load language file:", err);
      return {};
    }
  }

  // === Apply translations globally ===
  function applyTranslations(lang) {
    if (!lang) return;

    const translations = {
      // Common
      settingsPageTitle: "settingsPage",
      backButtonLabel: "back",
      settingsTitle: "settingsTitle",
      extensionCustomisability: "extensionCustomization",

      // Settings.html
      languageHeading: "language",
      selectLanguage: "selectLanguage",
      themeHeading: "theme",
      selectTheme: "selectTheme",
      confirmButton: "confirmChanges",
      notificationsHeading: "notifications",
      enableNotifications: "enableNotifications",
      notificationType: "notificationType",
      popupAlertsOption: "popupAlerts",
      soundAlertsOption: "soundAlerts",
      antiphishingSettings: "antiphishing",
      sensitivityHeading: "sensitivity",
      sensitivityLabel: "adjustSensitivity",
      sensitivityLowOption: "low",
      sensitivityMediumOption: "medium",
      sensitivityHighOption: "high",
      blacklistHeading: "blacklist",
      blacklistLabel: "blacklistLabel",
      blacklistDesc: "blacklistDesc",
      blacklistPlaceholder: "blacklistPlaceholder",
      saveLists: "saveLists",
      logsHeading: "logs",
      viewLogsLabel: "viewLogs",
      clearLogs: "clearLogs",
      exportLogs: "exportLogs",
      activityLogs: "noLogs",
      realTimeHeading: "realtime",
      realTimeNote: "realtimeNote",

      // index.html
      logoTitle: "title",
	  aboutPage: "aboutPage",
	  donationPage: "donationPage",
	  syncSettings: "syncSettings",
      phishingHeading: "phishingHeading",
      onThisPageLabel: "onPage",
      inTotalLabel: "inTotal",
      scannerHeading: "pageScanner",
      scanPageBtnText: "scanBtn",
      scanResult: "resultNotScanned",
      urlCheckerHeading: "urlChecker",
      checkUrlBtnText: "checkUrlBtn",
      urlCheckResult: "urlResult",
      urlInput: "urlPlaceholder",
      allowHeading: "allowDefault",
      allowLabel: "allowDefault",
      urlNoteBold: "noteLabel",
      urlNoteText: "urlNote",
      footerText: "copyright",

      // support.html
      supportTitle: "supportTitle",
      supportHeading: "supportHeading",
      reportHeading: "reportHeading",
      nameLabel: "nameLabel",
      emailLabel: "emailLabel",
      issueTypeLabel: "issueTypeLabel",
      describeOption: "describeOption",
      reportOption: "reportOption",
      describeLabel: "describeLabel",
      submitButton: "submitButton",

      // about.html
      aboutPageTitle: "aboutPageTitle",
      aboutHeader: "aboutHeader",
      aboutPhishGuardHeading: "aboutPhishGuardHeading",
      versionLabel: "versionLabel",
      developerLabel: "developerLabel",
      descriptionLabel: "descriptionLabel",
      termsLabel: "termsLabel",
      termsLink: "termsLink",
      contactHeading: "contactHeading",
      yourNameLabel: "yourNameLabel",
      yourEmailLabel: "yourEmailLabel",
      yourMessageLabel: "yourMessageLabel",
      sendMessageBtn: "sendMessageBtn",

      // donation.html
      donationHeader: "donationHeader",
      whySupportHeading: "whySupportHeading",
      whySupportText: "whySupportText",
      howHelpHeading: "howHelpHeading",
      howHelpText: "howHelpText",
      donateAction: "donateAction",
      donateDetail: "donateDetail",
      shareAction: "shareAction",
      shareDetail: "shareDetail",
      donateNowBtn: "donateNowBtn",
      thankYouText: "thankYouText"
    };

    for (const [id, key] of Object.entries(translations)) {
      const el = document.getElementById(id);
      if (el && lang[key]) {
        if (["INPUT", "TEXTAREA"].includes(el.tagName)) {
          if (el.placeholder) {
            el.placeholder = lang[key];
          } else {
            el.value = lang[key];
          }
        } else if (el.tagName === "BUTTON") {
          el.textContent = lang[key];
        } else {
          el.textContent = lang[key];
        }
      }
    }

    // Set the page <title>
    if (lang.settingsPage) {
      document.title = lang.settingsPage;
    }
  }
});
