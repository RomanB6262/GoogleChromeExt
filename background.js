const LOCAL_PHISHING_LIST = "Assets/phishingList.txt";
const OPENPHISH_URL = "https://openphish.com/feed.txt";

let phishingList = new Set();

loadLocalPhishingList();
updatePhishingList();

// Normalise URLs to avoid trailing slash mismatches
function normalizeUrl(url) {
  try {
    const parsed = new URL(url.trim());
    const pathname = parsed.pathname.endsWith('/') ? parsed.pathname : parsed.pathname + '/';
    return `${parsed.origin}${pathname.toLowerCase()}`;
  } catch {
    return url.trim().toLowerCase();
  }
}

// Load phishing list from bundled local file
function loadLocalPhishingList() {
  fetch(chrome.runtime.getURL(LOCAL_PHISHING_LIST))
    .then(response => response.text())
    .then(data => {
      const urls = data.split("\n")
        .map(url => normalizeUrl(url))
        .filter(url => {
          try {
            new URL(url); // validate
            return !!url;
          } catch {
            console.warn("❌ Invalid URL skipped:", url);
            return false;
          }
        });

      phishingList = new Set(urls);

      chrome.storage.local.set({ phishingList: Array.from(phishingList) }, () => {
        console.log("📁 Local phishing list loaded into storage:", phishingList.size, "entries");

        chrome.storage.local.getBytesInUse(null, (bytes) => {
          console.log("🧠 Storage usage:", bytes, "bytes");
        });
      });
    })
    .catch(err => console.error("❌ Error loading local phishing list:", err));
}

// Updates phishing list from OpenPhish and merges with local list
function updatePhishingList() {
  fetch(OPENPHISH_URL)
    .then(response => response.text())
    .then(data => {
      const openphishUrls = data.split("\n")
        .map(url => normalizeUrl(url))
        .filter(url => !!url);

      chrome.storage.local.get({ phishingList: [] }, (existing) => {
        const merged = new Set([...existing.phishingList, ...openphishUrls]);
        phishingList = merged;

        chrome.storage.local.set({ phishingList: Array.from(merged) }, () => {
          console.log("🔄 Phishing list updated from OpenPhish:", merged.size, "entries");
        });
      });
    })
    .catch(error => console.error("❌ Failed to fetch OpenPhish data:", error));
}

// Check tab URL against phishing list and user-defined blacklist
function checkPhishingSite(url, tabId) {
  try {
    const currentUrl = normalizeUrl(url);
    const currentHost = new URL(currentUrl).hostname.toLowerCase();
    console.log("🔍 Checking tab URL:", currentUrl);

    chrome.storage.local.get(["blacklist"], (storageData) => {
      const dynamicBlacklist = new Set([
        ...phishingList,
        ...(storageData.blacklist || [])
      ]);

      for (const entry of dynamicBlacklist) {
        try {
          const phishUrl = normalizeUrl(entry);
          const phishHost = new URL(phishUrl).hostname.toLowerCase();

          console.log("👀 Comparing to phishing entry:", phishUrl);

          if (
            currentUrl === phishUrl ||
            currentUrl.startsWith(phishUrl) ||
            currentHost === phishHost ||
            currentHost.endsWith(`.${phishHost}`)
          ) {
            console.log("🚨 MATCH FOUND:", currentUrl, "matches", phishUrl);

            chrome.scripting.executeScript({
              target: { tabId: tabId },
              files: ["content.js"]
            }, () => {
              console.log("⚠️ Injected phishing modal into tab:", tabId);
            });

            return;
          }
        } catch (err) {
          console.warn("⚠️ Skipping invalid phishing entry:", entry, err.message);
        }
      }

      console.log("✅ No phishing match found for:", currentUrl);
    });

  } catch (error) {
    console.error("❌ Error in checkPhishingSite:", error);
  }
}

// Listen for tab loads to scan them
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    checkPhishingSite(tab.url, tabId);
  }
});

// Handle uninstall tracking
chrome.runtime.setUninstallURL("https://RomanB6262.github.io/GoogleChromeExt/uninstall.html");

// Listener for trust meter blacklist checks from popup.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.checkBlacklist) {
    const url = message.checkBlacklist.trim();
    const normalized = normalizeUrl(url);

    chrome.storage.local.get(["phishingList", "blacklist"], (data) => {
      const localList = new Set(data.phishingList || []);
      const userList = new Set(data.blacklist || []);
      const fullList = new Set([...localList, ...userList]);

      const isBlacklisted = [...fullList].some(phishUrl => {
        try {
          const normalizedPhish = normalizeUrl(phishUrl);
          return normalized.includes(normalizedPhish) || normalized.includes(new URL(normalizedPhish).hostname);
        } catch {
          return false;
        }
      });

      sendResponse({ blacklisted: isBlacklisted });
    });

    return true; // Required for async response
  }
});
