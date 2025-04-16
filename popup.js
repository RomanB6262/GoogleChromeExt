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
          const apiKey = 'jFIiv513heHILP8OLlAXxtqwJ-Ei8gw7dRY3tpWS.1SGtjdQXa7fwEN6w-NlLClV';
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
              score: 16,
              trustRating: 0,
              color: "black"
            };
          }

          let score = 0;
          if (domain.match(/\b\d{1,3}(\.\d{1,3}){3}\b/)) score += 3;
          if ((domain.match(/-/g) || []).length >= 3) score += 2;
          if (location.protocol !== "https:") score += 4;

          const forms = document.querySelectorAll("form");
          forms.forEach(form => {
            if (form.action.startsWith("http:") && form.querySelector("input[type='password']")) {
              score += 4;
            }
          });

          const age = await getDomainAge(domain);
          if (age < 30) score += 3;

          const maxScore = 16;
          const trustRating = Math.max(0, Math.round((1 - score / maxScore) * 100));
          const status = score >= 5 ? "phishing" : "safe";

          let color = "green";
          if (trustRating < 70) color = "yellow";
          if (trustRating < 40) color = "red";

          return { status, score, trustRating, color };
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
    const { status, trustRating, color } = message.scanResult;
    const resultElement = document.getElementById("scanResult");
    const ring = document.querySelector('.circle');
    const label = document.getElementById('trustLabel');

    if (status === "blacklisted") {
      resultElement.innerHTML = `
        <strong style="color:black;">🚫 This is a phishing website</strong><br>
        <strong>Trust Rating:</strong> <span style="color:black; font-weight: bold;">0 / 100</span>
      `;
      if (ring && label) {
        ring.setAttribute('stroke-dasharray', "100, 100");
        ring.setAttribute('stroke', "black");
        label.textContent = "0%";
      }
      return;
    }

    resultElement.innerHTML = `
      <strong>Result:</strong> ${status === 'phishing' ? '⚠️ Phishing Detected' : '✅ Safe'}<br>
      <strong>Trust Rating:</strong> <span style="color:${color}; font-weight: bold;">${trustRating} / 100</span>
    `;
    if (ring && label) {
      ring.setAttribute('stroke-dasharray', `${trustRating}, 100`);
      ring.setAttribute('stroke', color);
      label.textContent = `${trustRating}%`;
    }
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

    let score = 0;

    if (domain.match(/\b\d{1,3}(\.\d{1,3}){3}\b/)) score += 3;
    if ((domain.match(/-/g) || []).length >= 3) score += 2;
    if (!url.protocol.includes("https")) score += 4;

    try {
      const apiKey = 'jFIiv513heHILP8OLlAXxtqwJ-Ei8gw7dRY3tpWS.1SGtjdQXa7fwEN6w-NlLClV';
      const apiUrl = `https://endpoint.apivoid.com/domainage/v1/?key=${apiKey}&host=${domain}`;
      const response = await fetch(apiUrl);
      const data = await response.json();
      if (response.ok && !data.error) {
        const age = data.data.domain_age_in_days;
        if (age < 30) score += 3;
      }
    } catch (err) {
      console.error("WHOIS fetch failed", err);
    }

    const maxScore = 16;
    const trustRating = Math.max(0, Math.round((1 - score / maxScore) * 100));
    let color = "green";
    if (trustRating < 70) color = "yellow";
    if (trustRating < 40) color = "red";

    resultText.innerHTML = `
      <strong>Result:</strong> ${trustRating < 40 ? '⚠️ Potentially Unsafe' : '✅ Appears Safe'}<br>
      <strong>Trust Rating:</strong> <span style="color:${color}; font-weight: bold;">${trustRating} / 100</span>
    `;
    bar.style.width = `${trustRating}%`;
    bar.style.backgroundColor = color;
  });
});

// === ALLOW THIS WEBSITE BY DEFAULT ===
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
