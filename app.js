/* ===================== വരവ് ചെലവ് App Logic ===================== */

const STORAGE_KEYS = {
  TX: "vc_transactions",
  CATS: "vc_categories"
};

const DEFAULT_CATEGORIES = {
  income: [
    { id: "inc_salary", emoji: "💼", name: "ശമ്പളം" },
    { id: "inc_business", emoji: "🏪", name: "ബിസിനസ്സ്" },
    { id: "inc_gift", emoji: "🎁", name: "സമ്മാനം" },
    { id: "inc_interest", emoji: "🏦", name: "പലിശ" },
    { id: "inc_rent", emoji: "🏠", name: "വാടക" },
    { id: "inc_other", emoji: "➕", name: "മറ്റുള്ളവ" }
  ],
  expense: [
    { id: "exp_food", emoji: "🍽️", name: "ഭക്ഷണം" },
    { id: "exp_travel", emoji: "🚌", name: "യാത്ര" },
    { id: "exp_grocery", emoji: "🛒", name: "പലചരക്ക്" },
    { id: "exp_bills", emoji: "💡", name: "ബില്ലുകൾ" },
    { id: "exp_rent", emoji: "🏠", name: "വീട്ടുവാടക" },
    { id: "exp_medical", emoji: "💊", name: "മെഡിക്കൽ" },
    { id: "exp_education", emoji: "📚", name: "വിദ്യാഭ്യാസം" },
    { id: "exp_shopping", emoji: "🛍️", name: "ഷോപ്പിംഗ്" },
    { id: "exp_other", emoji: "➖", name: "മറ്റുള്ളവ" }
  ]
};

/* ---------- Storage helpers ---------- */
function loadTx() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.TX)) || []; }
  catch (e) { return []; }
}
function saveTx(list) { localStorage.setItem(STORAGE_KEYS.TX, JSON.stringify(list)); }

function loadCats() {
  try {
    const c = JSON.parse(localStorage.getItem(STORAGE_KEYS.CATS));
    if (c && c.income && c.expense) return c;
  } catch (e) {}
  saveCats(DEFAULT_CATEGORIES);
  return JSON.parse(JSON.stringify(DEFAULT_CATEGORIES));
}
function saveCats(c) { localStorage.setItem(STORAGE_KEYS.CATS, JSON.stringify(c)); }

let transactions = loadTx();
let categories = loadCats();
let currentType = "expense";
let selectedCatId = null;
let currentCatTab = "expense";

/* ---------- Utils ---------- */
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function todayStr() { return new Date().toISOString().slice(0, 10); }
function fmtMoney(n) {
  n = Number(n) || 0;
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}
function fmtDateHuman(d) {
  const dt = new Date(d + "T00:00:00");
  const days = ["ഞായർ","തിങ്കൾ","ചൊവ്വ","ബുധൻ","വ്യാഴം","വെള്ളി","ശനി"];
  const months = ["ജനു","ഫെബ്ര","മാർ","ഏപ്ര","മേയ്","ജൂൺ","ജൂലൈ","ഓഗ","സെപ്റ്റ","ഒക്ട്","നവം","ഡിസം"];
  return `${dt.getDate()} ${months[dt.getMonth()]} ${dt.getFullYear()}, ${days[dt.getDay()]}`;
}
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
}
function catById(type, id) {
  return (categories[type] || []).find(c => c.id === id);
}

/* ---------- Navigation ---------- */
function showSection(name) {
  document.querySelectorAll("main section").forEach(s => s.classList.remove("active"));
  document.getElementById("sec-" + name).classList.add("active");
  document.querySelectorAll("nav.bottomnav button").forEach(b => b.classList.remove("active"));
  document.querySelector(`nav.bottomnav button[data-sec="${name}"]`).classList.add("active");
  if (name === "home") renderHome();
  if (name === "history") renderHistory();
  if (name === "category") renderCategoryManage();
  if (name === "entry" && !document.getElementById("fEditId").value) {
    document.getElementById("fDate").value = todayStr();
  }
}

