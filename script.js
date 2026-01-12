// Timer state
let timerState = 'ready'; // ready, running, stopped
let startTime = null;
let elapsedTime = 0;
let timerInterval = null;
let spacebarHeld = false;
let spacebarHoldStart = null;
let holdDuration = 0;

// Scramble generator - only capital letters (single layer moves)
const moves = ['R', "R'", 'R2', 'L', "L'", 'L2', 'U', "U'", 'U2', 'D', "D'", 'D2', 'F', "F'", 'F2', 'B', "B'", 'B2'];

function generateScramble(length = 25) {
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

// Session management
let sessions = [];
let currentSessionId = null;
const MAX_SESSIONS = 10;

function initSessions() {
    const saved = localStorage.getItem('rubiksSessions');
    if (saved) {
        sessions = JSON.parse(saved);
    } else {
        // Create default session
        sessions = [{
            id: Date.now().toString(),
            name: 'Session 1',
            times: []
        }];
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
    
    sessions.forEach(session => {
        const option = document.createElement('option');
        option.value = session.id;
        option.textContent = session.name;
        if (session.id === currentSessionId) {
            option.selected = true;
        }
        select.appendChild(option);
    });
}

function createNewSession() {
    if (sessions.length >= MAX_SESSIONS) {
        alert(`Maximum ${MAX_SESSIONS} sessions allowed`);
        return;
    }
    
    const sessionNumber = sessions.length + 1;
    const newSession = {
        id: Date.now().toString(),
        name: `Session ${sessionNumber}`,
        times: []
    };
    
    sessions.push(newSession);
    currentSessionId = newSession.id;
    saveSessions();
    updateSessionSelect();
    loadCurrentSession();
}

function renameCurrentSession() {
    const session = getCurrentSession();
    if (!session) return;
    
    const newName = prompt('Enter new session name:', session.name);
    if (newName && newName.trim()) {
        session.name = newName.trim();
        saveSessions();
        updateSessionSelect();
    }
}

function deleteCurrentSession() {
    if (sessions.length <= 1) {
        alert('Cannot delete the last session');
        return;
    }
    
    if (confirm('Are you sure you want to delete this session? All times will be lost.')) {
        sessions = sessions.filter(s => s.id !== currentSessionId);
        currentSessionId = sessions[0].id;
        saveSessions();
        updateSessionSelect();
        loadCurrentSession();
    }
}

// Timer functions
function formatTime(ms) {
    const seconds = ms / 1000;
    return seconds.toFixed(3);
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
        const timeEntry = {
            id: Date.now().toString(),
            time: elapsedTime,
            penalty: 0, // 0 = none, 2000 = +2, -1 = DNF
            timestamp: Date.now()
        };
        session.times.push(timeEntry);
        saveSessions();
        updateTimesList();
        updateStatistics();
    }
    
    generateNewScramble();
}

function resetTimer() {
    timerState = 'ready';
    startTime = null;
    elapsedTime = 0;
    clearInterval(timerInterval);
    
    const timerEl = document.getElementById('timer');
    timerEl.classList.remove('running', 'stopped');
    timerEl.classList.add('ready');
    timerEl.textContent = '0.000';
}

// Spacebar handling
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !spacebarHeld) {
        e.preventDefault();
        spacebarHeld = true;
        spacebarHoldStart = Date.now();
        
        const timerEl = document.getElementById('timer');
        if (timerState === 'ready' || timerState === 'stopped') {
            timerEl.style.color = '#f87171'; // Red
            
            // Check for long press after 0.4 seconds
            setTimeout(() => {
                if (spacebarHeld && (timerState === 'ready' || timerState === 'stopped')) {
                    timerEl.style.color = '#4ade80'; // Green
                }
            }, 400);
        }
    }
});

document.addEventListener('keyup', (e) => {
    if (e.code === 'Space' && spacebarHeld) {
        e.preventDefault();
        const holdDuration = Date.now() - spacebarHoldStart;
        
        if (timerState === 'ready' || timerState === 'stopped') {
            // Long press (≥400ms) starts the timer
            if (holdDuration >= 400) {
                // Reset to ready state first if stopped
                if (timerState === 'stopped') {
                    timerState = 'ready';
                    elapsedTime = 0;
                    const timerEl = document.getElementById('timer');
                    timerEl.classList.remove('stopped');
                    timerEl.classList.add('ready');
                    timerEl.textContent = '0.000';
                }
                startTimer();
            }
        } else if (timerState === 'running') {
            // Single click stops the timer
            stopTimer();
        }
        
        spacebarHeld = false;
        spacebarHoldStart = null;
        
        // Reset inline color to let CSS classes take over
        const timerEl = document.getElementById('timer');
        timerEl.style.color = '';
    }
});

