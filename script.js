// ---------- Data ----------
const PET_TYPES = {
  dog:      { name: "Dog",      stages: ["🐶", "🐕", "🦮", "🐕‍🦺"] },
  cat:      { name: "Cat",      stages: ["🐱", "🐈", "🐈‍⬛", "🐯"] },
  cow:      { name: "Cow",      stages: ["🐮", "🐄", "🐄", "🐂"] },
  parrot:   { name: "Parrot",   stages: ["🐣", "🦜", "🦜", "🦅"] },
  rabbit:   { name: "Rabbit",   stages: ["🐰", "🐇", "🐇", "🐇"] },
  elephant: { name: "Elephant", stages: ["🐘", "🐘", "🦣", "🦣"] },
};

const DEFAULT_HABITS = [
  { key: "sleep", text: "Slept 7-8 hours" },
  { key: "meals", text: "Ate 3 meals (50g+ protein)" },
  { key: "water", text: "Drank 3L water" },
  { key: "steps", text: "30 min workout / 8,000 steps" },
  { key: "news",  text: "15 min business news" },
  { key: "study", text: "1 hr deep-focus study (no phone)" },
];

const XP_PER_HABIT = 20;
const STRENGTH_PER_HABIT = 5;
const RECOMMENDED_MAX = 6;

function genId() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return "h_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// Real recorded animal sounds, preloaded so playback is instant.
// (Only pets with a clip make a sound; others are silently skipped.)
const SOUND_FILES = {
  dog: "sounds/dog.ogg",
  cat: "sounds/cat.m4a",
  cow: "sounds/cow.m4a",
  parrot: "sounds/parrot.m4a",
  elephant: "sounds/elephant.m4a",
  rabbit: "sounds/rabbit.m4a",
};

const audioCache = {};
for (const [key, src] of Object.entries(SOUND_FILES)) {
  const a = new Audio(src);
  a.preload = "auto";
  audioCache[key] = a;
}

function playSound(typeKey) {
  const a = audioCache[typeKey];
  if (!a) return;
  try {
    // Stop any other pet sound still playing so clips never overlap —
    // only the most recently clicked pet should be heard.
    Object.values(audioCache).forEach(other => {
      if (other !== a && !other.paused) {
        other.pause();
        other.currentTime = 0;
      }
    });
    a.currentTime = 0;
    a.play().catch(() => {}); // ignore autoplay restrictions
  } catch (e) { /* no-op */ }
}

// Why each habit matters — shown via the info icon next to each habit.
// Keyed by the habit's stable `key` (only default habits have one).
const HABIT_INFO = {
  sleep: {
    title: "😴 Why 7–8 hours of sleep?",
    body: "While you sleep, your brain clears waste, locks in memories, and rebalances hunger hormones. Regularly under 7 hours is linked to weaker focus, low mood, and overeating. For most adults, 7–8 hours is the sweet spot.",
  },
  meals: {
    title: "🍽️ Why 3 meals with 50g+ protein?",
    body: "Regular meals keep your blood sugar, energy and focus steady and stop you from getting so hungry you overeat later. Protein (aim for ~50g+ a day, more if you train) repairs muscle and keeps you full. Spread it across your 3 meals — eggs, dal, paneer, curd or chicken — rather than all at once.",
  },
  water: {
    title: "💧 Why 3 litres of water?",
    body: "Water keeps your temperature, joints, digestion and focus working well. General guidance is about 2.5–3.5 litres of total fluids a day (food included). ~3 litres of drinking water is an easy target — have more in heat or after exercise. A quick check: your urine should be pale yellow.",
  },
  steps: {
    title: "🏃 Why 8,000 steps / 30 min?",
    body: "The famous '10,000 steps' was a 1960s Japanese pedometer ad — not science. Research (Harvard 2019; a 2022 Lancet meta-analysis) shows benefits rise from ~4,000 steps and largely plateau around 7,000–8,000 for most adults, with extra gains up to ~10,000 for younger people. So 8,000 steps — or 30 minutes of brisk activity — is a solid, evidence-based target. More is fine; there's no magic 11,000.",
  },
  news: {
    title: "📰 Why 15 min of business news?",
    body: "For an MBA, a daily business paper (Mint, Economic Times, Business Standard) builds the commercial awareness that powers case discussions, GDs, and placement interviews. Just 15 focused minutes a day compounds — you start linking classroom frameworks to real companies, deals and markets.",
  },
  study: {
    title: "📚 Why 1 hour of deep-focus study?",
    body: "One hour of phone-free, focused study beats several hours of distracted scrolling-and-studying. Your brain learns through sustained attention, and doing it daily (instead of cramming) moves knowledge into long-term memory. Treat it as a daily rep — small, consistent, and away from notifications.",
  },
};

function infoForHabit(habit) {
  return habit.key ? HABIT_INFO[habit.key] : null;
}