/* ---------- Entry form ---------- */
function setType(type) {
  currentType = type;
  selectedCatId = null;
  document.getElementById("typeIncomeBtn").className = type === "income" ? "active-income" : "";
  document.getElementById("typeExpenseBtn").className = type === "expense" ? "active-expense" : "";
  const btn = document.getElementById("fSaveBtn");
  btn.className = "btn" + (type === "expense" ? " expense-btn" : "");
  renderCatGrid();
}

function renderCatGrid() {
  const grid = document.getElementById("fCatGrid");
  grid.innerHTML = "";
  (categories[currentType] || []).forEach(c => {
    const div = document.createElement("div");
    div.className = "cat-chip" + (selectedCatId === c.id ? " selected" + (currentType === "expense" ? " expense-selected" : "") : "");
    div.innerHTML = `<span class="emoji">${c.emoji}</span><span>${c.name}</span>`;
    div.onclick = () => { selectedCatId = c.id; renderCatGrid(); };
    grid.appendChild(div);
  });
}

function resetForm() {
  document.getElementById("fEditId").value = "";
  document.getElementById("fAmount").value = "";
  document.getElementById("fNote").value = "";
  document.getElementById("fDate").value = todayStr();
  document.getElementById("entryTitle").textContent = "➕ പുതിയ എൻട്രി";
  document.getElementById("fCancelBtn").style.display = "none";
  selectedCatId = null;
  setType("expense");
}

function saveTransaction() {
  const amount = parseFloat(document.getElementById("fAmount").value);
  const date = document.getElementById("fDate").value || todayStr();
  const note = document.getElementById("fNote").value.trim();
  const editId = document.getElementById("fEditId").value;

  if (!amount || amount <= 0) { showToast("⚠️ ശരിയായ തുക നൽകുക"); return; }
  if (!selectedCatId) { showToast("⚠️ കാറ്റഗറി തിരഞ്ഞെടുക്കുക"); return; }

  if (editId) {
    const tx = transactions.find(t => t.id === editId);
    if (tx) {
      tx.amount = amount; tx.date = date; tx.note = note;
      tx.type = currentType; tx.catId = selectedCatId;
    }
    showToast("✅ അപ്ഡേറ്റ് ചെയ്തു");
  } else {
    transactions.push({ id: uid(), type: currentType, catId: selectedCatId, amount, date, note, ts: Date.now() });
    showToast("✅ സേവ് ചെയ്തു");
  }
  saveTx(transactions);
  resetForm();
  showSection("home");
}

function editTransaction(id) {
  const tx = transactions.find(t => t.id === id);
  if (!tx) return;
  document.getElementById("fEditId").value = tx.id;
  document.getElementById("fAmount").value = tx.amount;
  document.getElementById("fDate").value = tx.date;
  document.getElementById("fNote").value = tx.note || "";
  document.getElementById("entryTitle").textContent = "✏️ എൻട്രി എഡിറ്റ് ചെയ്യുക";
  document.getElementById("fCancelBtn").style.display = "block";
  currentType = tx.type;
  selectedCatId = tx.catId;
  setType(tx.type);
  selectedCatId = tx.catId;
  renderCatGrid();
  showSection("entry");
}

function deleteTransaction(id) {
  if (!confirm("ഈ എൻട്രി ഡിലീറ്റ് ചെയ്യണോ?")) return;
  transactions = transactions.filter(t => t.id !== id);
  saveTx(transactions);
  showToast("🗑️ ഡിലീറ്റ് ചെയ്തു");
  renderHome(); renderHistory();
}