// Scramble management
let currentScramble = generateScramble();

function generateNewScramble() {
    currentScramble = generateScramble();
    document.getElementById('scramble').textContent = currentScramble;
}

// Time list management
function updateTimesList() {
    const session = getCurrentSession();
    if (!session) return;
    
    const timesList = document.getElementById('times-list');
    timesList.innerHTML = '';
    
    // Find best and worst solve IDs
    const validTimes = session.times.filter(t => t.penalty !== -1);
    let bestTimeId = null;
    let worstTimeId = null;
    
    if (validTimes.length > 0) {
        const timesWithTotal = validTimes.map(t => ({
            id: t.id,
            total: t.time + t.penalty
        }));
        
        const bestTime = timesWithTotal.reduce((min, t) => t.total < min.total ? t : min);
        const worstTime = timesWithTotal.reduce((max, t) => t.total > max.total ? t : max);
        
        bestTimeId = bestTime.id;
        worstTimeId = worstTime.id;
    }
    
    // Show times in reverse order (newest first)
    const sortedTimes = [...session.times].reverse();
    
    sortedTimes.forEach((entry, index) => {
        const timeItem = document.createElement('div');
        timeItem.className = 'time-item';
        if (entry.penalty === -1) {
            timeItem.classList.add('dnf');
        }
        
        // Add highlight classes for best/worst
        if (entry.id === bestTimeId) {
            timeItem.classList.add('best-solve');
        }
        if (entry.id === worstTimeId) {
            timeItem.classList.add('worst-solve');
        }
        
        let displayTime;
        if (entry.penalty === -1) {
            displayTime = 'DNF';
        } else {
            const totalTime = entry.time + entry.penalty;
            displayTime = formatTime(totalTime);
            if (entry.penalty > 0) {
                displayTime += ' (+2)';
            }
        }
        
        timeItem.innerHTML = `
            <span class="time-value">${sortedTimes.length - index}. ${displayTime}</span>
            <div class="time-actions">
                <button class="time-action-btn" onclick="addPenalty('${entry.id}', 2000)">+2</button>
                <button class="time-action-btn" onclick="setDNF('${entry.id}')">DNF</button>
                <button class="time-action-btn" onclick="deleteTime('${entry.id}')">Delete</button>
            </div>
        `;
        
        timesList.appendChild(timeItem);
    });
}

function deleteTime(timeId) {
    const session = getCurrentSession();
    if (!session) return;
    
    session.times = session.times.filter(t => t.id !== timeId);
    saveSessions();
    updateTimesList();
    updateStatistics();
}

function addPenalty(timeId, penalty) {
    const session = getCurrentSession();
    if (!session) return;
    
    const timeEntry = session.times.find(t => t.id === timeId);
    if (timeEntry) {
        if (timeEntry.penalty === penalty) {
            timeEntry.penalty = 0; // Toggle off
        } else {
            timeEntry.penalty = penalty; // Set +2 penalty
        }
        saveSessions();
        updateTimesList();
        updateStatistics();
    }
}

function setDNF(timeId) {
    const session = getCurrentSession();
    if (!session) return;
    
    const timeEntry = session.times.find(t => t.id === timeId);
    if (timeEntry) {
        if (timeEntry.penalty === -1) {
            timeEntry.penalty = 0; // Toggle off DNF
        } else {
            timeEntry.penalty = -1; // Set DNF
        }
        saveSessions();
        updateTimesList();
        updateStatistics();
    }
}

// Statistics
function getValidTimes() {
    const session = getCurrentSession();
    if (!session) return [];
    
    return session.times
        .filter(t => t.penalty !== -1)
        .map(t => t.time + t.penalty);
}

function calculateMean(times) {
    if (times.length === 0) return null;
    const sum = times.reduce((a, b) => a + b, 0);
    return sum / times.length;
}

function calculateAverage(times, count) {
    if (times.length < count) return null;
    
    const recent = times.slice(-count);
    const sorted = [...recent].sort((a, b) => a - b);
    sorted.shift(); // Remove best
    sorted.pop(); // Remove worst
    
    return calculateMean(sorted);
}