// On growth, failure, and the discipline it takes to actually improve.
const QUOTES = [
  { text: "I have not failed. I've just found 10,000 ways that won't work.", author: "Thomas Edison" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
  { text: "Growth and comfort do not coexist.", author: "Ginni Rometty" },
  { text: "The cave you fear to enter holds the treasure you seek.", author: "Joseph Campbell" },
  { text: "It's not whether you get knocked down — it's whether you get up.", author: "Vince Lombardi" },
  { text: "I am not afraid of storms, for I am learning how to sail my ship.", author: "Louisa May Alcott" },
  { text: "Whether you think you can, or you think you can't — you're right.", author: "Henry Ford" },
  { text: "Hard choices, easy life. Easy choices, hard life.", author: "Jerzy Gregorek" },
  { text: "A ship in harbor is safe, but that is not what ships are built for.", author: "John A. Shedd" },
  { text: "Risk comes from not knowing what you're doing.", author: "Warren Buffett" },
  { text: "If you're not a bit embarrassed by who you were a year ago, you probably haven't grown much.", author: "Alain de Botton" },
  { text: "Fall seven times, stand up eight.", author: "Japanese Proverb" },
  { text: "It is impossible to live without failing at something, unless you live so cautiously that you might as well not have lived at all.", author: "J.K. Rowling" },
  { text: "It is hard to fail, but it is worse never to have tried to succeed.", author: "Theodore Roosevelt" },
];

// Same quote all day for everyone, changing daily — a quiet daily ritual to
// match the habit-checking one. Picked by hashing the IST date string.
function quoteForToday() {
  const key = todayKey();
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return QUOTES[hash % QUOTES.length];
}

function renderQuote() {
  const q = quoteForToday();
  document.getElementById("quote-text").textContent = q.text;
  document.getElementById("quote-author").textContent = `— ${q.author}`;
}

// First letter capital, rest lowercase (sentence case).
function sentenceCase(s) {
  s = s.trim();
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function strengthDisplay(n) {
  return n > 0 ? n : "–";
}

// ---------- State ----------
function loadState() {
  const raw = localStorage.getItem("habitPetState");
  return raw ? JSON.parse(raw) : null;
}

function saveState() {
  localStorage.setItem("habitPetState", JSON.stringify(state));
}

function freshHabits() {
  return DEFAULT_HABITS.map(h => ({ id: genId(), key: h.key, text: h.text }));
}

// Repairs older saved states: gives every habit a stable id (and recovers its
// `key` by matching default text), and migrates todayCompleted from the old
// index-based keys to id-based keys. Runs once, silently, on load.
function migrateState(s) {
  let changed = false;
  const defaultKeyByText = {};
  DEFAULT_HABITS.forEach(h => { defaultKeyByText[h.text] = h.key; });

  const oldHabits = s.habits || [];
  const needsIds = oldHabits.some(h => !h.id);
  s.habits = oldHabits.map(h => {
    if (h.id) return h;
    changed = true;
    return { id: genId(), key: h.key || defaultKeyByText[h.text] || null, text: h.text };
  });

  if (needsIds) {
    const tc = s.todayCompleted || {};
    const keys = Object.keys(tc);
    const looksIndexBased = keys.length > 0 && keys.every(k => /^\d+$/.test(k));
    if (looksIndexBased) {
      const migrated = {};
      keys.forEach(k => {
        const habit = s.habits[parseInt(k, 10)];
        if (habit && tc[k]) migrated[habit.id] = true;
      });
      s.todayCompleted = migrated;
      changed = true;
    }
  }
  return { state: s, changed };
}

const loaded = loadState();
let state;
if (loaded) {
  const { state: migrated, changed } = migrateState(loaded);
  state = migrated;
  if (changed) saveState();
} else {
  state = {
    petType: null,
    petName: null,
    pin: null,
    cloudId: null,
    level: 1,
    xp: 0,
    strength: 0,
    habits: freshHabits(),
    history: {}, // { "YYYY-MM-DD": { doneCount, totalCount } }
    todayCompleted: {}, // { habitId: true }
    lastActiveDate: null,
    isGreatLakes: undefined,
    pinPromptDismissed: false,
  };
}

// ---------- Helpers ----------
// Always reckon dates/time in Indian Standard Time (UTC+5:30),
// regardless of the device's local timezone.
function istNow() {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utcMs + 5.5 * 3600000);
}

function todayKey() {
  return istNow().toISOString().slice(0, 10);
}

function timeOfDay() {
  const h = istNow().getHours();
  if (h >= 5 && h < 12)  return { period: "morning",   emoji: "☀️", greeting: "Good morning" };
  if (h >= 12 && h < 17) return { period: "afternoon", emoji: "🌤️", greeting: "Good afternoon" };
  if (h >= 17 && h < 20) return { period: "evening",   emoji: "🌅", greeting: "Good evening" };
  return { period: "night", emoji: "🌙", greeting: "Good night" };
}

function applyTheme() {
  const t = timeOfDay();
  document.body.classList.remove("morning", "afternoon", "evening", "night");
  document.body.classList.add(t.period);
  const name = state.petName ? `, ${state.petName} & you` : "";
  document.getElementById("time-badge").textContent = `${t.emoji} ${t.greeting}${name}`;
}

function xpNeededForLevel(level) {
  return 100 + (level - 1) * 40;
}

function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.remove("hidden");
  toast.style.opacity = "1";
  setTimeout(() => { toast.style.opacity = "0"; }, 1600);
  setTimeout(() => toast.classList.add("hidden"), 2000);
}

function resetDailyIfNewDay() {
  const today = todayKey();
  if (state.lastActiveDate !== today) {
    // roll yesterday's progress into history before resetting
    if (state.lastActiveDate) {
      const doneCount = Object.values(state.todayCompleted).filter(Boolean).length;
      state.history[state.lastActiveDate] = {
        doneCount,
        totalCount: state.habits.length,
      };
    }
    state.todayCompleted = {};
    state.lastActiveDate = today;
    saveState();
  }
}

// ---------- Accessible focusable element helper ----------
// Lets a non-button element (li, div) behave like a button for keyboard/SR users.
function makeFocusable(el, onActivate) {
  el.setAttribute("role", "button");
  el.setAttribute("tabindex", "0");
  el.addEventListener("keydown", e => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onActivate();
    }
  });
}

// ---------- Generic modal open/close (handles mobile keyboard + escape) ----------
function adjustModalsForKeyboard() {
  if (!window.visualViewport) return;
  const vv = window.visualViewport;
  const keyboardOpen = vv.height < window.innerHeight * 0.85;
  document.querySelectorAll(".modal:not(.hidden)").forEach(modal => {
    if (!modal.querySelector("input")) return;
    modal.style.height = vv.height + "px";
    modal.style.top = vv.offsetTop + "px";
    modal.style.bottom = "auto";
    modal.style.alignItems = keyboardOpen ? "flex-start" : "center";
    modal.style.overflowY = "auto";
  });
}
function resetModalViewport(modal) {
  modal.style.height = "";
  modal.style.top = "";
  modal.style.bottom = "";
  modal.style.alignItems = "";
  modal.style.overflowY = "";
}
if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", adjustModalsForKeyboard);
  window.visualViewport.addEventListener("scroll", adjustModalsForKeyboard);
}

function openModal(modal) {
  modal.classList.remove("hidden");
  setTimeout(() => {
    const input = modal.querySelector("input");
    if (input) input.focus();
    adjustModalsForKeyboard();
  }, 60);
}
function closeModal(modal) {
  modal.classList.add("hidden");
  resetModalViewport(modal);
}
// Click on backdrop (not the content box) closes the modal.
document.querySelectorAll(".modal").forEach(modal => {
  modal.addEventListener("click", e => { if (e.target === modal) closeModal(modal); });
});
// Escape closes whatever modal is open.
document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    document.querySelectorAll(".modal:not(.hidden)").forEach(closeModal);
  }
});

// ---------- Pet Selection Screen ----------
function renderPetSelect() {
  const grid = document.getElementById("pet-options");
  grid.innerHTML = "";
  Object.entries(PET_TYPES).forEach(([key, pet]) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "pet-card";
    card.innerHTML = `<span class="emoji">${pet.stages[0]}</span><span class="name">${pet.name}</span>`;
    card.addEventListener("click", () => {
      playSound(key);
      openNameModal(key);
    });
    grid.appendChild(card);
  });
}

let pendingPetType = null;
let pendingPetName = null;
let pendingPetPin = null;
let pinModalMode = "onboarding"; // "onboarding" | "standalone"

const BLOCKED_NAMES = /^(name|test|user|player|pet|demo|sample|abc|xyz|temp|asdf|qwerty)\d*$/i;

// Pet names are public (they show on the leaderboard), so block common
// profanity/slurs — including a few Hindi/Tamil-origin ones likely in this
// audience. This is a basic deterrent, not exhaustive moderation; anything
// that slips through can still be removed by hand from the Supabase dashboard.
const PROFANITY_LIST = [
  "fuck", "shit", "bitch", "asshole", "bastard", "dick", "pussy", "cunt", "slut", "whore",
  "nigger", "nigga", "faggot", "retard", "rape", "porn", "boobs", "penis", "vagina",
  "chutiya", "madarchod", "madharchod", "behenchod", "bhenchod", "gandu", "gaandu",
  "randi", "harami", "lavda", "lauda", "lund", "chinal", "kamina", "chutia", "chod",
  "otha", "punda", "thevidiya", "kandaroli",
];