/* ---------- Home ---------- */
function renderHome() {
  const today = todayStr();
  const monthKey = today.slice(0, 7);

  let totIncome = 0, totExpense = 0, tIncome = 0, tExpense = 0, mIncome = 0, mExpense = 0;
  transactions.forEach(t => {
    if (t.type === "income") totIncome += t.amount; else totExpense += t.amount;
    if (t.date === today) { if (t.type === "income") tIncome += t.amount; else tExpense += t.amount; }
    if (t.date.slice(0, 7) === monthKey) { if (t.type === "income") mIncome += t.amount; else mExpense += t.amount; }
  });

  document.getElementById("sumIncome").textContent = fmtMoney(totIncome);
  document.getElementById("sumExpense").textContent = fmtMoney(totExpense);
  document.getElementById("sumBalance").textContent = fmtMoney(totIncome - totExpense);

  document.getElementById("todayIncome").textContent = fmtMoney(tIncome);
  document.getElementById("todayExpense").textContent = fmtMoney(tExpense);
  document.getElementById("todayBalance").textContent = fmtMoney(tIncome - tExpense);

  document.getElementById("monthIncome").textContent = fmtMoney(mIncome);
  document.getElementById("monthExpense").textContent = fmtMoney(mExpense);
  document.getElementById("monthBalance").textContent = fmtMoney(mIncome - mExpense);

  const recent = [...transactions].sort((a, b) => b.ts - a.ts).slice(0, 8);
  const box = document.getElementById("recentList");
  if (recent.length === 0) {
    box.innerHTML = `<div class="empty-state"><div class="emoji">🧾</div>ഇതുവരെ എൻട്രികൾ ഒന്നും ഇല്ല<br>ആദ്യ എൻട്രി ചേർക്കൂ!</div>`;
  } else {
    box.innerHTML = recent.map(t => txItemHtml(t, false)).join("");
  }
}

function txItemHtml(t, showActions) {
  const c = catById(t.type, t.catId) || { emoji: "❓", name: "മറ്റുള്ളവ" };
  return `<div class="tx-item">
    <div class="tx-icon ${t.type}">${c.emoji}</div>
    <div class="tx-mid">
      <div class="tx-cat">${c.name}</div>
      <div class="tx-note">${t.note ? t.note : fmtDateHuman(t.date)}</div>
    </div>
    <div class="tx-right">
      <div class="tx-amt ${t.type}">${t.type === "income" ? "+" : "-"}${fmtMoney(t.amount)}</div>
      ${showActions ? `<div class="tx-actions">
        <button onclick="editTransaction('${t.id}')">✏️ എഡിറ്റ്</button>
        <button onclick="deleteTransaction('${t.id}')">🗑️</button>
      </div>` : ""}
    </div>
  </div>`;
}

/* ---------- History ---------- */
function renderHistory() {
  const typeF = document.getElementById("histFilterType").value;
  const monthF = document.getElementById("histFilterMonth").value;
  let list = [...transactions];
  if (typeF !== "all") list = list.filter(t => t.type === typeF);
  if (monthF) list = list.filter(t => t.date.slice(0, 7) === monthF);
  list.sort((a, b) => (b.date + b.ts).localeCompare(a.date + a.ts));

  const box = document.getElementById("historyList");
  if (list.length === 0) {
    box.innerHTML = `<div class="empty-state"><div class="emoji">🔍</div>എൻട്രികൾ ഒന്നും കണ്ടെത്തിയില്ല</div>`;
    return;
  }

  const groups = {};
  list.forEach(t => { (groups[t.date] = groups[t.date] || []).push(t); });

  let html = "";
  Object.keys(groups).sort().reverse().forEach(date => {
    const items = groups[date];
    const dayTotal = items.reduce((s, t) => s + (t.type === "income" ? t.amount : -t.amount), 0);
    html += `<div class="day-group">
      <div class="day-header"><span>${fmtDateHuman(date)}</span><span class="day-total" style="color:${dayTotal >= 0 ? 'var(--green)' : 'var(--red)'}">${fmtMoney(dayTotal)}</span></div>
      ${items.map(t => txItemHtml(t, true)).join("")}
    </div>`;
  });
  box.innerHTML = html;
}

