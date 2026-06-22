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
  "Ate 3 meals",
  "Ate 50g+ protein",
  "Drank 3L water",
  "30 min workout / 8,000 steps",
];

const XP_PER_HABIT = 20;
const STRENGTH_PER_HABIT = 5;

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
    card.addEventListener("click", () => choosePet(key, pet.name));
    grid.appendChild(card);
  });
}

function choosePet(typeKey, defaultName) {
  const petEmoji = PET_TYPES[typeKey].stages[0];
  const name = prompt(
    `${petEmoji} Yay! What will you name your new ${defaultName}?\n\nThis little one grows stronger every day you do — choose a name you'll love cheering for!`,
    ""
  );
  if (name === null) return; // user cancelled — stay on selection screen
  state.petType = typeKey;
  state.petName = name.trim() || defaultName;
  saveState();
  showGameScreen();
}

// ---------- Game Screen ----------
function getPetStageEmoji() {
  const pet = PET_TYPES[state.petType];
  const stageIndex = Math.min(
    Math.floor((state.level - 1) / 3),
    pet.stages.length - 1
  );
  return pet.stages[stageIndex];
}

function renderGameScreen() {
  document.getElementById("pet-name").textContent = state.petName;
  document.getElementById("pet-level").textContent = state.level;
  document.getElementById("pet-emoji").textContent = getPetStageEmoji();
  document.getElementById("strength-value").textContent = state.strength;

  const xpNeeded = xpNeededForLevel(state.level);
  document.getElementById("xp-current").textContent = state.xp;
  document.getElementById("xp-needed").textContent = xpNeeded;
  document.getElementById("xp-fill").style.width = `${Math.min(100, (state.xp / xpNeeded) * 100)}%`;

  document.getElementById("today-date").textContent = new Date().toLocaleDateString(undefined, {
    weekday: "short", month: "short", day: "numeric",
  });

  applyTheme();
  renderMood();
  renderHabitList();
  renderHeatmap();
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
function renderManageModal() {
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
  }
});

document.getElementById("new-habit-input").addEventListener("keydown", e => {
  if (e.key === "Enter") document.getElementById("add-habit-btn").click();
});

// ---------- Reset ----------
document.getElementById("reset-btn").addEventListener("click", () => {
  if (confirm("This will reset your pet and all progress. Are you sure?")) {
    localStorage.removeItem("habitPetState");
    location.reload();
  }
});

// ---------- Screen Switching ----------
function showGameScreen() {
  document.getElementById("select-screen").classList.add("hidden");
  document.getElementById("game-screen").classList.remove("hidden");
  renderGameScreen();
}

function showSelectScreen() {
  document.getElementById("game-screen").classList.add("hidden");
  document.getElementById("select-screen").classList.remove("hidden");
  applyTheme();
  renderPetSelect();
}

// Keep the sky in sync if the app stays open across a time boundary.
setInterval(() => {
  if (!document.getElementById("game-screen").classList.contains("hidden")) {
    resetDailyIfNewDay();
    renderGameScreen();
  } else {
    applyTheme();
  }
}, 60000);

// ---------- Init ----------
resetDailyIfNewDay();
if (state.petType && PET_TYPES[state.petType]) {
  showGameScreen();
} else {
  // no pet yet, or pet type no longer exists (e.g. removed in an update)
  state.petType = null;
  showSelectScreen();
}
