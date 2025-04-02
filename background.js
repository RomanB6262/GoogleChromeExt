const CORS_PROXY = "https://cors-anywhere.herokuapp.com/";
const OPENPHISH_URL = "https://openphish.com/feed.txt";

let phishingList = new Set();

// Fetch phishing sites and store them
function updatePhishingList() {
  fetch(CORS_PROXY + OPENPHISH_URL)
    .then(response => response.text())
    .then(data => {
      phishingList = new Set(data.split("\n").map(url => url.trim()));
      console.log("Phishing list updated:", phishingList.size, "entries");
    })
    .catch(error => console.error("Failed to fetch OpenPhish data:", error));
}

// Check if a site is in the phishing list
function checkPhishingSite(url, tabId) {
  if (phishingList.has(url) || url === "https://codepen.io/pen/") {  
    chrome.notifications.create("", {
      type: "basic",
      iconUrl: "logo.png",
      title: "⚠️ Phishing Alert!",
      message: `Warning! This site (${url}) is a phishing attempt.`,
      priority: 2
    });
    
	// (Optional) Redirect the user away
    chrome.tabs.update(tabId, { url: "https://www.google.com" });
  }
}


// Update phishing list every hour
setInterval(updatePhishingList, 60 * 60 * 1000);
updatePhishingList(); // Fetch data on extension load

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    checkPhishingSite(tab.url, tabId);
	
  }
});