/* ---------- Category management ---------- */
function switchCatTab(type) {
  currentCatTab = type;
  document.getElementById("catTabIncome").classList.toggle("active", type === "income");
  document.getElementById("catTabExpense").classList.toggle("active", type === "expense");
  renderCategoryManage();
}

function renderCategoryManage() {
  const box = document.getElementById("catManageList");
  box.innerHTML = (categories[currentCatTab] || []).map(c => `
    <div class="cat-manage-item">
      <span class="emoji">${c.emoji}</span>
      <span class="name">${c.name}</span>
      <button onclick="renameCategory('${currentCatTab}','${c.id}')">✏️</button>
      <button onclick="deleteCategory('${currentCatTab}','${c.id}')">🗑️</button>
    </div>`).join("");
}

function addCategory() {
  const emoji = document.getElementById("newCatEmoji").value.trim() || "🏷️";
  const name = document.getElementById("newCatName").value.trim();
  if (!name) { showToast("⚠️ കാറ്റഗറി പേര് നൽകുക"); return; }
  categories[currentCatTab].push({ id: "c_" + uid(), emoji, name });
  saveCats(categories);
  document.getElementById("newCatName").value = "";
  renderCategoryManage();
  showToast("✅ കാറ്റഗറി ചേർത്തു");
}

function renameCategory(type, id) {
  const c = catById(type, id);
  if (!c) return;
  const newName = prompt("പുതിയ പേര്:", c.name);
  if (newName && newName.trim()) {
    c.name = newName.trim();
    saveCats(categories);
    renderCategoryManage();
  }
}

function deleteCategory(type, id) {
  const used = transactions.some(t => t.type === type && t.catId === id);
  if (used && !confirm("ഈ കാറ്റഗറി ചില എൻട്രികളിൽ ഉപയോഗിച്ചിട്ടുണ്ട്. എന്നാലും ഡിലീറ്റ് ചെയ്യണോ?")) return;
  if (!used && !confirm("ഈ കാറ്റഗറി ഡിലീറ്റ് ചെയ്യണോ?")) return;
  categories[type] = categories[type].filter(c => c.id !== id);
  saveCats(categories);
  renderCategoryManage();
  showToast("🗑️ ഡിലീറ്റ് ചെയ്തു");
}

/* ---------- Reports ---------- */
function setReportRange(range) {
  const now = new Date();
  let from, to;
  if (range === "today") { from = to = todayStr(); }
  else if (range === "week") {
    const day = now.getDay();
    const monday = new Date(now); monday.setDate(now.getDate() - ((day + 6) % 7));
    from = monday.toISOString().slice(0, 10); to = todayStr();
  } else if (range === "month") {
    from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    to = todayStr();
  }
  document.getElementById("repFrom").value = from;
  document.getElementById("repTo").value = to;
}

function getReportData() {
  const from = document.getElementById("repFrom").value;
  const to = document.getElementById("repTo").value;
  const type = document.getElementById("repType").value;
  let list = [...transactions];
  if (from) list = list.filter(t => t.date >= from);
  if (to) list = list.filter(t => t.date <= to);
  if (type !== "all") list = list.filter(t => t.type === type);
  list.sort((a, b) => a.date.localeCompare(b.date));
  return { list, from, to, type };
}

