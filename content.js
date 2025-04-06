function showPhishingModal(domain) {
  const modal = document.createElement("div");
  modal.innerHTML = `
    <div id="phishguard-warning" style="
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Segoe UI', sans-serif;
    ">
      <div style="
        background: rgba(255, 255, 255, 0.75);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border-radius: 16px;
        padding: 30px 35px;
        width: 360px;
        box-shadow: 0 8px 30px rgba(0,0,0,0.25);
        animation: fadeInUp 0.25s ease-out;
        text-align: center;
      ">
        <div style="font-size: 40px; margin-bottom: 12px;">⚠️</div>
        <h2 style="font-size: 20px; margin: 0 0 10px;">Phishing Alert</h2>
        <p style="color: #222; font-size: 14px; margin-bottom: 24px;">
          This site <strong>${domain}</strong> is flagged as phishing.<br>
          Do you want to leave?
        </p>
        <div style="display: flex; justify-content: center; gap: 10px;">
          <button id="phishguard-leave" style="
            background: #e53935;
            color: white;
            padding: 10px 18px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.2s ease;
          ">Leave</button>
          <button id="phishguard-stay" style="
            background: #444;
            color: white;
            padding: 10px 18px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.2s ease;
          ">Stay</button>
        </div>
      </div>
    </div>

    <style>
      @keyframes fadeInUp {
        from {
          transform: translateY(20px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
      #phishguard-leave:hover {
        background: #c62828;
        transform: scale(1.02);
      }
      #phishguard-stay:hover {
        background: #333;
        transform: scale(1.02);
      }
    </style>
  `;

  document.body.appendChild(modal);

  document.getElementById("phishguard-leave").onclick = () => {
    window.location.href = "https://google.com";
  };

  document.getElementById("phishguard-stay").onclick = () => {
    document.getElementById("phishguard-warning").remove();
  };
}

// === CHECK ALLOWLIST BEFORE WARNING ===
const domain = location.hostname.replace(/^www\\./, "").toLowerCase();

chrome.storage.local.get({ allowedSites: [] }, ({ allowedSites }) => {
  if (!allowedSites.includes(domain)) {
    showPhishingModal(domain);
  }
});
