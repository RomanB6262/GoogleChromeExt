// === SUPPORT + SETTINGS ===
document.getElementById("supportButton").addEventListener("click", function () {
  window.location.href = "support.html";
});

document.getElementById("settingsButton").addEventListener("click", function () {
  window.location.href = "settings.html";
});

// === PAGE SCANNER ===
document.getElementById("scanPageBtn").addEventListener("click", async () => {
  const resultElement = document.getElementById("scanResult");

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: async () => {
        const domain = location.hostname;

        async function getDomainAge(domain) {
          const apiKey = 'jFIiv513heHILP8OLlAXxtqw7dRY3tpWS.1SGtjdQXa7fwEN6w-NlLClV';
          const apiUrl = `https://endpoint.apivoid.com/domainage/v1/?key=${apiKey}&host=${domain}`;
          try {
            const response = await fetch(apiUrl);
            const data = await response.json();
            if (!response.ok || data.error) return 0;
            return data.data.domain_age_in_days;
          } catch {
            return 0;
          }
        }

        async function runHeuristicDetection() {
          const response = await chrome.runtime.sendMessage({ checkBlacklist: domain });
          if (response?.blacklisted) {
            return {
              status: "blacklisted",
              score: 60,
              trustRating: 0,
              color: "black",
              message: "🚫 This is a phishing website",
              flags: 5
            };
          }

          let score = 0;
          let flags = 0;
          const maxScore = 60;

          if (location.protocol !== "https:") { score += 20; flags++; }
          if (domain.match(/\b\d{1,3}(\.\d{1,3}){3}\b/)) { score += 3; flags++; }
          if ((domain.match(/-/g) || []).length >= 3) { score += 2; flags++; }
          if (domain.length > 30) { score += 2; flags++; }

          const phishingKeywords = ["login", "verify", "secure", "account", "update", "bank"];
          if (phishingKeywords.some(keyword => domain.includes(keyword))) { score += 2; flags++; }

          if (domain.startsWith("xn--")) { score += 4; flags++; }

          const badTLDs = [".tk", ".ml", ".ga", ".cf", ".gq"];
          if (badTLDs.some(tld => domain.endsWith(tld))) { score += 2; flags++; }

          const forms = document.querySelectorAll("form");
          forms.forEach(form => {
            if (form.action.startsWith("http:") && form.querySelector("input[type='password']")) {
              score += 4; flags++;
            }
            if (form.action && !form.action.includes(domain)) {
              score += 3; flags++;
            }
          });

          const age = await getDomainAge(domain);
          if (age < 30) { score += 3; flags++; }

          const trustRating = Math.max(0, Math.round((1 - score / maxScore) * 100));
          let color = "green";
          let message = "✅ Appears Safe";

          if (flags >= 4) {
            color = "red";
            message = "❌ Don’t Trust This Website";
          } else if (flags >= 2) {
            color = "orange";
            message = "⚠️ Be Cautious";
          }

          return { trustRating, score, color, message, flags };
        }

        const result = await runHeuristicDetection();
        chrome.runtime.sendMessage({ scanResult: result });
      }
    });

  } catch (error) {
    resultElement.textContent = `Error: ${error.message}`;
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.scanResult) {
    const { trustRating, color, message: msg, flags } = message.scanResult;
    const resultElement = document.getElementById("scanResult");
    const ring = document.querySelector('.circle');
    const label = document.getElementById('trustLabel');

    resultElement.innerHTML = `
      <strong>Result:</strong> ${msg}<br>
      <strong>Trust Rating:</strong> <span style="color:${color}; font-weight: bold;">${trustRating} / 100</span>
    `;
    if (ring && label) {
      ring.setAttribute('stroke-dasharray', `${trustRating}, 100`);
      ring.setAttribute('stroke', color);
      label.textContent = `${trustRating}%`;
    }

    // Update phishing attempts count
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      const domain = new URL(tab.url).hostname.replace(/^www\./, "");
      const domainKey = `flags_${domain}`;

      chrome.storage.local.get(["phishingTotal", domainKey], (data) => {
        const currentPageFlags = flags;
        const totalSoFar = typeof data.phishingTotal === "number" ? data.phishingTotal : 0;
        const updatedTotal = totalSoFar + currentPageFlags;

        chrome.storage.local.set({
          phishingTotal: updatedTotal,
          [domainKey]: currentPageFlags
        }, () => {
          const pageSpan = document.getElementById("onThisPage");
          const totalSpan = document.getElementById("inTotal");
          if (pageSpan) pageSpan.textContent = currentPageFlags;
          if (totalSpan) totalSpan.textContent = updatedTotal;
        });
      });
    });
  }
});