function generateReport() {
  const { list, from, to } = getReportData();
  const box = document.getElementById("reportResult");
  if (list.length === 0) {
    box.innerHTML = `<div class="empty-state"><div class="emoji">📭</div>ഈ കാലയളവിൽ എൻട്രികൾ ഇല്ല</div>`;
    return;
  }
  const income = list.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = list.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  let html = `<div class="summary-mini">
    <div class="box"><div class="lab">വരവ്</div><div class="num" style="color:var(--green)">${fmtMoney(income)}</div></div>
    <div class="box"><div class="lab">ചെലവ്</div><div class="num" style="color:var(--red)">${fmtMoney(expense)}</div></div>
    <div class="box"><div class="lab">ബാക്കി</div><div class="num">${fmtMoney(income - expense)}</div></div>
  </div>
  <div class="card">
    <button class="btn gold" onclick="exportPDF()">📄 PDF ഡൗൺലോഡ്</button>
    <button class="btn secondary" onclick="exportExcel()">📊 Excel ഡൗൺലോഡ്</button>
  </div>`;

  html += `<div class="card" style="padding:10px;">`;
  const groups = {};
  list.forEach(t => { (groups[t.date] = groups[t.date] || []).push(t); });
  Object.keys(groups).sort().reverse().forEach(date => {
    html += `<div class="day-group"><div class="day-header"><span>${fmtDateHuman(date)}</span></div>`;
    groups[date].forEach(t => { html += txItemHtml(t, false); });
    html += `</div>`;
  });
  html += `</div>`;

  box.innerHTML = html;
}

/* jsPDF's built-in fonts can't render Malayalam glyphs, so we fetch a
   Malayalam-capable TTF once and embed it into the PDF. Falls back to
   English labels if the font can't be fetched (e.g. no internet). */
const ML_FONT_URLS = [
  "https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts@main/phaseIII_only/unhinted/ttf/NotoSansMalayalam/NotoSansMalayalam-Regular.ttf",
  "https://raw.githubusercontent.com/jenskutilek/free-fonts/master/Noto/Noto%20Sans%20Malayalam/TTF/NotoSansMalayalam-Regular.ttf"
];

function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function ensureMalayalamFont(doc) {
  if (window._mlFontBase64 === undefined) {
    window._mlFontBase64 = null;
    for (const url of ML_FONT_URLS) {
      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        const buf = await res.arrayBuffer();
        window._mlFontBase64 = arrayBufferToBase64(buf);
        break;
      } catch (e) { /* try next url */ }
    }
  }
  if (window._mlFontBase64) {
    doc.addFileToVFS("NotoSansMalayalam.ttf", window._mlFontBase64);
    doc.addFont("NotoSansMalayalam.ttf", "NotoMal", "normal");
    return true;
  }
  return false;
}

async function exportPDF() {
  const { list, from, to } = getReportData();
  if (list.length === 0) { showToast("⚠️ ഡാറ്റ ഇല്ല"); return; }
  showToast("⏳ PDF തയ്യാറാക്കുന്നു...");

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const hasMlFont = await ensureMalayalamFont(doc);
  const fontName = hasMlFont ? "NotoMal" : "helvetica";
  doc.setFont(fontName);

  const title = hasMlFont ? "വരവ് ചെലവ് റിപ്പോർട്ട്" : "Varavu Chelavu Report";
  doc.setFontSize(16);
  doc.text(title, 14, 16);
  doc.setFontSize(10);
  doc.text(`${hasMlFont ? "കാലയളവ്" : "Period"}: ${from || '-'} to ${to || '-'}`, 14, 23);

  const income = list.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = list.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const summaryLabel = hasMlFont
    ? `ആകെ വരവ്: Rs. ${income.toFixed(2)}   ആകെ ചെലവ്: Rs. ${expense.toFixed(2)}   ബാക്കി: Rs. ${(income - expense).toFixed(2)}`
    : `Total Income: Rs. ${income.toFixed(2)}   Total Expense: Rs. ${expense.toFixed(2)}   Balance: Rs. ${(income - expense).toFixed(2)}`;
  doc.text(summaryLabel, 14, 30);

  const rows = list.map(t => {
    const c = catById(t.type, t.catId) || { name: "-" };
    const typeLabel = hasMlFont ? (t.type === "income" ? "വരവ്" : "ചെലവ്") : (t.type === "income" ? "Income" : "Expense");
    return [t.date, typeLabel, c.name, t.note || "-", (t.type === "income" ? "+" : "-") + t.amount.toFixed(2)];
  });

  const head = hasMlFont
    ? [["തീയതി", "തരം", "കാറ്റഗറി", "കുറിപ്പ്", "തുക (Rs.)"]]
    : [["Date", "Type", "Category", "Note", "Amount (Rs.)"]];

  doc.autoTable({
    head,
    body: rows,
    startY: 36,
    styles: { fontSize: 9, font: fontName },
    headStyles: { fillColor: [16, 122, 96], font: fontName },
    bodyStyles: { font: fontName }
  });

  doc.save(`varavu-chelavu-report-${todayStr()}.pdf`);
  showToast("✅ PDF ഡൗൺലോഡ് ചെയ്തു");
}

