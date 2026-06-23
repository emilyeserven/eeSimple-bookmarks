/* global chrome */
const setupEl = document.getElementById("setup");
const openingEl = document.getElementById("opening");
const urlInput = document.getElementById("serverUrl");
const saveBtn = document.getElementById("saveBtn");
const statusEl = document.getElementById("status");

function openQuickAdd(serverUrl) {
  chrome.tabs.query({
    active: true,
    currentWindow: true,
  }, ([tab]) => {
    const u = encodeURIComponent(tab?.url ?? "");
    const t = encodeURIComponent(tab?.title ?? "");
    const w = 460, h = 640;
    const x = Math.max(0, screen.width - w - 24);
    chrome.windows.create({
      url: `${serverUrl}/quick-add?url=${u}&title=${t}`,
      type: "popup",
      width: w,
      height: h,
      left: x,
      top: 24,
    });
    window.close();
  });
}

chrome.storage.local.get("serverUrl", ({
  serverUrl,
}) => {
  if (!serverUrl) {
    openingEl.style.display = "none";
    setupEl.style.display = "block";
    urlInput.focus();
  }
  else {
    openQuickAdd(serverUrl);
  }
});

saveBtn?.addEventListener("click", () => {
  const url = urlInput.value.trim().replace(/\/+$/, "");
  if (!url) {
    statusEl.textContent = "Please enter a URL.";
    return;
  }
  chrome.storage.local.set({
    serverUrl: url,
  }, () => openQuickAdd(url));
});

urlInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") saveBtn.click();
});
