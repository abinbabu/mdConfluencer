const markdownInput = document.getElementById("markdownInput");
const fileInput = document.getElementById("fileInput");
const stripTopHeader = document.getElementById("stripTopHeader");
const removeTextNewlines = document.getElementById("removeTextNewlines");
const convertBtn = document.getElementById("convertBtn");
const copyBtn = document.getElementById("copyBtn");
const clearBtn = document.getElementById("clearBtn");
const outputBox = document.getElementById("outputBox");
const previewBox = document.getElementById("previewBox");
const statusEl = document.getElementById("status");
const apiBase =
  window.location.protocol === "file:"
    ? "http://localhost:8000"
    : window.location.origin;

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.style.color = isError ? "#bf2600" : "#42526e";
}

fileInput.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  const text = await file.text();
  markdownInput.value = text;
  setStatus(`Loaded ${file.name}`);
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
    if (window.ClipboardItem) {
      const item = new ClipboardItem({
        "text/html": new Blob([converted], { type: "text/html" }),
        "text/plain": new Blob([converted], { type: "text/plain" }),
      });
      await navigator.clipboard.write([item]);
      setStatus("Rich output copied. Paste into Confluence editor.");
    } else {
      await navigator.clipboard.writeText(converted);
      setStatus("Output copied as plain text (browser fallback).");
    }
  } catch {
    setStatus("Clipboard copy failed. Copy manually from output box.", true);
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
