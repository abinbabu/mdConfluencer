const markdownInput = document.getElementById("markdownInput");
const fileInput = document.getElementById("fileInput");
const stripTopHeader = document.getElementById("stripTopHeader");
const removeTextNewlines = document.getElementById("removeTextNewlines");
const convertBtn = document.getElementById("convertBtn");
const copyBtn = document.getElementById("copyBtn");
const clearBtn = document.getElementById("clearBtn");
const outputBox = document.getElementById("outputBox");
const previewBox = document.getElementById("previewBox");
const clipboardStatusEl = document.getElementById("clipboardStatus");
const statusEl = document.getElementById("status");
const apiBase =
  window.location.protocol === "file:"
    ? "http://localhost:8000"
    : window.location.origin;

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.style.color = isError ? "#bf2600" : "#42526e";
}

function setClipboardStatus(message) {
  clipboardStatusEl.textContent = `Clipboard: ${message}`;
}

async function refreshClipboardStatus() {
  if (!window.isSecureContext) {
    setClipboardStatus("limited (requires https or localhost secure context)");
    return;
  }

  const hasRichApi = !!(window.ClipboardItem && navigator.clipboard?.write);
  const hasTextApi = !!navigator.clipboard?.writeText;

  if (navigator.permissions?.query) {
    try {
      const permission = await navigator.permissions.query({ name: "clipboard-write" });
      if (permission.state === "granted") {
        setClipboardStatus(hasRichApi ? "rich copy ready" : "text copy ready");
      } else if (permission.state === "prompt") {
        setClipboardStatus(hasRichApi ? "will prompt on copy (rich)" : "will prompt on copy (text)");
      } else {
        setClipboardStatus("blocked, using fallback copy");
      }
      return;
    } catch {
      // Some browsers do not expose clipboard-write through permissions query.
    }
  }

  if (hasRichApi) {
    setClipboardStatus("rich copy likely available");
  } else if (hasTextApi) {
    setClipboardStatus("text copy only (fallback)");
  } else {
    setClipboardStatus("legacy fallback only (may require Cmd+C)");
  }
}

function legacyCopyText(text) {
  const helper = document.createElement("textarea");
  helper.value = text;
  helper.setAttribute("readonly", "");
  helper.style.position = "fixed";
  helper.style.opacity = "0";
  helper.style.pointerEvents = "none";
  document.body.appendChild(helper);
  helper.focus();
  helper.select();
  const ok = document.execCommand("copy");
  document.body.removeChild(helper);
  return ok;
}

function legacyCopyRichHtml(htmlText) {
  let success = false;
  const listener = (event) => {
    event.preventDefault();
    event.clipboardData.setData("text/html", htmlText);
    event.clipboardData.setData("text/plain", htmlText);
    success = true;
  };

  document.addEventListener("copy", listener, { once: true });
  document.execCommand("copy");
  document.removeEventListener("copy", listener);
  return success;
}

fileInput.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  const text = await file.text();
  markdownInput.value = text;
  setStatus(`Loaded ${file.name}`);
});

refreshClipboardStatus();
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    refreshClipboardStatus();
  }
});

convertBtn.addEventListener("click", async () => {
  const markdown = markdownInput.value.trim();
  if (!markdown) {
    setStatus("Add Markdown input first.", true);
    return;
  }

  setStatus("Converting...");
  try {
    const response = await fetch(`${apiBase}/api/convert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        markdown,
        options: {
          stripTopHeader: stripTopHeader.checked,
          removeTextNewlines: removeTextNewlines.checked,
        },
      }),
    });

    const body = await response.json();
    if (!response.ok) {
      throw new Error(body.error || "Conversion failed");
    }

    outputBox.value = body.converted || "";
    previewBox.innerHTML = body.converted || "";
    setStatus("Converted successfully.");
  } catch (error) {
    setStatus(
      `${error.message || "Conversion failed."} Make sure backend is running at ${apiBase}.`,
      true,
    );
  }
});

copyBtn.addEventListener("click", async () => {
  const converted = outputBox.value.trim();
  if (!converted) {
    setStatus("No output available to copy.", true);
    return;
  }

  try {
    if (window.ClipboardItem && navigator.clipboard?.write) {
      const item = new ClipboardItem({
        "text/html": new Blob([converted], { type: "text/html" }),
        "text/plain": new Blob([converted], { type: "text/plain" }),
      });
      await navigator.clipboard.write([item]);
      setStatus("Rich output copied. Paste into Confluence editor.");
      return;
    }

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(converted);
      setStatus("Output copied as plain text (browser fallback).");
      return;
    }
  } catch {}

  const copiedRich = legacyCopyRichHtml(converted);
  if (copiedRich) {
    setStatus("Rich output copied using legacy browser fallback.");
    refreshClipboardStatus();
    return;
  }

  const copiedText = legacyCopyText(converted);
  if (copiedText) {
    setStatus("Output copied using legacy text fallback.");
    refreshClipboardStatus();
  } else {
    outputBox.focus();
    outputBox.select();
    setStatus("Clipboard blocked. Press Cmd+C after selecting output.", true);
    refreshClipboardStatus();
  }
});

clearBtn.addEventListener("click", () => {
  markdownInput.value = "";
  outputBox.value = "";
  previewBox.innerHTML = "";
  fileInput.value = "";
  stripTopHeader.checked = false;
  removeTextNewlines.checked = false;
  setStatus("Cleared.");
});
