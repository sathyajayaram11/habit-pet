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
  "Slept 7-8 hours",
  "Ate 3 meals (50g+ protein)",
  "Drank 3L water",
  "30 min workout / 8,000 steps",
  "15 min business news",
  "1 hr deep-focus study (no phone)",
];

const XP_PER_HABIT = 20;
const STRENGTH_PER_HABIT = 5;

// Real recorded animal sounds, preloaded so playback is instant.
// (Only pets with a clip make a sound; others are silently skipped.)
const SOUND_FILES = {
  dog: "sounds/dog.ogg",
  cat: "sounds/cat.m4a",
  cow: "sounds/cow.m4a",
  parrot: "sounds/parrot.m4a",
  elephant: "sounds/elephant.m4a",
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
    a.currentTime = 0;
    a.play().catch(() => {}); // ignore autoplay restrictions
  } catch (e) { /* no-op */ }
}

// Why each habit matters — shown via the info icon next to each habit.
const HABIT_INFO = [
  {
    match: "slept",
    title: "😴 Why 7–8 hours of sleep?",
    body: "While you sleep, your brain clears waste, locks in memories, and rebalances hunger hormones. Regularly under 7 hours is linked to weaker focus, low mood, and overeating. For most adults, 7–8 hours is the sweet spot.",
  },
  {
    match: "3 meals",
    title: "🍽️ Why 3 meals with 50g+ protein?",
    body: "Regular meals keep your blood sugar, energy and focus steady and stop you from getting so hungry you overeat later. Protein (aim for ~50g+ a day, more if you train) repairs muscle and keeps you full. Spread it across your 3 meals — eggs, dal, paneer, curd or chicken — rather than all at once.",
  },
  {
    match: "protein",
    title: "🍗 Why 50g+ protein?",
    body: "Protein repairs muscle, keeps you full longer, and protects muscle as you age. A common daily floor is about 0.8g per kg of body weight (~50g for an average adult). If you exercise or lift weights, aim higher — around 1.2–1.6g per kg.",
  },
  {
    match: "news",
    title: "📰 Why 15 min of business news?",
    body: "For an MBA, a daily business paper (Mint, Economic Times, Business Standard) builds the commercial awareness that powers case discussions, GDs, and placement interviews. Just 15 focused minutes a day compounds — you start linking classroom frameworks to real companies, deals and markets.",
  },
  {
    match: "study",
    title: "📚 Why 1 hour of deep-focus study?",
    body: "One hour of phone-free, focused study beats several hours of distracted scrolling-and-studying. Your brain learns through sustained attention, and doing it daily (instead of cramming) moves knowledge into long-term memory. Treat it as a daily rep — small, consistent, and away from notifications.",
  },
  {
    match: "water",
    title: "💧 Why 3 litres of water?",
    body: "Water keeps your temperature, joints, digestion and focus working well. General guidance is about 2.5–3.5 litres of total fluids a day (food included). ~3 litres of drinking water is an easy target — have more in heat or after exercise. A quick check: your urine should be pale yellow.",
  },
  {
    match: "step",
    title: "🏃 Why 8,000 steps / 30 min?",
    body: "The famous '10,000 steps' was a 1960s Japanese pedometer ad — not science. Research (Harvard 2019; a 2022 Lancet meta-analysis) shows benefits rise from ~4,000 steps and largely plateau around 7,000–8,000 for most adults, with extra gains up to ~10,000 for younger people. So 8,000 steps — or 30 minutes of brisk activity — is a solid, evidence-based target. More is fine; there's no magic 11,000.",
  },
];

function infoForHabit(text) {
  const t = text.toLowerCase();
  return HABIT_INFO.find(h => t.includes(h.match));
}

