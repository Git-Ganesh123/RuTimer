// ======================
// Timer & Session State
// ======================
let timerState = 'ready'; // ready, running, stopped
let startTime = null;
let elapsedTime = 0;
let timerInterval = null;
let spacebarHeld = false;
let spacebarHoldStart = null;

// Current event & scramble
let currentEvent = '3x3';
let currentScramble = '';

// Sessions
let sessions = [];
let currentSessionId = null;
const MAX_SESSIONS = 10;

// ======================
// Move Generators
// ======================
const BASE_FACES = ['R', 'L', 'U', 'D', 'F', 'B'];
const MODIFIERS = ['', "'", '2'];

function generateMovesForSize(size) {
    const moves = [];

    // Outer layer moves
    BASE_FACES.forEach(face => MODIFIERS.forEach(mod => moves.push(face + mod)));

    // Wide moves for 4x4+
    if (size >= 4) BASE_FACES.forEach(face => MODIFIERS.forEach(mod => moves.push(face + 'w' + mod)));

    // 3-layer wide moves for 6x6+
    if (size >= 6) BASE_FACES.forEach(face => MODIFIERS.forEach(mod => moves.push('3' + face + 'w' + mod)));

    return moves;
}

function generateNxNScramble(size, length) {
    const moves = generateMovesForSize(size);
    const scramble = [];
    let lastAxis = null;
    const axisMap = { R: 'x', L: 'x', U: 'y', D: 'y', F: 'z', B: 'z' };

    while (scramble.length < length) {
        const move = moves[Math.floor(Math.random() * moves.length)];
        const face = move.replace(/[0-9w']/g, '')[0];
        const axis = axisMap[face];
        if (axis !== lastAxis) {
            scramble.push(move);
            lastAxis = axis;
        }
    }

    return scramble.join(' ');
}

function generateScrambleSkewb(length = 11) {
    const moves = ['R', "R'", 'U', "U'", 'B', "B'", 'L', "L'"];
    const scramble = [];
    let lastMove = '';
    for (let i = 0; i < length; i++) {
        let move;
        do {
            move = moves[Math.floor(Math.random() * moves.length)];
        } while (move[0] === lastMove[0]);
        scramble.push(move);
        lastMove = move;
    }
    return scramble.join(' ');
}

function generateScrambleSquare1() {
    const scramble = [];
    const length = 20;
    for (let i = 0; i < length; i++) {
        const top = Math.floor(Math.random() * 7) - 3;
        const bottom = Math.floor(Math.random() * 7) - 3;
        scramble.push(i === 0 ? `(${top},${bottom})` : `/ (${top},${bottom})`);
    }
    return scramble.join(' ');
}

function generateScramble(event) {
    switch (event) {
        case '3x3':
        case '3x3OH':
        case 'blind': return generateNxNScramble(3, 25);
        case '4x4': return generateNxNScramble(4, 40);
        case '5x5': return generateNxNScramble(5, 60);
        case '6x6': return generateNxNScramble(6, 80);
        case '7x7': return generateNxNScramble(7, 100);
        case 'skewb': return generateScrambleSkewb(11);
        case 'square-1': return generateScrambleSquare1();
        default: return generateNxNScramble(3, 25);
    }
}

// ======================
// Timer Functions
// ======================
function formatTime(ms) {
    return (ms / 1000).toFixed(3);
}

function updateTimer() {
    const timerEl = document.getElementById('timer');
    if (timerState === 'running') {
        elapsedTime = Date.now() - startTime;
        timerEl.textContent = formatTime(elapsedTime);
    } else if (timerState === 'stopped') {
        timerEl.textContent = formatTime(elapsedTime);
    } else {
        timerEl.textContent = '0.000';
    }
}

function startTimer() {
    if (timerState !== 'ready') return;
    timerState = 'running';
    startTime = Date.now();
    elapsedTime = 0;

    const timerEl = document.getElementById('timer');
    timerEl.classList.remove('ready', 'stopped');
    timerEl.classList.add('running');

    timerInterval = setInterval(updateTimer, 10);
    generateNewScramble();
}

function stopTimer() {
    if (timerState !== 'running') return;
    timerState = 'stopped';
    clearInterval(timerInterval);

    const timerEl = document.getElementById('timer');
    timerEl.classList.remove('running');
    timerEl.classList.add('stopped');

    // Save time
    const session = getCurrentSession();
    if (session) {
        session.times.push({
            id: Date.now().toString(),
            time: elapsedTime,
            penalty: 0,
            timestamp: Date.now()
        });
        saveSessions();
        updateTimesList();
        updateStatistics();
    }

    generateNewScramble();
}

function resetTimer() {
    timerState = 'ready';
    elapsedTime = 0;
    clearInterval(timerInterval);

    const timerEl = document.getElementById('timer');
    timerEl.classList.remove('running', 'stopped');
    timerEl.classList.add('ready');
    timerEl.textContent = '0.000';
}


document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !spacebarHeld) {
        e.preventDefault();
        spacebarHeld = true;
        spacebarHoldStart = Date.now();
        const timerEl = document.getElementById('timer');
        if (timerState === 'ready' || timerState === 'stopped') timerEl.style.color = '#f87171';
        setTimeout(() => {
            if (spacebarHeld && (timerState === 'ready' || timerState === 'stopped')) {
                timerEl.style.color = '#4ade80';
            }
        }, 400);
    }
});

