/* global chrome */
const AUTO_CLOSE_MS = 5000; // keep in sync with the #progressBar animation duration in popup.html

const setupEl = document.getElementById("setup");
const formEl = document.getElementById("form");
const successEl = document.getElementById("success");

const urlInput = document.getElementById("serverUrl");
const saveBtn = document.getElementById("saveBtn");
const statusEl = document.getElementById("status");

const bmUrl = document.getElementById("bmUrl");
const addBtn = document.getElementById("addBtn");
const formError = document.getElementById("formError");

const successMsg = document.getElementById("successMsg");
const viewInboxBtn = document.getElementById("viewInboxBtn");

const progressEl = document.getElementById("progress");
const progressBar = document.getElementById("progressBar");

let serverUrl = "";
let pageTitle = "";
let closeTimer = null;

function show(state) {
  setupEl.classList.toggle("hidden", state !== "setup");
  formEl.classList.toggle("hidden", state !== "form");
  successEl.classList.toggle("hidden", state !== "success");
}

function stripTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}

// --- Boot ---------------------------------------------------------------
chrome.storage.local.get("serverUrl", ({
  serverUrl: stored,
}) => {
  if (!stored) {
    show("setup");
    urlInput.focus();
    return;
  }
  serverUrl = stripTrailingSlash(stored);
  initForm();
});

// --- Setup flow (first run) --------------------------------------------
saveBtn?.addEventListener("click", () => {
  const value = stripTrailingSlash(urlInput.value.trim());
  if (!value) {
    statusEl.textContent = "Please enter a URL.";
    return;
  }
  chrome.storage.local.set({
    serverUrl: value,
  }, () => {
    serverUrl = value;
    initForm();
  });
});

urlInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") saveBtn.click();
});

// --- Add form -----------------------------------------------------------
function initForm() {
  chrome.tabs.query({
    active: true,
    currentWindow: true,
  }, ([tab]) => {
    bmUrl.value = tab?.url ?? "";
    pageTitle = tab?.title ?? "";
    show("form");
    addBtn.focus();
  });
}

function resetAdd() {
  addBtn.disabled = false;
  addBtn.textContent = "Add";
}

async function submit() {
  const url = bmUrl.value.trim();
  formError.textContent = "";
  if (!url) {
    formError.textContent = "Please enter a URL.";
    return;
  }

  addBtn.disabled = true;
  addBtn.textContent = "Adding…";
  try {
    const res = await fetch(`${serverUrl}/api/bookmarks/inbox`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        title: pageTitle || url,
      }),
    });
    if (res.status === 201) {
      onSuccess("Queued in Inbox.");
    }
    else if (res.status === 409) {
      onSuccess("Already saved.", true);
    }
    else if (res.status === 400) {
      resetAdd();
      formError.textContent = "That doesn't look like a valid URL.";
    }
    else {
      resetAdd();
      formError.textContent = `Error saving (${res.status}).`;
    }
  }
  catch {
    resetAdd();
    formError.textContent = "Could not reach the eeSimple server.";
  }
}

addBtn?.addEventListener("click", submit);
bmUrl?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") submit();
});

// --- Success + countdown ------------------------------------------------
function onSuccess(message, hideViewInbox = false) {
  successMsg.textContent = message;
  if (hideViewInbox) {
    viewInboxBtn.classList.add("hidden");
  }
  else {
    viewInboxBtn.classList.remove("hidden");
    viewInboxBtn.onclick = () => {
      cancelCountdown();
      chrome.tabs.create({
        url: `${serverUrl}/inbox`,
      });
      window.close();
    };
  }
  show("success");
  startCountdown();
}

function startCountdown() {
  progressEl.classList.remove("hidden");
  // restart the CSS animation cleanly (force a reflow before re-adding the class)
  progressBar.classList.remove("run");
  void progressBar.offsetWidth;
  progressBar.classList.add("run");
  closeTimer = setTimeout(() => window.close(), AUTO_CLOSE_MS);
}

function cancelCountdown() {
  if (closeTimer) {
    clearTimeout(closeTimer);
    closeTimer = null;
  }
  progressBar.classList.remove("run");
  progressEl.classList.add("hidden");
}
