/**
 * Market Observer - Vanilla JS Edition
 * No compilation required.
 */

const state = {
    stocks: [],
    isJpSearch: false,
    loading: {}
};

// UI Elements
const stockListEl = document.getElementById('stock-list');
const permanentStocksEl = document.getElementById('permanent-stocks');
const toggleJpBtn = document.getElementById('toggle-jp');
const resetDefaultsBtn = document.getElementById('reset-defaults');
const stockInput = document.getElementById('stock-input');
const errorMsgEl = document.getElementById('error-msg');
const updateTimeEl = document.getElementById('last-update');
const currentTimeEl = document.getElementById('current-time');

// Initialize
function init() {
    startClock();
    const saved = localStorage.getItem('ticker-stocks-vanilla');
    if (saved) {
        try {
            state.stocks = JSON.parse(saved);
            if (!Array.isArray(state.stocks)) throw new Error("Invalid state format");
            render();
            state.stocks.forEach(s => refreshStock(s.symbol, s.isJp));
        } catch (e) {
            console.error("Failed to parse saved state, loading defaults:", e);
            loadDefaults();
        }
    } else {
        loadDefaults();
    }

    // Auto Refresh
    setInterval(() => {
        state.stocks.forEach(s => refreshStock(s.symbol, s.isJp));
    }, 30000);
}