function calculateBestAverage(times, count) {
    if (times.length < count) return null;
    
    let best = null;
    // Calculate rolling averages
    for (let i = count - 1; i < times.length; i++) {
        const window = times.slice(i - count + 1, i + 1);
        const avg = calculateAverage(window, count);
        if (avg !== null && (best === null || avg < best)) {
            best = avg;
        }
    }
    
    return best;
}

function updateStatistics() {
    const validTimes = getValidTimes();
    
    // Current statistics
    const mo3 = validTimes.length >= 3 
        ? calculateMean(validTimes.slice(-3)) 
        : null;
    const ao5 = calculateAverage(validTimes, 5);
    const ao12 = calculateAverage(validTimes, 12);
    
    // Best statistics
    const bestMo3 = validTimes.length >= 3 
        ? calculateBestAverage(validTimes, 3) 
        : null;
    const bestAo5 = calculateBestAverage(validTimes, 5);
    const bestAo12 = calculateBestAverage(validTimes, 12);
    const sessionMean = calculateMean(validTimes);
    
    // Best and worst solves
    const bestSolve = validTimes.length > 0 ? Math.min(...validTimes) : null;
    const worstSolve = validTimes.length > 0 ? Math.max(...validTimes) : null;
    
    // Update UI
    document.getElementById('mo3').textContent = mo3 !== null ? formatTime(mo3) : '-';
    document.getElementById('ao5').textContent = ao5 !== null ? formatTime(ao5) : '-';
    document.getElementById('ao12').textContent = ao12 !== null ? formatTime(ao12) : '-';
    document.getElementById('best-mo3').textContent = bestMo3 !== null ? formatTime(bestMo3) : '-';
    document.getElementById('best-ao5').textContent = bestAo5 !== null ? formatTime(bestAo5) : '-';
    document.getElementById('best-ao12').textContent = bestAo12 !== null ? formatTime(bestAo12) : '-';
    document.getElementById('session-mean').textContent = sessionMean !== null ? formatTime(sessionMean) : '-';
    
    // Update best/worst solve with highlighting
    const bestSolveEl = document.getElementById('best-solve');
    const worstSolveEl = document.getElementById('worst-solve');
    
    if (bestSolve !== null) {
        bestSolveEl.textContent = formatTime(bestSolve);
        bestSolveEl.classList.add('best-solve-stat');
    } else {
        bestSolveEl.textContent = '-';
        bestSolveEl.classList.remove('best-solve-stat');
    }
    
    if (worstSolve !== null) {
        worstSolveEl.textContent = formatTime(worstSolve);
        worstSolveEl.classList.add('worst-solve-stat');
    } else {
        worstSolveEl.textContent = '-';
        worstSolveEl.classList.remove('worst-solve-stat');
    }
}

