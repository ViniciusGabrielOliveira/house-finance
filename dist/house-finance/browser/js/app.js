import { auth, db, provider } from './firebase-init.js';
import { signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// === State Management ===
let appData = {
    categories: [],
    fixedExpenses: [],
    entries: []
};
let currentUser = null;
let unsubFirestore = null;

// === DOM Elements ===
const els = {
    authScreen: document.getElementById('auth-screen'),
    mainScreen: document.getElementById('main-screen'),
    googleLoginBtn: document.getElementById('google-login-btn'),
    currentUserSpan: document.getElementById('current-user'),
    logoutBtn: document.getElementById('logout-btn'),
    navBtns: document.querySelectorAll('.nav-btn'),
    routes: document.querySelectorAll('.route'),
    dashTotalSpent: document.getElementById('dash-total-spent'),
    dashFixedSpent: document.getElementById('dash-fixed-spent'),
    dashLeisureSpent: document.getElementById('dash-leisure-spent'),
    recentTransactionsList: document.getElementById('recent-transactions-list'),
    currentMonthLabel: document.getElementById('current-month-label'),
    addEntryForm: document.getElementById('add-entry-form'),
    entryDesc: document.getElementById('entry-desc'),
    entryAmount: document.getElementById('entry-amount'),
    entryDate: document.getElementById('entry-date'),
    entryCategory: document.getElementById('entry-category'),
    quickLeisureForm: document.getElementById('quick-leisure-form'),
    leisureDesc: document.getElementById('leisure-desc'),
    leisureAmount: document.getElementById('leisure-amount'),
    fixedExpensesList: document.getElementById('fixed-expenses-list'),
    addFixedBtn: document.getElementById('add-fixed-btn'),
    categoriesList: document.getElementById('categories-list'),
    addCategoryForm: document.getElementById('add-category-form'),
    newCatName: document.getElementById('new-cat-name'),
    newCatColor: document.getElementById('new-cat-color'),
    toast: document.getElementById('toast')
};

// === Initialization ===
function init() {
    setupRoutingListeners();
    handleRouteChanges(); // initial load

    // Set today's date on forms
    const today = new Date().toISOString().split('T')[0];
    els.entryDate.value = today;

    setupAppEventListeners();
}

// === Auth (Firebase) ===
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        els.currentUserSpan.textContent = user.displayName;
        els.authScreen.classList.remove('active');
        els.mainScreen.classList.add('active');
        startDataSync();
    } else {
        currentUser = null;
        if (unsubFirestore) unsubFirestore();
        els.authScreen.classList.add('active');
        els.mainScreen.classList.remove('active');
    }
});

els.googleLoginBtn.addEventListener('click', async () => {
    try {
        await signInWithPopup(auth, provider);
    } catch (error) {
        showToast('Erro no login: ' + error.message, true);
    }
});

els.logoutBtn.addEventListener('click', () => {
    signOut(auth);
});

// === Firestore Database ===
async function startDataSync() {
    const userDocRef = doc(db, 'usersData', currentUser.uid);

    // Check if doc exists, if not create default
    const docSnap = await getDoc(userDocRef);
    if (!docSnap.exists()) {
        const defaultData = {
            categories: [
                { id: "1", name: "Mercado", color: "#4caf50" },
                { id: "2", name: "Lazer", color: "#f44336" },
                { id: "3", name: "Transporte", color: "#2196f3" },
                { id: "4", name: "Saúde", color: "#9c27b0" }
            ],
            fixedExpenses: [],
            entries: []
        };
        await setDoc(userDocRef, defaultData);
    }

    // Listen in real-time
    unsubFirestore = onSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
            appData = doc.data();
            updateUI();
        }
    });
}

async function saveData() {
    if (!currentUser) return;
    try {
        const userDocRef = doc(db, 'usersData', currentUser.uid);
        await setDoc(userDocRef, appData);
    } catch (error) {
        showToast('Erro ao sincronizar na nuvem', true);
    }
}

// === Routing (History API) ===
function setupRoutingListeners() {
    els.navBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const targetRoute = btn.getAttribute('data-route');
            const path = btn.getAttribute('href');

            // Push history state
            window.history.pushState({ route: targetRoute }, '', path);
            handleRouteChanges();
        });
    });

    // Handle Back/Forward browser buttons
    window.addEventListener('popstate', handleRouteChanges);
}