document.addEventListener('keyup', (e) => {
    if (e.code === 'Space' && spacebarHeld) {
        e.preventDefault();
        const holdDuration = Date.now() - spacebarHoldStart;

        if (timerState === 'ready' || timerState === 'stopped') {
            if (holdDuration >= 400) {
                if (timerState === 'stopped') resetTimer();
                startTimer();
            }
        } else if (timerState === 'running') stopTimer();

        spacebarHeld = false;
        spacebarHoldStart = null;
        document.getElementById('timer').style.color = '';
    }
});


function initSessions() {
    const saved = localStorage.getItem('rubiksSessions');
    if (saved) sessions = JSON.parse(saved);
    else {
        sessions = [{ id: Date.now().toString(), name: 'Session 1', times: [] }];
        saveSessions();
    }
    currentSessionId = sessions[0].id;
    updateSessionSelect();
    loadCurrentSession();
}

function saveSessions() {
    localStorage.setItem('rubiksSessions', JSON.stringify(sessions));
}

function getCurrentSession() {
    return sessions.find(s => s.id === currentSessionId);
}

function loadCurrentSession() {
    updateTimesList();
    updateStatistics();
}

function updateSessionSelect() {
    const select = document.getElementById('session-select');
    select.innerHTML = '';
    sessions.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = s.name;
        if (s.id === currentSessionId) opt.selected = true;
        select.appendChild(opt);
    });
}

function createNewSession() {
    if (sessions.length >= MAX_SESSIONS) return alert(`Max ${MAX_SESSIONS} sessions`);
    const newSession = { id: Date.now().toString(), name: `Session ${sessions.length + 1}`, times: [] };
    sessions.push(newSession);
    currentSessionId = newSession.id;
    saveSessions();
    updateSessionSelect();
    loadCurrentSession();
}

function renameCurrentSession() {
    const session = getCurrentSession();
    if (!session) return;
    const name = prompt('Enter new session name:', session.name);
    if (name?.trim()) {
        session.name = name.trim();
        saveSessions();
        updateSessionSelect();
    }
}

function deleteCurrentSession() {
    if (sessions.length <= 1) return alert('Cannot delete last session');
    if (confirm('Delete session? All times lost.')) {
        sessions = sessions.filter(s => s.id !== currentSessionId);
        currentSessionId = sessions[0].id;
        saveSessions();
        updateSessionSelect();
        loadCurrentSession();
    }
}

// ======================
// Times & Statistics
// ======================
function updateTimesList() {
    const session = getCurrentSession();
    if (!session) return;

    const list = document.getElementById('times-list');
    list.innerHTML = '';

    const valid = session.times.filter(t => t.penalty !== -1);
    let bestId = null, worstId = null;
    if (valid.length > 0) {
        const totals = valid.map(t => ({ id: t.id, total: t.time + t.penalty }));
        bestId = totals.reduce((min, t) => t.total < min.total ? t : min).id;
        worstId = totals.reduce((max, t) => t.total > max.total ? t : max).id;
    }

    [...session.times].reverse().forEach((t, i) => {
        const div = document.createElement('div');
        div.className = 'time-item';
        if (t.penalty === -1) div.classList.add('dnf');
        if (t.id === bestId) div.classList.add('best-solve');
        if (t.id === worstId) div.classList.add('worst-solve');

        let display = t.penalty === -1 ? 'DNF' : formatTime(t.time + t.penalty);
        if (t.penalty === 2000) display += ' (+2)';

        div.innerHTML = `
            <span class="time-value">${i + 1}. ${display}</span>
            <div class="time-actions">
                <button class="time-action-btn" onclick="addPenalty('${t.id}',2000)">+2</button>
                <button class="time-action-btn" onclick="setDNF('${t.id}')">DNF</button>
                <button class="time-action-btn" onclick="deleteTime('${t.id}')">Delete</button>
            </div>

        `;
        list.appendChild(div);
    });
}