// First letter capital, rest lowercase (sentence case).
function sentenceCase(s) {
  s = s.trim();
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

// ---------- State ----------
function loadState() {
  const raw = localStorage.getItem("habitPetState");
  return raw ? JSON.parse(raw) : null;
}

function saveState() {
  localStorage.setItem("habitPetState", JSON.stringify(state));
}

let state = loadState() || {
  petType: null,
  petName: null,
  level: 1,
  xp: 0,
  strength: 0,
  habits: DEFAULT_HABITS.map(text => ({ text })),
  history: {}, // { "YYYY-MM-DD": { doneCount, totalCount } }
  todayCompleted: {}, // { habitIndex: true }
  lastActiveDate: null,
};

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

// ---------- Pet Selection Screen ----------
function renderPetSelect() {
  const grid = document.getElementById("pet-options");
  grid.innerHTML = "";
  Object.entries(PET_TYPES).forEach(([key, pet]) => {
    const card = document.createElement("div");
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

const BLOCKED_NAMES = /^(name|test|user|player|pet|demo|sample|abc|xyz|temp|asdf|qwerty)\d*$/i;

function validatePetName(raw) {
  const n = raw.trim();
  if (n.length < 2) return { ok: false, msg: "Name needs at least 2 letters." };
  if (n.length > 20) return { ok: false, msg: "Keep it under 20 characters." };
  const compact = n.replace(/\s+/g, "").toLowerCase();
  if (/^\d+$/.test(compact)) return { ok: false, msg: "Pick a real name, not just numbers." };
  if (!/[a-z]/i.test(n)) return { ok: false, msg: "Name needs at least one letter." };
  if (BLOCKED_NAMES.test(compact)) return { ok: false, msg: "That's too generic — pick a unique name!" };
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
  const input = document.getElementById("name-input");
  input.value = "";
  document.getElementById("name-modal").classList.remove("hidden");
  setTimeout(() => {
    input.focus();
    adjustNameModalForKeyboard();
  }, 60);
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
  closeNameModal();
  document.getElementById("gl-modal").classList.remove("hidden");
}

document.getElementById("name-confirm").addEventListener("click", confirmName);
document.getElementById("name-cancel").addEventListener("click", closeNameModal);
document.getElementById("name-input").addEventListener("keydown", e => {
  if (e.key === "Enter") confirmName();
});

// Keep the name popup inside the area NOT covered by the on-screen keyboard.
// When the keyboard opens, the visual viewport shrinks — we resize the modal to
// that visible region and top-align it so the input + buttons stay reachable.
function adjustNameModalForKeyboard() {
  const modal = document.getElementById("name-modal");
  if (modal.classList.contains("hidden") || !window.visualViewport) return;
  const vv = window.visualViewport;
  modal.style.height = vv.height + "px";
  modal.style.top = vv.offsetTop + "px";
  modal.style.bottom = "auto";
  const keyboardOpen = vv.height < window.innerHeight * 0.85;
  modal.style.alignItems = keyboardOpen ? "flex-start" : "center";
  modal.style.overflowY = "auto";
}

function resetNameModalViewport() {
  const modal = document.getElementById("name-modal");
  modal.style.height = "";
  modal.style.top = "";
  modal.style.bottom = "";
  modal.style.alignItems = "";
  modal.style.overflowY = "";
}

function closeNameModal() {
  document.getElementById("name-modal").classList.add("hidden");
  resetNameModalViewport();
}

if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", adjustNameModalForKeyboard);
  window.visualViewport.addEventListener("scroll", adjustNameModalForKeyboard);
}

// ---------- Great Lakes question ----------
async function finishOnboarding(isGL) {
  state.isGreatLakes = isGL;
  if (pendingPetType) {
    state.petType = pendingPetType;
    state.petName = pendingPetName;
    pendingPetType = null;
    pendingPetName = null;
  }
  saveState();
  document.getElementById("gl-modal").classList.add("hidden");
  await ensureCloud();
  showGameScreen();
}
document.getElementById("gl-yes").addEventListener("click", () => finishOnboarding(true));
document.getElementById("gl-no").addEventListener("click", () => finishOnboarding(false));

// ---------- Cloud sync (Supabase) ----------
async function ensureCloud() {
  if (!sb || state.cloudId || !state.petName) return;
  try {
    const ins = await sb.from("pets").insert({
      pet_name: state.petName,
      pet_type: state.petType,
      is_great_lakes: !!state.isGreatLakes,
      strength: state.strength,
      level: state.level,
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

async function syncToCloud() {
  if (!sb || !state.cloudId) return;
  try {
    await sb.from("pets").update({
      strength: state.strength,
      level: state.level,
      updated_at: new Date().toISOString(),
    }).eq("id", state.cloudId);
  } catch (e) { console.warn("syncToCloud:", e); }
}

// ---------- Leaderboard ----------
let lbScope = "gl";

async function renderLeaderboard() {
  // Keep the tab highlight in sync with the active scope.
  document.querySelectorAll(".lb-tab").forEach(t =>
    t.classList.toggle("active", t.dataset.scope === lbScope));

  const listEl = document.getElementById("lb-list");
  if (!sb) {
    listEl.innerHTML = `<li class="lb-empty">Leaderboard is offline right now.</li>`;
    return;
  }
  listEl.innerHTML = `<li class="lb-loading">Loading…</li>`;
  try {
    let q = sb.from("pets")
      .select("pet_name,pet_type,strength,level,is_great_lakes")
      .order("strength", { ascending: false })
      .order("level", { ascending: false })
      .limit(25);
    if (lbScope === "gl") q = q.eq("is_great_lakes", true);
    const { data, error } = await q;
    if (error) { listEl.innerHTML = `<li class="lb-empty">Couldn't load leaderboard.</li>`; return; }
    if (!data || data.length === 0) {
      listEl.innerHTML = `<li class="lb-empty">No pets here yet — be the first! 🐾</li>`;
      return;
    }
    listEl.innerHTML = "";
    data.forEach((row, i) => {
      const li = document.createElement("li");
      const isMe = row.pet_name === state.petName;
      li.className = "lb-row" + (isMe ? " me" : "");
      const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : (i + 1);
      const emoji = stageEmojiFor(row.pet_type, row.level);
      li.innerHTML = `
        <span class="lb-rank">${medal}</span>
        <span class="lb-emoji">${emoji}</span>
        <span class="lb-name">${escapeHtml(row.pet_name)}<span class="lb-lv">Lv ${row.level}</span></span>
        <span class="lb-strength">${row.strength} 💪</span>
      `;
      listEl.appendChild(li);
    });
  } catch (e) {
    listEl.innerHTML = `<li class="lb-empty">Couldn't load leaderboard.</li>`;
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

document.querySelectorAll(".lb-tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".lb-tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    lbScope = tab.dataset.scope;
    renderLeaderboard();
  });
});
document.getElementById("lb-refresh").addEventListener("click", renderLeaderboard);

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

function renderGameScreen() {
  document.getElementById("pet-name").textContent = state.petName;
  document.getElementById("pet-level").textContent = state.level;
  document.getElementById("pet-emoji").textContent = getPetStageEmoji();
  document.getElementById("strength-value").textContent = state.strength > 0 ? state.strength : "–";

  const xpNeeded = xpNeededForLevel(state.level);
  document.getElementById("xp-current").textContent = state.xp;
  document.getElementById("xp-needed").textContent = xpNeeded;
  document.getElementById("xp-fill").style.width = `${Math.min(100, (state.xp / xpNeeded) * 100)}%`;

  document.getElementById("today-date").textContent = new Date().toLocaleDateString(undefined, {
    weekday: "short", month: "short", day: "numeric",
  });

  applyTheme();
  renderMood();
  renderLadder();
  renderHabitList();
  renderHeatmap();
  renderLeaderboard();
}

function renderHabitList() {
  const list = document.getElementById("habit-list");
  list.innerHTML = "";
  state.habits.forEach((habit, idx) => {
    const li = document.createElement("li");
    const done = !!state.todayCompleted[idx];
    li.className = "habit-item" + (done ? " done" : "");
    li.innerHTML = `
      <div class="habit-checkbox">${done ? "✓" : ""}</div>
      <div class="habit-text">${habit.text}</div>
    `;
    li.addEventListener("click", () => toggleHabit(idx));

    const info = infoForHabit(habit.text);
    if (info) {
      const infoBtn = document.createElement("button");
      infoBtn.className = "habit-info-btn";
      infoBtn.textContent = "ⓘ";
      infoBtn.title = "Why this matters";
      infoBtn.addEventListener("click", e => {
        e.stopPropagation(); // don't toggle the habit
        openInfoModal(info);
      });
      li.appendChild(infoBtn);
    }
    list.appendChild(li);
  });
}

function toggleHabit(idx) {
  const wasDone = !!state.todayCompleted[idx];
  if (wasDone) {
    delete state.todayCompleted[idx];
    state.xp = Math.max(0, state.xp - XP_PER_HABIT);
    state.strength = Math.max(0, state.strength - STRENGTH_PER_HABIT);
  } else {
    state.todayCompleted[idx] = true;
    addXp(XP_PER_HABIT);
    state.strength += STRENGTH_PER_HABIT;
    showToast(`+${STRENGTH_PER_HABIT} strength! 💪`);
  }
  saveState();
  renderGameScreen();
  syncToCloud();
  if (!wasDone) bouncePet();
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
  const colors = ["#ffb703", "#43aa8b", "#e07a5f", "#90be6d", "#577590", "#f9c74f"];
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
const RECOMMENDED_MAX = 6;

function renderManageModal() {
  const count = state.habits.length;
  const countEl = document.getElementById("manage-count");
  countEl.textContent = `${count} habit${count === 1 ? "" : "s"}` +
    (count > RECOMMENDED_MAX ? " — that's a lot! Consider removing a few." : "");
  countEl.classList.toggle("over", count > RECOMMENDED_MAX);

  const list = document.getElementById("manage-list");
  list.innerHTML = "";
  state.habits.forEach((habit, idx) => {
    const li = document.createElement("li");
    li.className = "manage-item";
    li.innerHTML = `<span>${habit.text}</span>`;
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "Remove";
    removeBtn.addEventListener("click", () => {
      state.habits.splice(idx, 1);
      saveState();
      renderManageModal();
      renderGameScreen();
    });
    li.appendChild(removeBtn);
    list.appendChild(li);
  });
}

document.getElementById("manage-habits-btn").addEventListener("click", () => {
  renderManageModal();
  document.getElementById("manage-modal").classList.remove("hidden");
});

document.getElementById("close-modal-btn").addEventListener("click", () => {
  document.getElementById("manage-modal").classList.add("hidden");
});

document.getElementById("add-habit-btn").addEventListener("click", () => {
  const input = document.getElementById("new-habit-input");
  const text = input.value.trim();
  if (text) {
    state.habits.push({ text });
    input.value = "";
    saveState();
    renderManageModal();
    renderGameScreen();
    if (state.habits.length > RECOMMENDED_MAX) {
      showToast("Heads up: fewer habits stick better 🎯");
    }
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
  document.getElementById("evo-title").textContent = `How ${state.petName} grows 🌱`;
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
  document.getElementById("evo-modal").classList.remove("hidden");
});
document.querySelector("[data-close-evo]").addEventListener("click", () => {
  document.getElementById("evo-modal").classList.add("hidden");
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
  document.getElementById("info-modal").classList.remove("hidden");
}
document.querySelector("[data-close-info]").addEventListener("click", () => {
  document.getElementById("info-modal").classList.add("hidden");
});

// ---------- Reusable Confirm ----------
function showConfirm(title, body, onConfirm) {
  document.getElementById("confirm-title").textContent = title;
  document.getElementById("confirm-body").textContent = body;
  const modal = document.getElementById("confirm-modal");
  modal.classList.remove("hidden");
  const okBtn = document.getElementById("confirm-ok");
  const cancelBtn = document.getElementById("confirm-cancel");
  const close = () => modal.classList.add("hidden");
  okBtn.onclick = () => { close(); onConfirm(); };
  cancelBtn.onclick = close;
}

// ---------- Screen Switching ----------
function showGameScreen() {
  document.getElementById("select-screen").classList.add("hidden");
  document.getElementById("game-screen").classList.remove("hidden");
  renderGameScreen();
}

function showSelectScreen() {
  document.getElementById("game-screen").classList.add("hidden");
  document.getElementById("select-screen").classList.remove("hidden");
  // Welcome screen always uses the light look (day/night theming is for the game).
  document.body.classList.remove("morning", "afternoon", "evening", "night");
  renderPetSelect();
}

// Keep the sky in sync if the app stays open across a time boundary.
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
    document.getElementById("gl-modal").classList.remove("hidden");
  } else {
    ensureCloud();
  }
} else {
  // no pet yet, or pet type no longer exists (e.g. removed in an update)
  state.petType = null;
  showSelectScreen();
}