function handleRouteChanges() {
    // Determine route from pathname or default to dashboard
    let path = window.location.pathname.replace('/', '');
    if (!path || path === 'index.html') path = 'dashboard';

    // Default fallback if route id doesn't exist
    const routeEl = document.getElementById(`route-${path}`);
    if (!routeEl) path = 'dashboard';

    // Update active nav button
    els.navBtns.forEach(b => {
        b.classList.remove('active');
        if (b.getAttribute('data-route') === path) b.classList.add('active');
    });

    // Update active route screen
    els.routes.forEach(r => r.classList.remove('active'));
    document.getElementById(`route-${path}`).classList.add('active');

    if (path === 'quick-leisure') {
        setTimeout(() => els.leisureDesc.focus(), 100);
    }
}

// === UI Updates ===
function updateUI() {
    updateCategoriesDropdown();
    updateDashboard();
    updateFixedExpenses();
    updateCategoriesList();
}

function updateCategoriesDropdown() {
    els.entryCategory.innerHTML = '';
    appData.categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.id;
        opt.textContent = cat.name;
        els.entryCategory.appendChild(opt);
    });
}

function updateDashboard() {
    const now = new Date();
    const currentMonthStr = now.toISOString().slice(0, 7);
    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    els.currentMonthLabel.textContent = `${monthNames[now.getMonth()]} de ${now.getFullYear()}`;

    const monthEntries = appData.entries.filter(e => e.date.startsWith(currentMonthStr));

    let totalSpent = 0;
    let leisureSpent = 0;
    const leisureCat = appData.categories.find(c => c.name.toLowerCase() === 'lazer');

    monthEntries.forEach(entry => {
        const amount = parseFloat(entry.amount);
        totalSpent += amount;
        if (leisureCat && entry.category === leisureCat.id) {
            leisureSpent += amount;
        }
    });

    let fixedSpent = 0;
    appData.fixedExpenses.forEach(fe => {
        fixedSpent += parseFloat(fe.amount);
    });

    els.dashTotalSpent.textContent = formatFreq(totalSpent);
    els.dashFixedSpent.textContent = formatFreq(fixedSpent);
    els.dashLeisureSpent.textContent = formatFreq(leisureSpent);

    els.recentTransactionsList.innerHTML = '';
    const recent = [...appData.entries].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

    if (recent.length === 0) {
        els.recentTransactionsList.innerHTML = '<li class="transaction-item"><div class="transaction-info"><span class="transaction-desc" style="color:var(--text-muted)">Nenhum lançamento no mês.</span></div></li>';
    }

    recent.forEach(entry => {
        const cat = appData.categories.find(c => c.id === entry.category) || { name: 'Sem Categoria', color: '#94a3b8' };
        const li = document.createElement('li');
        li.className = 'transaction-item';
        li.innerHTML = `
            <div class="transaction-info">
                <span class="transaction-desc">${entry.description}</span>
                <div class="transaction-meta">
                    <span class="category-badge" style="background-color: ${cat.color}">${cat.name}</span>
                    <span>${formatDateBR(entry.date)}</span>
                </div>
            </div>
            <div class="transaction-amount">- ${formatFreq(entry.amount)}</div>
        `;
        els.recentTransactionsList.appendChild(li);
    });
}

function updateFixedExpenses() {
    els.fixedExpensesList.innerHTML = '';
    const currentMonthStr = new Date().toISOString().slice(0, 7);

    if (appData.fixedExpenses.length === 0) {
        els.fixedExpensesList.innerHTML = '<li class="transaction-item"><div style="color:var(--text-muted)">Sem contas fixas cadastradas.</div></li>';
        return;
    }

    appData.fixedExpenses.forEach(expense => {
        const cat = appData.categories.find(c => c.id === expense.category) || { name: 'Fixa', color: '#64748b' };
        const isPaid = appData.entries.some(e => e.fixedExpenseId === expense.id && e.date.startsWith(currentMonthStr));

        const li = document.createElement('li');
        li.className = 'transaction-item';
        li.innerHTML = `
            <div class="transaction-info">
                <span class="transaction-desc ${isPaid ? 'amount-paid' : ''}">${expense.name} (Vence dia ${expense.dueDate})</span>
                <div class="transaction-meta">
                    <span class="category-badge" style="background-color: ${cat.color}">${cat.name}</span>
                </div>
            </div>
            <div class="d-flex" style="display:flex; gap: 1rem; align-items: center;">
                <div class="transaction-amount ${isPaid ? 'amount-paid' : ''}">R$ ${parseFloat(expense.amount).toFixed(2).replace('.', ',')}</div>
                ${!isPaid ? `<button class="btn secondary-btn small-btn mark-paid-btn" data-id="${expense.id}">Pendente</button>` : `<span style="color: var(--secondary); font-weight:600; font-size: 0.9rem">✔ Pago</span>`}
            </div>
        `;
        els.fixedExpensesList.appendChild(li);
    });

    document.querySelectorAll('.mark-paid-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const expId = e.target.getAttribute('data-id');
            await markFixedExpenseAsPaid(expId);
        });
    });
}

