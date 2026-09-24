const chat = document.getElementById("chat");
const form = document.getElementById("composer");
const input = document.getElementById("message");
const micBtn = document.getElementById("micBtn");
const micStatus = document.getElementById("micStatus");
const typing = document.getElementById("typing");
const notes = document.getElementById("notes");
const voiceToggle = document.getElementById("voiceToggle");

let messages = [];
let voiceReplies = localStorage.getItem("jarvisVoice") !== "off";
let recognition = null;
let listening = false;

voiceToggle.textContent = voiceReplies ? "🔊" : "🔇";
notes.value = localStorage.getItem("jarvisNotes") || "";

function addMessage(role, text) {
  const welcome = chat.querySelector(".welcome");
  if (welcome) welcome.remove();

  messages.push({ role, content: text });

  const row = document.createElement("div");
  row.className = `message-row ${role === "user" ? "user" : "assistant"}`;

  const bubble = document.createElement("div");
  bubble.className = `message ${role}`;
  bubble.innerHTML = `<span class="label">${role === "user" ? "YOU" : "JARVIS"}</span>`;
  bubble.appendChild(document.createTextNode(text));

  row.appendChild(bubble);
  chat.appendChild(row);
  chat.scrollTop = chat.scrollHeight;
}

function setTyping(show) {
  typing.classList.toggle("hidden", !show);
}

async function sendMessage(text) {
  text = text.trim();
  if (!text) return;

  addMessage("user", text);
  input.value = "";
  setTyping(true);

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        history: messages.slice(-12),
        notes: notes.value.slice(0, 4000)
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "JARVIS API error");
    }

    addMessage("assistant", data.reply);

    if (voiceReplies && "speechSynthesis" in window) {
      speak(data.reply);
    }
  } catch (error) {
    addMessage("assistant", `Connection error: ${error.message}`);
  } finally {
    setTyping(false);
  }
}

function speak(text) {
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  utterance.pitch = 0.95;
  window.speechSynthesis.speak(utterance);
}

form.addEventListener("submit", e => {
  e.preventDefault();
  sendMessage(input.value);
});

document.querySelectorAll("[data-prompt]").forEach(btn => {
  btn.addEventListener("click", () => sendMessage(btn.dataset.prompt));
});

document.getElementById("clearBtn").addEventListener("click", () => {
  messages = [];
  chat.innerHTML = `
    <div class="welcome">
      <div class="welcome-reactor">◉</div>
      <h2>JARVIS is ready.</h2>
      <p>Start a new conversation.</p>
    </div>`;
});

document.getElementById("newChatBtn").addEventListener("click", () => {
  document.getElementById("clearBtn").click();
  input.focus();
});

document.getElementById("saveNotesBtn").addEventListener("click", () => {
  localStorage.setItem("jarvisNotes", notes.value);
  micStatus.textContent = "Notes saved on this device.";
  setTimeout(() => micStatus.textContent = "", 1800);
});

voiceToggle.addEventListener("click", () => {
  voiceReplies = !voiceReplies;
  localStorage.setItem("jarvisVoice", voiceReplies ? "on" : "off");
  voiceToggle.textContent = voiceReplies ? "🔊" : "🔇";
  if (!voiceReplies) window.speechSynthesis?.cancel();
});

// Browser speech recognition: no API key required.
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.continuous = false;

  recognition.onstart = () => {
    listening = true;
    micBtn.classList.add("recording");
    micStatus.textContent = "Listening...";
  };

  recognition.onresult = event => {
    const transcript = event.results[0][0].transcript;
    input.value = transcript;
    micStatus.textContent = "Voice captured.";
    setTimeout(() => micStatus.textContent = "", 1200);
  };

  recognition.onerror = event => {
    micStatus.textContent = `Microphone: ${event.error}`;
  };

  recognition.onend = () => {
    listening = false;
    micBtn.classList.remove("recording");
  };

  micBtn.addEventListener("click", () => {
    if (listening) recognition.stop();
    else recognition.start();
  });
} else {
  micBtn.disabled = true;
  micStatus.textContent = "Voice input is not supported by this browser.";
}