function deleteTime(id) { const s = getCurrentSession(); if (!s) return; s.times = s.times.filter(t => t.id !== id); saveSessions(); updateTimesList(); updateStatistics(); }
function addPenalty(id, pen) { const s = getCurrentSession(); if (!s) return; const t = s.times.find(x => x.id === id); if (!t) return; t.penalty = t.penalty === pen ? 0 : pen; saveSessions(); updateTimesList(); updateStatistics(); }
function setDNF(id) { const s = getCurrentSession(); if (!s) return; const t = s.times.find(x => x.id === id); if (!t) return; t.penalty = t.penalty === -1 ? 0 : -1; saveSessions(); updateTimesList(); updateStatistics(); }

function getTimesWithDNFs() { 
    const s = getCurrentSession(); 
    if (!s) return []; 
    return s.times.map(t => {
        if (t.penalty === -1) return -1; // DNF
        return t.time + t.penalty;
    }); 
}

function calculateMean(times) { if (!times.length) return null; return times.reduce((a,b)=>a+b,0)/times.length; }
function calculateAverage(times, count) {
    if (times.length < count) return null;

    const recent = times.slice(-count);
    let dnfCount = recent.filter(t => t === -1).length;

    if (dnfCount >= 2) return -1; // 2+ DNFs → average is DNF

    // 1 DNF → treat as worst solve
    let values = recent.map(t => t === -1 ? Infinity : t);
    values.sort((a,b) => a - b);

    // remove best and worst
    values.shift(); // remove best
    values.pop();   // remove worst (or DNF counted as worst)

    return calculateMean(values);
}
function calculateBestAverage(times, count) {
    if (times.length < count) return null;

    let best = null;
    for (let i = count - 1; i < times.length; i++) {
        const window = times.slice(i - count + 1, i + 1);
        const avg = calculateAverage(window, count);
        if (avg !== null && (best === null || (avg !== -1 && avg < best))) best = avg;
    }
    return best;
}

function updateStatistics() {
    const valid = getTimesWithDNFs();
    document.getElementById('mo3').textContent = valid.length>=3?formatTime(calculateMean(valid.slice(-3))):'-';
    document.getElementById('ao5').textContent = calculateAverage(valid,5) === -1 ? 'DNF' : formatTime(calculateAverage(valid,5));
    document.getElementById('ao12').textContent = calculateAverage(valid,12) === -1 ? 'DNF' : formatTime(calculateAverage(valid,12));

    document.getElementById('session-mean').textContent = valid.length?formatTime(calculateMean(valid)):'-';
    const bestSolveEl = document.getElementById('best-solve');
    const worstSolveEl = document.getElementById('worst-solve');
    if(valid.length){ bestSolveEl.textContent=formatTime(Math.min(...valid)); worstSolveEl.textContent=formatTime(Math.max(...valid)); } else { bestSolveEl.textContent='-'; worstSolveEl.textContent='-'; }
}

// ======================
// Scramble Display
// ======================
function generateNewScramble() {
    currentScramble = generateScramble(currentEvent);
    document.getElementById('scramble').textContent = currentScramble;
}

function updateEvent() {
    currentEvent = document.getElementById('event-select').value;
    generateNewScramble();
}

// ======================
// Initialize
// ======================
document.getElementById('session-select')?.addEventListener('change', e=>{currentSessionId=e.target.value;loadCurrentSession();});
document.getElementById('event-select')?.addEventListener('change', updateEvent);
document.getElementById('new-session-btn')?.addEventListener('click', createNewSession);
document.getElementById('rename-session-btn')?.addEventListener('click', renameCurrentSession);
document.getElementById('delete-session-btn')?.addEventListener('click', deleteCurrentSession);

initSessions();
generateNewScramble();