// Strips spaces/punctuation and undoes common leetspeak substitutions, so
// "f.u.c.k" or "fu4k" still match the plain word in the list above.
function normalizeForFilter(s) {
  return s
    .toLowerCase()
    .replace(/[@4]/g, "a")
    .replace(/3/g, "e")
    .replace(/[1!]/g, "i")
    .replace(/0/g, "o")
    .replace(/\$/g, "s")
    .replace(/7/g, "t")
    .replace(/[^a-z]/g, "");
}

function containsProfanity(raw) {
  const normalized = normalizeForFilter(raw);
  return PROFANITY_LIST.some(word => normalized.includes(word));
}

function validatePetName(raw) {
  const n = raw.trim();
  if (n.length < 2) return { ok: false, msg: "Name needs at least 2 letters." };
  if (n.length > 20) return { ok: false, msg: "Keep it under 20 characters." };
  const compact = n.replace(/\s+/g, "").toLowerCase();
  if (/^\d+$/.test(compact)) return { ok: false, msg: "Pick a real name, not just numbers." };
  if (!/[a-z]/i.test(n)) return { ok: false, msg: "Name needs at least one letter." };
  if (BLOCKED_NAMES.test(compact)) return { ok: false, msg: "That's too generic — pick a unique name!" };
  if (containsProfanity(n)) return { ok: false, msg: "That name isn't allowed — please pick another." };
  return { ok: true };
}

// Returns true if the name is already taken (case-insensitive). On network
// error we return false so a user is never blocked by a connectivity blip.
async function nameTaken(name) {
  if (!sb) return false;
  try {
    const { data, error } = await sb.from("pets").select("id").ilike("pet_name", name).limit(1);
    if (error) { console.warn("nameTaken:", error.message); return false; }
    return data && data.length > 0;
  } catch (e) { return false; }
}

function openNameModal(typeKey) {
  pendingPetType = typeKey;
  const pet = PET_TYPES[typeKey];
  document.getElementById("name-modal-emoji").textContent = pet.stages[0];
  document.getElementById("name-modal-title").textContent = `What will you name your new ${pet.name.toLowerCase()}?`;
  document.getElementById("name-error").textContent = "";
  document.getElementById("name-input").value = "";
  openModal(document.getElementById("name-modal"));
}

async function confirmName() {
  if (!pendingPetType) return;
  const errEl = document.getElementById("name-error");
  const btn = document.getElementById("name-confirm");
  const raw = document.getElementById("name-input").value;

  const v = validatePetName(raw);
  if (!v.ok) { errEl.textContent = v.msg; return; }

  const name = sentenceCase(raw);
  btn.disabled = true;
  btn.textContent = "Checking…";
  errEl.textContent = "";
  const taken = await nameTaken(name);
  btn.disabled = false;
  btn.textContent = "Let's go! 🎉";

  if (taken) {
    errEl.textContent = "Oops! That name's already taken. Try another.";
    return;
  }

  pendingPetName = name;
  closeModal(document.getElementById("name-modal"));
  pinModalMode = "onboarding";
  openPinModal();
}

document.getElementById("name-confirm").addEventListener("click", confirmName);
document.getElementById("name-cancel").addEventListener("click", () => closeModal(document.getElementById("name-modal")));
document.getElementById("name-input").addEventListener("keydown", e => {
  if (e.key === "Enter") confirmName();
});

// ---------- PIN setup ----------
function openPinModal() {
  document.getElementById("pin-error").textContent = "";
  document.getElementById("pin-input").value = "";
  openModal(document.getElementById("pin-modal"));
}

function validatePin(raw) {
  return /^\d{4}$/.test(raw.trim());
}

function confirmPin() {
  const raw = document.getElementById("pin-input").value.trim();
  const errEl = document.getElementById("pin-error");
  if (!validatePin(raw)) { errEl.textContent = "PIN must be exactly 4 digits."; return; }
  closeModal(document.getElementById("pin-modal"));

  if (pinModalMode === "onboarding") {
    pendingPetPin = raw;
    openModal(document.getElementById("gl-modal"));
  } else {
    state.pin = raw;
    state.pinPromptDismissed = true;
    saveState();
    showToast("PIN saved! 🔒");
    ensureCloud().then(() => scheduleCloudSync());
    renderSecurePrompts();
  }
}

function skipPin() {
  closeModal(document.getElementById("pin-modal"));
  if (pinModalMode === "onboarding") {
    pendingPetPin = null;
    openModal(document.getElementById("gl-modal"));
  } else {
    state.pinPromptDismissed = true;
    saveState();
    renderSecurePrompts();
  }
}

document.getElementById("pin-confirm").addEventListener("click", confirmPin);
document.getElementById("pin-skip").addEventListener("click", skipPin);
document.getElementById("pin-input").addEventListener("keydown", e => {
  if (e.key === "Enter") confirmPin();
});

function renderSecurePrompts() {
  const needsPin = !!state.petType && !state.pin;
  document.getElementById("secure-banner").classList.toggle("hidden", !needsPin);
  document.getElementById("secure-pin-btn").classList.toggle("hidden", !needsPin);
}

document.getElementById("secure-banner-btn").addEventListener("click", () => {
  pinModalMode = "standalone";
  openPinModal();
});
document.getElementById("secure-pin-btn").addEventListener("click", () => {
  pinModalMode = "standalone";
  openPinModal();
});

// ---------- Restore pet ----------
document.getElementById("show-restore-btn").addEventListener("click", () => {
  document.getElementById("restore-error").textContent = "";
  document.getElementById("restore-name-input").value = "";
  document.getElementById("restore-pin-input").value = "";
  openModal(document.getElementById("restore-modal"));
});
document.getElementById("restore-cancel").addEventListener("click", () => closeModal(document.getElementById("restore-modal")));

async function confirmRestore() {
  const name = document.getElementById("restore-name-input").value.trim();
  const pin = document.getElementById("restore-pin-input").value.trim();
  const errEl = document.getElementById("restore-error");
  const btn = document.getElementById("restore-confirm");

  if (!name || !validatePin(pin)) {
    errEl.textContent = "Enter your pet's name and a 4-digit PIN.";
    return;
  }
  if (!sb) { errEl.textContent = "Restore needs an internet connection."; return; }

  btn.disabled = true;
  btn.textContent = "Looking…";
  errEl.textContent = "";
  try {
    const { data, error } = await sb.from("pets").select("*").ilike("pet_name", name).limit(1);
    btn.disabled = false;
    btn.textContent = "Restore";
    if (error || !data || data.length === 0) {
      errEl.textContent = "We couldn't find a pet with that name.";
      return;
    }
    const row = data[0];
    let claiming = false;
    if (!row.pin) {
      // This pet predates the PIN feature — claim it by setting this PIN now.
      claiming = true;
    } else if (row.pin !== pin) {
      errEl.textContent = "Pet name or PIN didn't match.";
      return;
    }
    if (claiming) {
      try { await sb.from("pets").update({ pin }).eq("id", row.id); }
      catch (e) { console.warn("claim pin update:", e); }
    }
    const backup = row.backup || {};
    state = {
      petType: row.pet_type,
      petName: row.pet_name,
      pin: pin,
      cloudId: row.id,
      isGreatLakes: !!row.is_great_lakes,
      level: row.level || 1,
      strength: row.strength || 0,
      xp: backup.xp || 0,
      habits: (backup.habits && backup.habits.length) ? backup.habits : freshHabits(),
      history: backup.history || {},
      todayCompleted: backup.todayCompleted || {},
      lastActiveDate: backup.lastActiveDate || null,
      pinPromptDismissed: true,
    };
    saveState();
    closeModal(document.getElementById("restore-modal"));
    resetDailyIfNewDay();
    showToast(claiming ? `PIN set! Welcome back, ${state.petName} 🔒` : `Welcome back, ${state.petName}! 🎉`);
    showGameScreen();
  } catch (e) {
    btn.disabled = false;
    btn.textContent = "Restore";
    errEl.textContent = "Something went wrong. Try again.";
  }
}
document.getElementById("restore-confirm").addEventListener("click", confirmRestore);
document.getElementById("restore-pin-input").addEventListener("keydown", e => {
  if (e.key === "Enter") confirmRestore();
});

