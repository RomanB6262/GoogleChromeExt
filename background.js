// List of known phishing URLs (replace with your own list or API)
const phishingUrls = [
  "phishingsite1.com",
  "phishingsite2.com",
  "malicioussite.com",
  "codepen.io"
];

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const url = new URL(tab.url);
    const hostname = url.hostname;

    // Check if the hostname is in the phishing list
    if (phishingUrls.includes(hostname)) {
      // Send a notification about phishing detection
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'logo.png',
        title: 'Phishing Site Detected!',
        message: `This site (${hostname}) is known for phishing. Do not proceed!`,
        priority: 2
      });

      // Optionally, you can log it or handle other background tasks
      console.log(`Phishing site detected: ${hostname}`);
    }
  }
});
