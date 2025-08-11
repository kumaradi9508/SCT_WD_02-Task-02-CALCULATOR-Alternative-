// Elements
const display = document.getElementById("display");
const historyList = document.getElementById("historyList");
const themeSwitch = document.getElementById("themeSwitch");

// State
let expression = "";
let undoStack = [];                // for undoing current input changes
let deletedHistoryStack = [];      // in-memory stack of recently deleted history entries (not persisted)

/* ---------------------------
   Display & input functions
   --------------------------- */
function updateDisplay() {
  display.innerText = expression || "0";
}

function pushUndo() {
  // Save current expression snapshot for undo BEFORE change
  undoStack.push(expression);
  // Optionally limit undo stack size
  if (undoStack.length > 100) undoStack.shift();
}

function appendNumber(num) {
  pushUndo();
  expression += num;
  updateDisplay();
}

function appendOperator(op) {
  // avoid consecutive operators (simple guard)
  if (expression === "") return;
  const last = expression.slice(-1);
  if (["+", "-", "*", "/"].includes(last)) {
    pushUndo();
    expression = expression.slice(0, -1) + op;
  } else {
    pushUndo();
    expression += op;
  }
  updateDisplay();
}

function clearDisplay() {
  if (expression === "") return;
  pushUndo();
  expression = "";
  updateDisplay();
}

function backspace() {
  if (expression === "") return;
  pushUndo();
  expression = expression.slice(0, -1);
  updateDisplay();
}

function undoCurrent() {
  if (undoStack.length === 0) {
    // nothing to undo
    return;
  }
  expression = undoStack.pop();
  updateDisplay();
}

/* ---------------------------
   Calculation & History
   --------------------------- */
function calculate() {
  if (!expression) return;
  try {
    // Evaluate safely enough for this simple calculator
    let result = eval(expression);
    // Save to history
    const entry = `${expression} = ${result}`;
    addToHistory(entry);
    // Reset expression to result so user can continue
    pushUndo();
    expression = result.toString();
    updateDisplay();
  } catch (err) {
    pushUndo();
    expression = "";
    display.innerText = "Error";
  }
}

function addToHistory(entry) {
  // Add to UI
  const li = document.createElement("li");
  li.innerText = entry;
  historyList.prepend(li);

  // Save to localStorage (most recent first)
  let history = JSON.parse(localStorage.getItem("calcHistory")) || [];
  history.unshift(entry);
  localStorage.setItem("calcHistory", JSON.stringify(history));
}

function loadHistory() {
  // Load from localStorage and display
  const saved = JSON.parse(localStorage.getItem("calcHistory")) || [];
  historyList.innerHTML = "";
  for (const entry of saved) {
    const li = document.createElement("li");
    li.innerText = entry;
    historyList.appendChild(li);
  }
}

function clearHistory() {
  // Move visible items into deletedHistoryStack (LIFO)
  const items = Array.from(historyList.querySelectorAll("li")).map(li => li.innerText);
  if (items.length === 0) return;
  // store them reverse so the last visible becomes lastDeleted
  deletedHistoryStack.push(...items);
  // remove from UI
  historyList.innerHTML = "";
  // remove from storage as well (so "Load From Storage" won't restore those)
  // If you want to permanently delete them from storage, remove them entirely:
  localStorage.removeItem("calcHistory");
}

function restoreLastDeleted() {
  if (deletedHistoryStack.length === 0) {
    alert("No recently deleted history to restore.");
    return;
  }
  const last = deletedHistoryStack.pop();
  // Add to UI
  const li = document.createElement("li");
  li.innerText = last;
  historyList.prepend(li);
  // Add back to storage (unshift)
  let history = JSON.parse(localStorage.getItem("calcHistory")) || [];
  history.unshift(last);
  localStorage.setItem("calcHistory", JSON.stringify(history));
}

/* ---------------------------
   Keyboard support
   --------------------------- */
document.addEventListener("keydown", (e) => {
  // Prevent browser default for Backspace (avoid navigating back)
  if (e.key === "Backspace") {
    e.preventDefault();
    backspace();
    return;
  }

  // Ctrl+Z for undo current
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
    e.preventDefault();
    undoCurrent();
    return;
  }

  if (e.key >= "0" && e.key <= "9") {
    appendNumber(e.key);
    return;
  }

  if (["+", "-", "*", "/"].includes(e.key)) {
    appendOperator(e.key);
    return;
  }

  if (e.key === "Enter") {
    e.preventDefault();
    calculate();
    return;
  }

  if (e.key === "Escape") {
    clearDisplay();
    return;
  }

  if (e.key === ".") {
    appendNumber(".");
    return;
  }
});

/* ---------------------------
   Dark mode toggle
   --------------------------- */
themeSwitch.addEventListener("change", (e) => {
  document.body.classList.toggle("dark", e.target.checked);
});

/* ---------------------------
   Init
   --------------------------- */
loadHistory();
updateDisplay();