// ---------- Great Lakes question ----------
async function finishOnboarding(isGL) {
  state.isGreatLakes = isGL;
  if (pendingPetType) {
    state.petType = pendingPetType;
    state.petName = pendingPetName;
    state.pin = pendingPetPin;
    state.pinPromptDismissed = !!pendingPetPin;
    pendingPetType = null;
    pendingPetName = null;
    pendingPetPin = null;
  }
  saveState();
  closeModal(document.getElementById("gl-modal"));
  await ensureCloud();
  showGameScreen();
}
document.getElementById("gl-yes").addEventListener("click", () => finishOnboarding(true));
document.getElementById("gl-no").addEventListener("click", () => finishOnboarding(false));

// ---------- Cloud sync (Supabase) ----------
function backupPayload() {
  return {
    xp: state.xp,
    habits: state.habits,
    history: state.history,
    todayCompleted: state.todayCompleted,
    lastActiveDate: state.lastActiveDate,
  };
}

async function ensureCloud() {
  if (!sb || state.cloudId || !state.petName) return;
  try {
    const ins = await sb.from("pets").insert({
      pet_name: state.petName,
      pet_type: state.petType,
      is_great_lakes: !!state.isGreatLakes,
      strength: state.strength,
      level: state.level,
      pin: state.pin || null,
      backup: backupPayload(),
    }).select().single();
    if (ins.data) { state.cloudId = ins.data.id; saveState(); return; }
    // If the name already exists (e.g. this user returning after clearing data),
    // adopt that row as theirs.
    if (ins.error) {
      const got = await sb.from("pets").select("id").ilike("pet_name", state.petName).limit(1);
      if (got.data && got.data[0]) { state.cloudId = got.data[0].id; saveState(); }
    }
  } catch (e) { console.warn("ensureCloud:", e); }
}

let cloudSyncTimer = null;
function scheduleCloudSync() {
  clearTimeout(cloudSyncTimer);
  cloudSyncTimer = setTimeout(syncToCloud, 800);
}

async function syncToCloud() {
  if (!sb || !state.cloudId) return;
  try {
    await sb.from("pets").update({
      strength: state.strength,
      level: state.level,
      pin: state.pin || null,
      backup: backupPayload(),
      updated_at: new Date().toISOString(),
    }).eq("id", state.cloudId);
  } catch (e) { console.warn("syncToCloud:", e); }
}

// ---------- Leaderboard ----------
let lbScope = "gl";

const CARD_LB_LIMIT = 25;   // rows shown on the dashboard card
const FULL_LB_LIMIT = 500;  // rows shown in the "View full list" modal

// Build one leaderboard <li>. Shared by the dashboard card and the full-list
// modal so ranks, medals, emoji and the "me" highlight stay identical.
function lbRowEl(row, i) {
  const li = document.createElement("li");
  const isMe = row.pet_name === state.petName;
  li.className = "lb-row" + (isMe ? " me" : "");
  const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : (i + 1);
  const emoji = stageEmojiFor(row.pet_type, row.level);
  li.innerHTML = `
    <span class="lb-rank">${medal}</span>
    <span class="lb-emoji">${emoji}</span>
    <span class="lb-name">${escapeHtml(row.pet_name)}<span class="lb-lv">Lv ${row.level}</span></span>
    <span class="lb-strength">${strengthDisplay(row.strength)} 💪</span>
  `;
  return li;
}

async function renderLeaderboard() {
  // Keep the tab highlight in sync with the active scope.
  document.querySelectorAll(".lb-tab").forEach(t =>
    t.classList.toggle("active", t.dataset.scope === lbScope));

  const listEl = document.getElementById("lb-list");
  const moreBtn = document.getElementById("lb-view-more");
  moreBtn.classList.add("hidden");
  if (!sb) {
    listEl.innerHTML = `<li class="lb-empty">Leaderboard is offline right now.</li>`;
    return;
  }
  // Soft loading: only show the "Loading…" placeholder if we have nothing on screen yet.
  const hasRows = listEl.querySelector(".lb-row");
  if (!hasRows) listEl.innerHTML = `<li class="lb-loading">Loading…</li>`;
  try {
    let q = sb.from("pets")
      .select("pet_name,pet_type,strength,level,is_great_lakes")
      .order("strength", { ascending: false })
      .order("level", { ascending: false })
      .limit(CARD_LB_LIMIT);
    if (lbScope === "gl") q = q.eq("is_great_lakes", true);
    const { data, error } = await q;
    if (error) { listEl.innerHTML = `<li class="lb-empty">Couldn't load leaderboard.</li>`; return; }
    if (!data || data.length === 0) {
      listEl.innerHTML = `<li class="lb-empty">No pets here yet — be the first to grow! 🌱</li>`;
      return;
    }
    listEl.innerHTML = "";
    data.forEach((row, i) => listEl.appendChild(lbRowEl(row, i)));
    // Card is full — there may be more players past the cut, so offer the full list.
    if (data.length >= CARD_LB_LIMIT) moreBtn.classList.remove("hidden");
  } catch (e) {
    listEl.innerHTML = `<li class="lb-empty">Couldn't load leaderboard.</li>`;
  }
}

// Card tabs carry data-scope; modal tabs carry data-mscope (wired separately
// below) — scope this selector so we don't double-bind the modal's tabs.
document.querySelectorAll(".lb-tab[data-scope]").forEach(tab => {
  tab.addEventListener("click", () => {
    lbScope = tab.dataset.scope;
    renderLeaderboard();
  });
});
document.getElementById("lb-refresh").addEventListener("click", renderLeaderboard);

// ---------- Full leaderboard modal ----------
let lbModalScope = "gl";
let lbMineObserver = null; // watches the player's real row to show/hide the pinned copy

function clearStickyMine() {
  if (lbMineObserver) { lbMineObserver.disconnect(); lbMineObserver = null; }
  const mineEl = document.getElementById("lb-modal-mine");
  mineEl.innerHTML = "";
  mineEl.classList.add("hidden");
}

// Smoothly scroll a container to a target scrollTop. Uses requestAnimationFrame
// instead of native scroll-behavior:smooth, which is unreliable for custom
// overflow containers (no-op in some Chromium builds, late iOS Safari support).
function smoothScrollTo(el, to, duration = 420) {
  const start = el.scrollTop;
  const change = to - start;
  if (Math.abs(change) < 2) { el.scrollTop = to; return; }
  const t0 = performance.now();
  const ease = p => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2); // easeInOutQuad
  (function step(now) {
    const p = Math.min(1, (now - t0) / duration);
    el.scrollTop = start + change * ease(p);
    if (p < 1) requestAnimationFrame(step);
  })(t0);
}