// Optimal solution generator using Kociemba Two-Phase Algorithm
function generateOptimalSolution() {
    const solutionEl = document.getElementById('solution');
    solutionEl.innerHTML = `
        <h4>Solving...</h4>
        <p class="solution-text">Computing optimal solution using Kociemba Two-Phase algorithm...</p>
        <p class="solution-text" style="font-size: 12px; opacity: 0.8;">This may take a few seconds...</p>
    `;
    solutionEl.classList.add('show');
    
    // Check if solver is available
    if (typeof solveCube === 'undefined') {
        console.error('solveCube function not found. Make sure cube-solver.js is loaded.');
        solutionEl.innerHTML = `
            <h4>Error</h4>
            <p class="solution-text">Cube solver not loaded. Please refresh the page.</p>
        `;
        return;
    }
    
    // Run solver asynchronously to avoid blocking UI
    // Use requestAnimationFrame and setTimeout to allow UI updates
    let startTime = Date.now();
    const maxTime = 5000; // 5 second timeout (reduced for faster response)
    
    const solveWithProgress = () => {
        try {
            const elapsed = Date.now() - startTime;
            if (elapsed > maxTime) {
                throw new Error('Solver timeout');
            }
            
            // Try to solve
            const solution = solveCube(currentScramble);
            
            if (solution && solution.length > 0) {
                // Verify solution works by applying it
                const scrambledState = applyScramble(currentScramble);
                const solvedState = applyMoves(scrambledState, solution);
                const isValid = isSolved(solvedState);
                
                if (isValid) {
                    const solutionStr = solution.join(' ');
                    solutionEl.innerHTML = `
                        <h4>Optimal Solution (Kociemba Two-Phase)</h4>
                        <p class="solution-text">
                            <strong>Scramble:</strong> ${currentScramble}
                        </p>
                        <p class="solution-text">
                            <strong>Solution (${solution.length} moves):</strong> ${solutionStr}
                        </p>
                    `;
                } else {
                    throw new Error('Solution verification failed');
                }
            } else {
                throw new Error('No solution found');
            }
        } catch (error) {
            console.error('Solver error:', error);
            
            // Try fallback solver (BFS/IDA* with 30-move limit)
            try {
                console.log('Attempting fallback solver...');
                solutionEl.innerHTML = `
                    <h4>Solving (Fallback Method)...</h4>
                    <p class="solution-text">Kociemba solver failed. Trying alternative method...</p>
                `;
                
                // Use setTimeout to allow UI update
                setTimeout(() => {
                    const fallbackSolution = solveCubeFallback(currentScramble);
                    
                    if (fallbackSolution && fallbackSolution.length > 0 && fallbackSolution.length <= 30) {
                        // Verify fallback solution
                        const scrambledState = applyScramble(currentScramble);
                        const solvedState = applyMoves(scrambledState, fallbackSolution);
                        const isValid = isSolved(solvedState);
                        
                        if (isValid) {
                            const fallbackStr = fallbackSolution.join(' ');
                            solutionEl.innerHTML = `
                                <h4>Solution (Fallback Method)</h4>
                                <p class="solution-text">
                                    <strong>Scramble:</strong> ${currentScramble}
                                </p>
                                <p class="solution-text">
                                    <strong>Solution (${fallbackSolution.length} moves):</strong> ${fallbackStr}
                                </p>
                                <p class="solution-text" style="font-size: 12px; opacity: 0.8; margin-top: 10px;">
                                    Note: Kociemba solver failed. Using alternative solver method.
                                </p>
                            `;
                        } else {
                            throw new Error('Fallback solution verification failed');
                        }
                    } else {
                        throw new Error('Fallback solver could not find solution under 30 moves');
                    }
                }, 100);
            } catch (fallbackError) {
                console.error('Fallback solver error:', fallbackError);
                solutionEl.innerHTML = `
                    <h4>Error</h4>
                    <p class="solution-text">
                        <strong>Scramble:</strong> ${currentScramble}
                    </p>
                    <p class="solution-text">
                        Unable to generate solution. Both Kociemba and fallback solvers failed.
                    </p>
                    <p class="solution-text" style="font-size: 12px; opacity: 0.8; margin-top: 10px;">
                        Error: ${error.message || 'Unknown error'}
                    </p>
                `;
            }
        }
    };
    
    // Use setTimeout to allow UI to update, then solve
    setTimeout(solveWithProgress, 50);
}

// Sidebar toggle functionality
function initSidebars() {
    const leftSidebar = document.getElementById('left-sidebar');
    const rightSidebar = document.getElementById('right-sidebar');
    const leftToggle = document.getElementById('left-toggle');
    const rightToggle = document.getElementById('right-toggle');
    
    leftToggle.addEventListener('click', () => {
        leftSidebar.classList.toggle('collapsed');
        leftToggle.textContent = leftSidebar.classList.contains('collapsed') ? '☰' : '✕';
        leftToggle.title = leftSidebar.classList.contains('collapsed') ? 'Show Times' : 'Hide Times';
    });
    
    rightToggle.addEventListener('click', () => {
        rightSidebar.classList.toggle('collapsed');
        rightToggle.textContent = rightSidebar.classList.contains('collapsed') ? '☰' : '✕';
        rightToggle.title = rightSidebar.classList.contains('collapsed') ? 'Show Statistics' : 'Hide Statistics';
    });
    
    // Set initial tooltips
    leftToggle.title = 'Hide Times';
    rightToggle.title = 'Hide Statistics';
}

// Event listeners
document.getElementById('session-select').addEventListener('change', (e) => {
    currentSessionId = e.target.value;
    loadCurrentSession();
});

document.getElementById('new-session-btn').addEventListener('click', createNewSession);
document.getElementById('rename-session-btn').addEventListener('click', renameCurrentSession);
document.getElementById('delete-session-btn').addEventListener('click', deleteCurrentSession);
document.getElementById('solve-btn').addEventListener('click', generateOptimalSolution);

// Initialize
initSessions();
initSidebars();
generateNewScramble();