// === URL CHECKER ===
document.getElementById("checkUrlBtn").addEventListener("click", async () => {
  const input = document.getElementById("urlInput").value;
  const resultText = document.getElementById("urlCheckResult");
  const bar = document.getElementById("urlTrustBar");

  if (!input) {
    resultText.textContent = "Please enter a valid URL.";
    return;
  }

  let url;
  try {
    url = new URL(input);
  } catch {
    resultText.textContent = "Invalid URL format.";
    return;
  }

  const domain = url.hostname;
  let score = 0;
  let flags = 0;
  const maxScore = 60;

  chrome.runtime.sendMessage({ checkBlacklist: domain }, async (response) => {
    if (response && response.blacklisted) {
      resultText.innerHTML = `
        <strong style="color:black;">🚫 This is a phishing website</strong><br>
        <strong>Trust Rating:</strong> <span style="color:black; font-weight: bold;">0 / 100</span>
      `;
      bar.style.width = "100%";
      bar.style.backgroundColor = "black";
      return;
    }

    if (url.protocol === "http:") { score += 20; flags++; }
    if (domain.match(/\b\d{1,3}(\.\d{1,3}){3}\b/)) { score += 3; flags++; }
    if ((domain.match(/-/g) || []).length >= 3) { score += 2; flags++; }
    if (domain.length > 30) { score += 2; flags++; }

    const phishingKeywords = ["login", "verify", "secure", "account", "update", "bank"];
    if (phishingKeywords.some(keyword => domain.includes(keyword))) { score += 2; flags++; }

    if (domain.startsWith("xn--")) { score += 4; flags++; }

    const badTLDs = [".tk", ".ml", ".ga", ".cf", ".gq"];
    if (badTLDs.some(tld => domain.endsWith(tld))) { score += 2; flags++; }

    try {
      const apiKey = 'jFIiv513heHILP8OLlAXxtqw7dRY3tpWS.1SGtjdQXa7fwEN6w-NlLClV';
      const apiUrl = `https://endpoint.apivoid.com/domainage/v1/?key=${apiKey}&host=${domain}`;
      const response = await fetch(apiUrl);
      const data = await response.json();
      if (response.ok && !data.error) {
        const age = data.data.domain_age_in_days;
        if (age < 30) { score += 3; flags++; }
      }
    } catch (err) {
      console.error("WHOIS fetch failed", err);
    }

    const trustRating = Math.max(0, Math.round((1 - score / maxScore) * 100));
    let color = "green";
    let message = "✅ Appears Safe";

    if (flags >= 4) {
      color = "red";
      message = "❌ Don’t Trust This Website";
    } else if (flags >= 2) {
      color = "orange";
      message = "⚠️ Be Cautious";
    }

    resultText.innerHTML = `
      <strong>Result:</strong> ${message}<br>
      <strong>Trust Rating:</strong> <span style="color:${color}; font-weight: bold;">${trustRating} / 100</span>
    `;
    bar.style.width = `${trustRating}%`;
    bar.style.backgroundColor = color;
  });
});

// === ALLOW WEBSITE ===
document.addEventListener("DOMContentLoaded", () => {
  const checkbox = document.getElementById("allowWebsite");
  if (!checkbox) return;

  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    const url = new URL(tab.url);
    const domain = url.hostname.replace(/^www\./, "").toLowerCase();

    chrome.storage.local.get({ allowedSites: [] }, ({ allowedSites }) => {
      if (allowedSites.includes(domain)) {
        checkbox.checked = true;
      }
    });

    checkbox.addEventListener("change", () => {
      chrome.storage.local.get({ allowedSites: [] }, ({ allowedSites }) => {
        if (checkbox.checked) {
          if (!allowedSites.includes(domain)) {
            allowedSites.push(domain);
            chrome.storage.local.set({ allowedSites });
          }
        } else {
          const updated = allowedSites.filter(site => site !== domain);
          chrome.storage.local.set({ allowedSites: updated });
        }
      });
    });
  });
});