function updateCategoriesList() {
    els.categoriesList.innerHTML = '';
    appData.categories.forEach(cat => {
        const li = document.createElement('li');
        li.className = 'pill';
        li.style.backgroundColor = cat.color;
        li.innerHTML = `
            ${cat.name}
            <button class="action-btn" data-id="${cat.id}" style="color: rgba(255,255,255,0.8); padding:0; margin-left: 0.5rem">&times;</button>
        `;
        els.categoriesList.appendChild(li);
    });

    els.categoriesList.querySelectorAll('.action-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.getAttribute('data-id');
            appData.categories = appData.categories.filter(c => c.id !== id);
            await saveData();
            showToast('Categoria removida');
        });
    });
}

// === Actions ===
async function markFixedExpenseAsPaid(fixedExpenseId) {
    const expense = appData.fixedExpenses.find(f => f.id === fixedExpenseId);
    if (!expense) return;

    const today = new Date().toISOString().split('T')[0];
    const newEntry = {
        id: Date.now().toString(),
        description: `Pgto. Conta: ${expense.name}`,
        amount: parseFloat(expense.amount),
        date: today,
        category: expense.category,
        fixedExpenseId: expense.id
    };

    appData.entries.push(newEntry);
    await saveData();
    showToast(`${expense.name} marcada como paga!`);
}

function setupAppEventListeners() {
    els.addEntryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newEntry = {
            id: Date.now().toString(),
            description: els.entryDesc.value.trim(),
            amount: parseFloat(els.entryAmount.value),
            date: els.entryDate.value,
            category: els.entryCategory.value
        };
        appData.entries.push(newEntry);
        await saveData();
        els.addEntryForm.reset();
        els.entryDate.value = new Date().toISOString().split('T')[0];
        showToast('Despesa lançada com sucesso!');
    });

    els.quickLeisureForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        let leisureCat = appData.categories.find(c => c.name.toLowerCase() === 'lazer');
        if (!leisureCat) leisureCat = appData.categories[0];

        const today = new Date().toISOString().split('T')[0];
        const newEntry = {
            id: Date.now().toString(),
            description: els.leisureDesc.value.trim(),
            amount: parseFloat(els.leisureAmount.value),
            date: today,
            category: leisureCat.id
        };
        appData.entries.push(newEntry);
        await saveData();
        els.quickLeisureForm.reset();
        els.leisureDesc.focus();
        showToast('Lazer registrado! Vai curtir!');
    });

    els.addCategoryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newCat = {
            id: Date.now().toString(),
            name: els.newCatName.value.trim(),
            color: els.newCatColor.value
        };
        appData.categories.push(newCat);
        await saveData();
        els.addCategoryForm.reset();
        els.newCatColor.value = "#ffffff";
        showToast('Categoria adicionada!');
    });

    els.addFixedBtn.addEventListener('click', () => {
        const name = prompt("Nome da Conta Fixa:");
        if (!name) return;
        const amount = prompt("Valor (R$):");
        if (!amount) return;
        const dueDate = prompt("Dia do Vencimento (01 a 31):");
        if (!dueDate) return;

        let fixedCat = appData.categories[0]?.id || "f";

        const newFixed = {
            id: 'f' + Date.now().toString(),
            name: name,
            amount: parseFloat(amount),
            dueDate: dueDate.padStart(2, '0'),
            category: fixedCat
        };

        appData.fixedExpenses.push(newFixed);
        saveData().then(() => {
            showToast('Conta Fixa adicionada!');
        });
    });
}

// === Helpers ===
function formatFreq(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}
function formatDateBR(dateStr) {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
}
let toastTimeout;
function showToast(msg, isError = false) {
    els.toast.textContent = msg;
    els.toast.style.background = isError ? "var(--danger)" : "var(--secondary)";
    els.toast.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        els.toast.classList.remove('show');
    }, 3000);
}

// Boot application
init();