function exportExcel() {
  const { list, from, to } = getReportData();
  if (list.length === 0) { showToast("⚠️ ഡാറ്റ ഇല്ല"); return; }

  const rows = list.map(t => {
    const c = catById(t.type, t.catId) || { name: "-" };
    return {
      "തീയതി": t.date,
      "തരം": t.type === "income" ? "വരവ്" : "ചെലവ്",
      "കാറ്റഗറി": c.name,
      "കുറിപ്പ്": t.note || "",
      "തുക": t.amount
    };
  });
  const income = list.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = list.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  rows.push({});
  rows.push({ "തീയതി": "ആകെ വരവ്", "തുക": income });
  rows.push({ "തീയതി": "ആകെ ചെലവ്", "തുക": expense });
  rows.push({ "തീയതി": "ബാക്കി", "തുക": income - expense });

  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [{ wch: 14 }, { wch: 10 }, { wch: 18 }, { wch: 26 }, { wch: 12 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Report");
  XLSX.writeFile(wb, `varavu-chelavu-report-${todayStr()}.xlsx`);
  showToast("✅ Excel ഡൗൺലോഡ് ചെയ്തു");
}

/* ---------- Backup / Restore ---------- */
function downloadBackup() {
  const data = { transactions, categories, exportedAt: new Date().toISOString(), app: "varavu-chelavu", version: 1 };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `varavu-chelavu-backup-${todayStr()}.json`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast("✅ ബാക്കപ്പ് ഡൗൺലോഡ് ചെയ്തു");
}

function restoreBackup() {
  const fileInput = document.getElementById("restoreFile");
  const file = fileInput.files[0];
  if (!file) { showToast("⚠️ ഒരു ഫയൽ തിരഞ്ഞെടുക്കുക"); return; }
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.transactions || !data.categories) throw new Error("invalid");
      if (!confirm("നിലവിലുള്ള എല്ലാ ഡാറ്റയും മാറ്റിസ്ഥാപിക്കപ്പെടും. തുടരണോ?")) return;
      transactions = data.transactions;
      categories = data.categories;
      saveTx(transactions); saveCats(categories);
      showToast("✅ റീസ്റ്റോർ ചെയ്തു");
      renderHome();
    } catch (err) {
      showToast("❌ ഫയൽ ശരിയല്ല");
    }
  };
  reader.readAsText(file);
}

function clearAllData() {
  if (!confirm("എല്ലാ എൻട്രികളും ഡിലീറ്റ് ചെയ്യണോ? ഇത് തിരികെ എടുക്കാൻ കഴിയില്ല!")) return;
  if (!confirm("ഉറപ്പാണോ? ബാക്കപ്പ് എടുത്തിട്ടില്ലെങ്കിൽ ഡാറ്റ എന്നേക്കുമായി നഷ്ടപ്പെടും.")) return;
  transactions = [];
  saveTx(transactions);
  showToast("🗑️ എല്ലാ എൻട്രികളും ഡിലീറ്റ് ചെയ്തു");
  renderHome();
}

/* ---------- PWA install prompt ---------- */
let deferredPrompt;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  document.getElementById("installBanner").classList.add("show");
});
document.getElementById("installBtn").addEventListener("click", async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  document.getElementById("installBanner").classList.remove("show");
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}

/* ---------- Init ---------- */
document.getElementById("fDate").value = todayStr();
document.getElementById("histFilterMonth").value = todayStr().slice(0, 7);
setReportRange("month");
setType("expense");
renderHome();