function startClock() {
    function updateClock() {
        const now = new Date();
        currentTimeEl.innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
    updateClock();
    setInterval(updateClock, 1000);
}

async function loadDefaults() {
    await addStock("998407.O", true);
    await addStock("^DJI", false);
    await addStock("^IXIC", false);
}

function saveState() {
    try {
        localStorage.setItem('ticker-stocks-vanilla', JSON.stringify(state.stocks));
        console.log("State saved to localStorage successfully.");
    } catch (e) {
        console.error("Failed to save state to localStorage:", e);
    }
}

// Actions
async function addStock(symbol, isJp) {
    if (!symbol) return;
    const cleanSymbol = symbol.trim().toUpperCase();
    
    if (state.stocks.find(s => s.symbol === cleanSymbol && s.isJp === isJp)) return;

    showError(null);
    try {
        const data = await fetchStock(cleanSymbol, isJp);
        state.stocks = [data, ...state.stocks];
        saveState();
        render();
        stockInput.value = "";
    } catch (e) {
        showError(`Failed to add ${cleanSymbol}: ${e.message}`);
    }
}

async function refreshStock(symbol, isJp) {
    try {
        const data = await fetchStock(symbol, isJp);
        state.stocks = state.stocks.map(s => s.symbol === symbol && s.isJp === isJp ? data : s);
        render();
        updateTimeEl.innerText = `UPDATED: ${new Date().toLocaleTimeString()}`;
    } catch (e) {
        console.error("Refresh failed", symbol);
    }
}

function removeStock(symbol, isJp) {
    state.stocks = state.stocks.filter(s => !(s.symbol === symbol && s.isJp === isJp));
    saveState();
    render();
}

async function fetchStock(symbol, isJp) {
    const endpoint = isJp ? `/api/stocks/yahoo-jp/${encodeURIComponent(symbol)}` : `/api/stocks/yahoo-finance/${encodeURIComponent(symbol)}`;
    console.log("Fetching:", endpoint);
    const response = await fetch(endpoint);
    if (!response.ok) {
        throw new Error(`Failed to fetch stock: ${response.statusText}`);
    }
    const data = await response.json();
    return { ...data, isJp };
}

// Rendering
function render() {
    permanentStocksEl.innerHTML = '';
    stockListEl.innerHTML = '';
    
    if (state.stocks.length === 0) {
        stockListEl.innerHTML = '<div class="text-center py-12 opacity-20"><p class="text-xs uppercase tracking-[0.2em]">Awaiting Data Feed</p></div>';
        return;
    }
    
    const permanentSymbols = ["998407.O", "^DJI", "^IXIC"];
    
    state.stocks.forEach((stock, index) => {
        if (permanentSymbols.includes(stock.symbol)) {
            const card = createStockCard(stock, 'list');
            permanentStocksEl.appendChild(card);
        } else {
            const card = createStockCard(stock, index === 0 ? 'hero' : 'list');
            stockListEl.appendChild(card);
        }
    });

    if (permanentStocksEl.children.length === 0) {
        permanentStocksEl.innerHTML = '<div class="text-center py-2 opacity-20"><p class="text-[9px] uppercase">Awaiting Indices</p></div>';
    }
}

function createStockCard(data, variant) {
    const div = document.createElement('div');
    const isPositive = data.change >= 0;
    const color = isPositive ? 'emerald-500' : 'rose-500';
    const currency = data.currency === 'JPY' ? '¥' : (data.currency === 'USD' ? '$' : (data.isJp ? '¥' : '$'));

    if (variant === 'hero') {
        div.className = "relative group flex flex-col gap-1 p-2 animate-in fade-in slide-in-from-bottom-4 duration-500";
        div.innerHTML = `
            <div class="flex justify-between items-end">
                <h2 class="text-5xl font-light tracking-tighter text-white">${data.symbol === '998407.O' ? '日経平均' : (data.symbol === '^DJI' ? 'ダウ平均' : (data.symbol === '^IXIC' ? 'Nasdaq' : data.symbol))}</h2>
                <div class="px-3 py-1 bg-${color} text-black text-[11px] font-bold rounded-full mb-1 italic flex items-center gap-1">
                    ${isPositive ? '+' : ''}${data.change}
                    <span class="text-[9px] opacity-80 font-medium ml-1">(${data.changePercent?.toFixed(2)}%)</span>
                    <div class="flex gap-1 ml-2 opacity-60 no-drag">
                        <button class="refresh-btn hover:scale-110">⟳</button>
                        <button class="remove-btn hover:scale-110">✕</button>
                    </div>
                </div>
            </div>
            <div class="flex justify-between items-baseline">
                <span class="text-xs uppercase tracking-widest text-white/40 truncate max-w-[200px]">${data.name || 'Asset'}</span>
                <span class="text-2xl font-mono text-white/90">${currency}${data.price.toLocaleString()}</span>
            </div>
            <div class="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mt-4 mb-2"></div>
        `;
    } else {
        div.className = "flex items-center justify-between group p-2 rounded-lg hover:bg-white/[0.02] transition-colors";
        div.innerHTML = `
            <div class="flex items-center gap-4">
                <div class="w-1.5 h-1.5 rounded-full bg-${color}"></div>
                <div>
                    <p class="text-xs font-bold tracking-tight text-white/90">${data.symbol === '998407.O' ? '日経平均' : (data.symbol === '^DJI' ? 'ダウ平均' : (data.symbol === '^IXIC' ? 'Nasdaq' : data.symbol))}</p>
                    <p class="text-[10px] text-white/40 uppercase tracking-tighter truncate max-w-[120px]">${data.name || 'Asset'}</p>
                </div>
            </div>
            <div class="text-right flex flex-col items-end">
                <div class="flex items-center gap-2">
                    <p class="font-mono text-sm text-white/80">${currency}${data.price.toLocaleString()}</p>
                    <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity no-drag">
                         <button class="refresh-btn text-white/20 hover:text-white text-[10px]">⟳</button>
                         <button class="remove-btn text-white/20 hover:text-rose-400 text-[10px]">✕</button>
                    </div>
                </div>
                <p class="text-[10px] font-medium italic text-${color}">
                    ${isPositive ? '+' : ''}${data.change} (${data.changePercent?.toFixed(2)}%)
                </p>
            </div>
        `;
    }

    // Attach Events
    div.querySelector('.refresh-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        refreshStock(data.symbol, data.isJp);
    });
    div.querySelector('.remove-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        removeStock(data.symbol, data.isJp);
    });

    return div;
}

function showError(msg) {
    if (msg) {
        errorMsgEl.innerText = msg;
        errorMsgEl.classList.remove('hidden');
    } else {
        errorMsgEl.classList.add('hidden');
    }
}

// Event Listeners
toggleJpBtn.addEventListener('click', () => {
    state.isJpSearch = !state.isJpSearch;
    toggleJpBtn.innerText = state.isJpSearch ? 'JPN' : 'GLO';
    toggleJpBtn.className = `text-[9px] px-1.5 py-0.5 rounded border transition-colors ${state.isJpSearch ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-white/5 border-white/10 text-white/20'}`;
    stockInput.placeholder = state.isJpSearch ? "Enter Code... (7203)" : "Enter Symbol... (AAPL)";
});

resetDefaultsBtn.addEventListener('click', async () => {
    state.stocks = [];
    localStorage.removeItem('ticker-stocks-vanilla');
    await loadDefaults();
});

stockInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addStock(stockInput.value, state.isJpSearch);
});

init();