// Sticky-anchor pattern: pin a copy of the player's own row to the bottom of the
// modal, but only while their real row is scrolled out of view (an
// IntersectionObserver hides the copy once the real row is visible, so there's
// never a duplicate). Tapping the pinned row jumps to the real one with a flash.
function updateStickyMine(listEl, data) {
  clearStickyMine();
  const mineEl = document.getElementById("lb-modal-mine");
  const myIndex = data.findIndex(r => r.pet_name === state.petName);
  if (myIndex === -1) return; // not on this list (e.g. not a Great Lakes student) → no anchor

  mineEl.appendChild(lbRowEl(data[myIndex], myIndex));
  mineEl.onclick = () => {
    const realRow = listEl.querySelector(".lb-row.me");
    if (!realRow) return;
    // Center the player's real row in the list, scrolling the container itself.
    const target = realRow.offsetTop - (listEl.clientHeight - realRow.clientHeight) / 2;
    smoothScrollTo(listEl, Math.max(0, target));
    realRow.classList.remove("lb-flash");
    void realRow.offsetWidth; // force reflow so the animation can replay
    realRow.classList.add("lb-flash");
    setTimeout(() => realRow.classList.remove("lb-flash"), 1500);
  };

  const realRow = listEl.querySelector(".lb-row.me");
  // True when the real row is at least half-visible inside the list viewport.
  const rowVisibleInList = () => {
    const rr = realRow.getBoundingClientRect(), lr = listEl.getBoundingClientRect();
    const overlap = Math.max(0, Math.min(rr.bottom, lr.bottom) - Math.max(rr.top, lr.top));
    return overlap >= rr.height * 0.5;
  };
  // Set the correct state synchronously now (the observer's first callback is
  // async and can lag a frame), then keep it in sync as the user scrolls.
  mineEl.classList.toggle("hidden", rowVisibleInList());
  lbMineObserver = new IntersectionObserver(() => {
    mineEl.classList.toggle("hidden", rowVisibleInList());
  }, { root: listEl, threshold: [0, 0.5, 1] });
  lbMineObserver.observe(realRow);
}

async function renderFullLeaderboard() {
  document.querySelectorAll(".lbm-tabs .lb-tab").forEach(t =>
    t.classList.toggle("active", t.dataset.mscope === lbModalScope));
  const listEl = document.getElementById("lb-modal-list");
  clearStickyMine();
  if (!sb) { listEl.innerHTML = `<li class="lb-empty">Leaderboard is offline right now.</li>`; return; }
  const hasRows = listEl.querySelector(".lb-row");
  if (!hasRows) listEl.innerHTML = `<li class="lb-loading">Loading…</li>`;
  try {
    let q = sb.from("pets")
      .select("pet_name,pet_type,strength,level,is_great_lakes")
      .order("strength", { ascending: false })
      .order("level", { ascending: false })
      .limit(FULL_LB_LIMIT);
    if (lbModalScope === "gl") q = q.eq("is_great_lakes", true);
    const { data, error } = await q;
    if (error) { listEl.innerHTML = `<li class="lb-empty">Couldn't load leaderboard.</li>`; return; }
    if (!data || data.length === 0) {
      listEl.innerHTML = `<li class="lb-empty">No pets here yet — be the first to grow! 🌱</li>`;
      return;
    }
    listEl.innerHTML = "";
    data.forEach((row, i) => listEl.appendChild(lbRowEl(row, i)));
    listEl.scrollTop = 0; // start at rank 1; the pinned "You" row tracks the player from the bottom
    updateStickyMine(listEl, data);
  } catch (e) {
    listEl.innerHTML = `<li class="lb-empty">Couldn't load leaderboard.</li>`;
  }
}

document.getElementById("lb-view-more").addEventListener("click", () => {
  lbModalScope = lbScope; // open on whichever tab the card is currently showing
  openModal(document.getElementById("lb-modal"));
  renderFullLeaderboard();
});
document.querySelectorAll(".lbm-tabs .lb-tab").forEach(tab => {
  tab.addEventListener("click", () => {
    lbModalScope = tab.dataset.mscope;
    document.getElementById("lb-modal-list").innerHTML = ""; // reset so "Loading…" shows for the new scope
    renderFullLeaderboard();
  });
});
document.getElementById("lb-modal-close").addEventListener("click", () => {
  clearStickyMine();
  closeModal(document.getElementById("lb-modal"));
});

// ---------- Game Screen ----------
function stageEmojiFor(typeKey, level) {
  const pet = PET_TYPES[typeKey];
  if (!pet) return "🐾";
  const stageIndex = Math.min(Math.floor((level - 1) / 3), pet.stages.length - 1);
  return pet.stages[stageIndex];
}

function getPetStageEmoji() {
  return stageEmojiFor(state.petType, state.level);
}

// ---------- Streak & Milestone Tiers (drive the shareable certificate) ----------
// Counts consecutive days (ending today, if today is already fully checked
// off) where every habit was completed. Nothing tracked this before.
function computeCurrentStreak() {
  const total = state.habits.length;
  if (total === 0) return 0;
  let streak = 0;
  const doneToday = Object.values(state.todayCompleted).filter(Boolean).length;
  if (doneToday === total) streak = 1;

  const cursor = istNow();
  cursor.setDate(cursor.getDate() - 1);
  while (true) {
    const key = cursor.toISOString().slice(0, 10);
    const rec = state.history[key];
    if (rec && rec.totalCount > 0 && rec.doneCount === rec.totalCount) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

function cumulativeXpForLevel(level) {
  let total = 0;
  for (let i = 1; i < level; i++) total += xpNeededForLevel(i);
  return total;
}
function totalXpEarned() {
  return cumulativeXpForLevel(state.level) + state.xp;
}

// Tier cutoffs target a realistic usage span (weeks, not months/years) —
// Tier 3 lines up with meaningful, well-known milestones: Level 10 is when
// every pet finishes evolving, and 21 days is the classic "habit formed"
// benchmark. Both reachable inside about a month of real use.
function levelTier(level) {
  if (level >= 10) return 3;
  if (level >= 5) return 2;
  return 1;
}
function streakTier(days) {
  if (days >= 21) return 3;
  if (days >= 7) return 2;
  if (days >= 3) return 1;
  return 0;
}
function overallTier() {
  return Math.max(levelTier(state.level), streakTier(computeCurrentStreak()));
}
// Whichever is rarer (higher tier) becomes the certificate's headline.
function bestAchievement() {
  const lvlTier = levelTier(state.level);
  const streak = computeCurrentStreak();
  const strTier = streakTier(streak);
  if (strTier >= lvlTier && strTier > 0) return { type: "streak", value: streak, tier: strTier };
  return { type: "level", value: state.level, tier: lvlTier };
}

function consistencyPercent() {
  let done = 0, possible = 0;
  for (let i = 0; i <= 29; i++) {
    const d = istNow();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    let rec = state.history[key];
    if (key === todayKey()) {
      rec = { doneCount: Object.values(state.todayCompleted).filter(Boolean).length, totalCount: state.habits.length };
    }
    if (rec && rec.totalCount > 0) { done += rec.doneCount; possible += rec.totalCount; }
  }
  return possible > 0 ? Math.round((done / possible) * 100) : 0;
}

async function fetchGLRank() {
  if (!sb || !state.isGreatLakes) return null;
  try {
    const { data } = await sb.from("pets").select("pet_name,strength,level")
      .eq("is_great_lakes", true)
      .order("strength", { ascending: false })
      .order("level", { ascending: false })
      .limit(200);
    if (!data) return null;
    const idx = data.findIndex(r => r.pet_name === state.petName);
    return idx >= 0 ? idx + 1 : null;
  } catch (e) { return null; }
}

// ---------- Certificate generation ----------
async function populateCertificateTemplate(achievement) {
  const tpl = document.getElementById("cert-template");
  tpl.classList.remove("cert-t1", "cert-t2", "cert-t3");
  tpl.classList.add(`cert-t${achievement.tier}`);

  const headline = achievement.type === "streak"
    ? `${achievement.value} DAY STREAK`
    : `LEVEL ${achievement.value}`;
  document.getElementById("cert-headline").textContent = headline;
  document.getElementById("cert-subtitle").textContent =
    `${state.petName} the ${PET_TYPES[state.petType].name} · ` +
    istNow().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  document.getElementById("cert-xp").textContent = totalXpEarned().toLocaleString();
  document.getElementById("cert-consistency").textContent = `${consistencyPercent()}%`;
  document.getElementById("cert-stage").textContent = `${getPetStageEmoji()} ${PET_TYPES[state.petType].name}`;

  const badge = document.getElementById("cert-gl-badge");
  const rank = await fetchGLRank();
  if (rank) {
    document.getElementById("cert-gl-rank").textContent = rank;
    badge.classList.remove("hidden");
  } else {
    badge.classList.add("hidden");
  }
}

function captureCertificate() {
  return html2canvas(document.getElementById("cert-template"), {
    scale: 2,
    backgroundColor: null,
  });
}

let lastCertBlob = null;

async function openCertificateModal(forcedAchievement) {
  const modal = document.getElementById("cert-modal");
  document.getElementById("cert-loading").textContent = "Generating your certificate…";
  document.getElementById("cert-loading").classList.remove("hidden");
  document.getElementById("cert-preview-img").classList.add("hidden");
  document.getElementById("cert-share-btn").classList.add("hidden");
  document.getElementById("cert-download-btn").classList.add("hidden");
  openModal(modal);

  const achievement = forcedAchievement || bestAchievement();
  await populateCertificateTemplate(achievement);
  if (document.fonts && document.fonts.ready) await document.fonts.ready;
  await new Promise(r => setTimeout(r, 50));

  try {
    const canvas = await captureCertificate();
    canvas.toBlob(blob => {
      lastCertBlob = blob;
      const url = URL.createObjectURL(blob);
      const img = document.getElementById("cert-preview-img");
      img.src = url;
      document.getElementById("cert-loading").classList.add("hidden");
      img.classList.remove("hidden");
      document.getElementById("cert-download-btn").classList.remove("hidden");

      const file = new File([blob], "thunai-certificate.png", { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        document.getElementById("cert-share-btn").classList.remove("hidden");
      }
    }, "image/png");
  } catch (e) {
    console.warn("certificate capture failed:", e);
    document.getElementById("cert-loading").textContent = "Couldn't generate the certificate — try again.";
  }
}

async function handleInstagramShare() {
  if (!lastCertBlob) return;
  const file = new File([lastCertBlob], "thunai-certificate.png", { type: "image/png" });
  try {
    await navigator.share({ files: [file], title: "My Thunai progress" });
  } catch (e) { /* user cancelled the share sheet — no-op */ }
}

function downloadCertificate() {
  if (!lastCertBlob) return;
  const url = URL.createObjectURL(lastCertBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "thunai-certificate.png";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

document.getElementById("share-cert-btn").addEventListener("click", () => openCertificateModal());
document.getElementById("cert-close-btn").addEventListener("click", () => closeModal(document.getElementById("cert-modal")));
document.getElementById("cert-share-btn").addEventListener("click", handleInstagramShare);
document.getElementById("cert-download-btn").addEventListener("click", downloadCertificate);

// Auto-celebrate the first time a habit-check pushes the user into a new tier
// (level or streak, whichever is rarer) — doesn't re-fire for the same tier.
function checkMilestone() {
  const tier = overallTier();
  if (tier > (state.lastMilestoneTierShown || 0)) {
    state.lastMilestoneTierShown = tier;
    saveState();
    setTimeout(() => openCertificateModal(), 900);
  }
}

function renderGameScreen(opts) {
  opts = opts || {};
  document.getElementById("pet-name").textContent = state.petName;
  document.getElementById("pet-level").textContent = state.level;
  document.getElementById("pet-emoji").textContent = getPetStageEmoji();
  document.getElementById("strength-value").textContent = strengthDisplay(state.strength);

  const xpNeeded = xpNeededForLevel(state.level);
  document.getElementById("xp-current").textContent = state.xp;
  document.getElementById("xp-needed").textContent = xpNeeded;
  document.getElementById("xp-fill").style.width = `${Math.min(100, (state.xp / xpNeeded) * 100)}%`;

  document.getElementById("today-date").textContent = istNow().toLocaleDateString(undefined, {
    weekday: "short", month: "short", day: "numeric",
  });

  applyTheme();
  renderMood();
  renderLadder();
  renderQuote();
  renderHabitList();
  renderHeatmap();
  renderSecurePrompts();
  if (opts.refreshLeaderboard) renderLeaderboard();
}

function renderHabitList() {
  const list = document.getElementById("habit-list");
  list.innerHTML = "";
  state.habits.forEach((habit) => {
    const li = document.createElement("li");
    const done = !!state.todayCompleted[habit.id];
    li.className = "habit-item" + (done ? " done" : "");
    li.innerHTML = `
      <div class="habit-checkbox">${done ? "✓" : ""}</div>
      <div class="habit-text">${escapeHtml(habit.text)}</div>
    `;
    const activate = () => toggleHabit(habit.id);
    li.addEventListener("click", activate);
    makeFocusable(li, activate);

    const info = infoForHabit(habit);
    if (info) {
      const infoBtn = document.createElement("button");
      infoBtn.type = "button";
      infoBtn.className = "habit-info-btn";
      infoBtn.textContent = "ⓘ";
      infoBtn.title = "Why this matters";
      infoBtn.setAttribute("aria-label", "Why this matters");
      infoBtn.addEventListener("click", e => {
        e.stopPropagation(); // don't toggle the habit
        openInfoModal(info);
      });
      li.appendChild(infoBtn);
    }
    list.appendChild(li);
  });
}

function toggleHabit(habitId) {
  const wasDone = !!state.todayCompleted[habitId];
  if (wasDone) {
    delete state.todayCompleted[habitId];
    removeXp(XP_PER_HABIT);
    state.strength = Math.max(0, state.strength - STRENGTH_PER_HABIT);
  } else {
    state.todayCompleted[habitId] = true;
    addXp(XP_PER_HABIT);
    state.strength += STRENGTH_PER_HABIT;
    showToast(`+${STRENGTH_PER_HABIT} strength! 💪`);
  }
  saveState();
  renderGameScreen();
  scheduleCloudSync();
  if (!wasDone) {
    bouncePet();
    checkMilestone();
  }
}

function addXp(amount) {
  state.xp += amount;
  const needed = xpNeededForLevel(state.level);
  if (state.xp >= needed) {
    state.xp -= needed;
    state.level += 1;
    setTimeout(() => {
      showToast(`🎉 Level up! Now level ${state.level}`);
      confetti();
      bouncePet();
    }, 300);
  }
}

// Mirrors addXp so unchecking a habit cleanly reverses a level-up too.
function removeXp(amount) {
  state.xp -= amount;
  while (state.xp < 0 && state.level > 1) {
    state.level -= 1;
    state.xp += xpNeededForLevel(state.level);
  }
  state.xp = Math.max(0, state.xp);
}

// ---------- Pet Mood ----------
function yesterdayKey() {
  const d = istNow();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function computeMood() {
  const total = state.habits.length || 1;
  const doneToday = Object.values(state.todayCompleted).filter(Boolean).length;
  if (doneToday / total >= 0.66) return "happy";
  const y = state.history[yesterdayKey()];
  if (!y || (y.totalCount > 0 && y.doneCount / y.totalCount < 0.34)) return "tired";
  return "neutral";
}

function renderMood() {
  const emojiEl = document.getElementById("pet-emoji");
  const moodEl = document.getElementById("pet-mood");
  const mood = computeMood();
  emojiEl.classList.remove("tired", "happy");
  if (mood === "happy") {
    emojiEl.classList.add("happy");
    moodEl.textContent = "Energized and thriving! ✨";
  } else if (mood === "tired") {
    emojiEl.classList.add("tired");
    moodEl.textContent = "Feeling sleepy 😴 — check off habits to recharge it!";
  } else {
    moodEl.textContent = "Ready for a great day 🌼";
  }
}

function bouncePet() {
  const el = document.getElementById("pet-emoji");
  el.classList.remove("bounce");
  void el.offsetWidth; // restart animation
  el.classList.add("bounce");
}

// ---------- Confetti ----------
function confetti() {
  let layer = document.getElementById("confetti-layer");
  if (!layer) {
    layer = document.createElement("div");
    layer.id = "confetti-layer";
    document.body.appendChild(layer);
  }
  const colors = ["#FF8C42", "#43aa8b", "#E0735F", "#90be6d", "#577590", "#f9c74f"];
  for (let i = 0; i < 80; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    piece.style.left = Math.random() * 100 + "vw";
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDuration = (1.6 + Math.random() * 1.4) + "s";
    piece.style.animationDelay = Math.random() * 0.3 + "s";
    layer.appendChild(piece);
    setTimeout(() => piece.remove(), 3200);
  }
}

// ---------- Heatmap ----------
function renderHeatmap() {
  const container = document.getElementById("heatmap");
  container.innerHTML = "";
  const days = [];
  for (let i = 29; i >= 0; i--) {
    const d = istNow();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  days.forEach(dateKey => {
    const cell = document.createElement("div");
    cell.className = "heat-cell";
    let record = state.history[dateKey];
    if (dateKey === todayKey()) {
      record = {
        doneCount: Object.values(state.todayCompleted).filter(Boolean).length,
        totalCount: state.habits.length,
      };
    }
    if (record && record.totalCount > 0) {
      const ratio = record.doneCount / record.totalCount;
      cell.style.background = ratio === 0 ? "#eee" : colorForRatio(ratio);
    }
    cell.title = dateKey + (record ? ` — ${record.doneCount}/${record.totalCount}` : "");
    container.appendChild(cell);
  });
}

function colorForRatio(ratio) {
  if (ratio >= 1) return "#2d6a4f";
  if (ratio >= 0.66) return "#43aa8b";
  if (ratio >= 0.33) return "#90be6d";
  return "#d8e9c5";
}

// ---------- Manage Habits Modal ----------
let editingHabitId = null;

function renderManageModal() {
  const count = state.habits.length;
  const countEl = document.getElementById("manage-count");
  countEl.textContent = `${count} habit${count === 1 ? "" : "s"}` +
    (count > RECOMMENDED_MAX ? " — that's a lot! Consider removing a few." : "");
  countEl.classList.toggle("over", count > RECOMMENDED_MAX);

  const list = document.getElementById("manage-list");
  list.innerHTML = "";
  state.habits.forEach((habit) => {
    const li = document.createElement("li");
    li.className = "manage-item";

    if (editingHabitId === habit.id) {
      const input = document.createElement("input");
      input.type = "text";
      input.className = "manage-edit-input";
      input.maxLength = 40;
      input.value = habit.text;
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") saveEditHabit(habit.id, input.value);
        if (e.key === "Escape") { editingHabitId = null; renderManageModal(); }
      });
      li.appendChild(input);

      const actions = document.createElement("div");
      actions.className = "manage-item-actions";
      const saveBtn = document.createElement("button");
      saveBtn.type = "button";
      saveBtn.textContent = "Save";
      saveBtn.addEventListener("click", () => saveEditHabit(habit.id, input.value));
      const cancelBtn = document.createElement("button");
      cancelBtn.type = "button";
      cancelBtn.textContent = "Cancel";
      cancelBtn.addEventListener("click", () => { editingHabitId = null; renderManageModal(); });
      actions.appendChild(saveBtn);
      actions.appendChild(cancelBtn);
      li.appendChild(actions);

      list.appendChild(li);
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
      return;
    }

    const span = document.createElement("span");
    span.textContent = habit.text;
    li.appendChild(span);

    const actions = document.createElement("div");
    actions.className = "manage-item-actions";
    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () => { editingHabitId = habit.id; renderManageModal(); });
    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.textContent = "Remove";
    removeBtn.addEventListener("click", () => removeHabit(habit.id));
    actions.appendChild(editBtn);
    actions.appendChild(removeBtn);
    li.appendChild(actions);

    list.appendChild(li);
  });
}

function saveEditHabit(habitId, rawText) {
  const text = rawText.trim();
  if (!text) {
    showToast("Habit name can't be empty.");
    return;
  }
  const dupe = state.habits.some(h => h.id !== habitId && h.text.toLowerCase() === text.toLowerCase());
  if (dupe) {
    showToast("You already have that habit.");
    return;
  }
  const habit = state.habits.find(h => h.id === habitId);
  if (habit) habit.text = text;
  editingHabitId = null;
  saveState();
  renderManageModal();
  renderGameScreen();
  scheduleCloudSync();
}

function removeHabit(habitId) {
  if (state.habits.length <= 1) {
    showToast("You need at least 1 habit.");
    return;
  }
  // Refund today's points if this habit was already checked off today.
  if (state.todayCompleted[habitId]) {
    removeXp(XP_PER_HABIT);
    state.strength = Math.max(0, state.strength - STRENGTH_PER_HABIT);
    delete state.todayCompleted[habitId];
  }
  state.habits = state.habits.filter(h => h.id !== habitId);
  saveState();
  renderManageModal();
  renderGameScreen();
  scheduleCloudSync();
}

document.getElementById("manage-habits-btn").addEventListener("click", () => {
  editingHabitId = null;
  renderManageModal();
  openModal(document.getElementById("manage-modal"));
});

document.getElementById("close-modal-btn").addEventListener("click", () => {
  editingHabitId = null;
  closeModal(document.getElementById("manage-modal"));
});

document.getElementById("add-habit-btn").addEventListener("click", () => {
  const input = document.getElementById("new-habit-input");
  const text = input.value.trim();
  if (!text) return;

  const dupe = state.habits.some(h => h.text.toLowerCase() === text.toLowerCase());
  if (dupe) {
    showToast("You already have that habit.");
    return;
  }

  state.habits.push({ id: genId(), key: null, text });
  input.value = "";
  saveState();
  renderManageModal();
  renderGameScreen();
  scheduleCloudSync();
  if (state.habits.length > RECOMMENDED_MAX) {
    showToast("Heads up: fewer habits stick better 🎯");
  }
});

document.getElementById("new-habit-input").addEventListener("keydown", e => {
  if (e.key === "Enter") document.getElementById("add-habit-btn").click();
});

// ---------- Reset ----------
document.getElementById("reset-btn").addEventListener("click", () => {
  showConfirm(
    "Reset your pet?",
    "This will permanently erase your pet and all your progress. This can't be undone.",
    () => {
      localStorage.removeItem("habitPetState");
      location.reload();
    }
  );
});

// ---------- Growth Ladder ----------
// Returns the pet's distinct evolution milestones with the level each unlocks.
function petMilestones(typeKey) {
  const pet = PET_TYPES[typeKey];
  const out = [];
  let last = null;
  pet.stages.forEach((emoji, i) => {
    if (emoji === last) return; // collapse repeated stages
    last = emoji;
    out.push({ emoji, unlockLevel: i * 3 + 1 });
  });
  return out;
}

function renderLadder() {
  const el = document.getElementById("ladder");
  const milestones = petMilestones(state.petType);

  // The current milestone is the highest one we've already unlocked.
  let currentIdx = 0;
  milestones.forEach((m, i) => { if (state.level >= m.unlockLevel) currentIdx = i; });

  el.innerHTML = "";
  // Render top-down: final form at the top (the goal), start at the bottom.
  for (let i = milestones.length - 1; i >= 0; i--) {
    const m = milestones[i];
    const reached = state.level >= m.unlockLevel;
    const isCurrent = i === currentIdx;
    const isNext = i === currentIdx + 1;

    let cls = "rung";
    if (isCurrent) cls += " current reached";
    else if (reached) cls += " reached";
    else cls += " locked";

    let title, sub;
    if (isCurrent) {
      title = "You're here";
      sub = `Level ${state.level}`;
    } else if (reached) {
      title = "Unlocked";
      sub = `Reached at Lv ${m.unlockLevel}`;
    } else if (isNext) {
      const toGo = m.unlockLevel - state.level;
      title = "Next evolution";
      sub = `Reach Lv ${m.unlockLevel} — ${toGo} level${toGo === 1 ? "" : "s"} to go`;
    } else {
      title = "Locked";
      sub = `Reach Lv ${m.unlockLevel}`;
    }

    const rung = document.createElement("div");
    rung.className = cls;
    rung.innerHTML = `
      <div class="rung-badge">${reached ? m.emoji : "🔒"}</div>
      <div class="rung-info">
        <div class="rung-title">${title}</div>
        <div class="rung-sub">${sub}</div>
      </div>
    `;
    el.appendChild(rung);
  }
}

// ---------- Evolution Preview ----------
function renderEvoModal() {
  const pet = PET_TYPES[state.petType];
  document.getElementById("evo-title").textContent = `How ${state.petName} grows`;
  const container = document.getElementById("evo-stages");
  container.innerHTML = "";
  let lastEmoji = null;
  pet.stages.forEach((emoji, i) => {
    if (emoji === lastEmoji) return; // skip repeated stages
    lastEmoji = emoji;
    if (container.children.length > 0) {
      const arrow = document.createElement("span");
      arrow.className = "evo-arrow";
      arrow.textContent = "→";
      container.appendChild(arrow);
    }
    const unlockLevel = i * 3 + 1;
    const stage = document.createElement("div");
    stage.className = "evo-stage";
    stage.innerHTML = `<span class="evo-emoji">${emoji}</span><span class="evo-level">${unlockLevel === 1 ? "Now" : "Lv " + unlockLevel}</span>`;
    container.appendChild(stage);
  });
}

document.getElementById("evo-btn").addEventListener("click", () => {
  renderEvoModal();
  openModal(document.getElementById("evo-modal"));
});
document.querySelector("[data-close-evo]").addEventListener("click", () => {
  closeModal(document.getElementById("evo-modal"));
});

// Tap the pet to hear it!
document.getElementById("pet-emoji").addEventListener("click", () => {
  playSound(state.petType);
  bouncePet();
});

// ---------- Habit Info ----------
function openInfoModal(info) {
  document.getElementById("info-title").textContent = info.title;
  document.getElementById("info-body").textContent = info.body;
  openModal(document.getElementById("info-modal"));
}
document.querySelector("[data-close-info]").addEventListener("click", () => {
  closeModal(document.getElementById("info-modal"));
});

// ---------- Reusable Confirm ----------
function showConfirm(title, body, onConfirm) {
  document.getElementById("confirm-title").textContent = title;
  document.getElementById("confirm-body").textContent = body;
  const modal = document.getElementById("confirm-modal");
  openModal(modal);
  const okBtn = document.getElementById("confirm-ok");
  const cancelBtn = document.getElementById("confirm-cancel");
  const close = () => closeModal(modal);
  okBtn.onclick = () => { close(); onConfirm(); };
  cancelBtn.onclick = close;
}

// ---------- Screen Switching ----------
function showGameScreen() {
  document.getElementById("select-screen").classList.add("hidden");
  document.getElementById("game-screen").classList.remove("hidden");
  renderGameScreen({ refreshLeaderboard: true });
}

function showSelectScreen() {
  document.getElementById("game-screen").classList.add("hidden");
  document.getElementById("select-screen").classList.remove("hidden");
  // Welcome screen always uses the light look (day/night theming is for the game).
  document.body.classList.remove("morning", "afternoon", "evening", "night");
  renderPetSelect();
}

// Keep the sky in sync if the app stays open across a time boundary.
// (No leaderboard refetch here — avoids the periodic flicker; use the
// Refresh button or switch leaderboard tabs to pull fresh standings.)
setInterval(() => {
  if (!document.getElementById("game-screen").classList.contains("hidden")) {
    resetDailyIfNewDay();
    renderGameScreen();
  }
}, 60000);

// ---------- Init ----------
resetDailyIfNewDay();
lbScope = state.isGreatLakes ? "gl" : "all";

if (state.petType && PET_TYPES[state.petType]) {
  showGameScreen();
  if (state.isGreatLakes === undefined) {
    // Existing local player from before the leaderboard existed — ask once.
    openModal(document.getElementById("gl-modal"));
  } else {
    ensureCloud();
  }
} else {
  // no pet yet, or pet type no longer exists (e.g. removed in an update)
  state.petType = null;
  showSelectScreen();
}
