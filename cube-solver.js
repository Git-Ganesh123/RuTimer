// Rubik's Cube Solver - Kociemba Two-Phase Algorithm
// Simplified implementation

// Cube state representation
class CubeState {
    constructor() {
        // Permutations: indices represent positions, values represent pieces
        this.cornerPerm = [0, 1, 2, 3, 4, 5, 6, 7]; // 8 corners
        this.edgePerm = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]; // 12 edges
        // Orientations: 0 = correct, 1/2 = twisted
        this.cornerOri = [0, 0, 0, 0, 0, 0, 0, 0];
        this.edgeOri = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    }

    copy() {
        const newState = new CubeState();
        newState.cornerPerm = [...this.cornerPerm];
        newState.edgePerm = [...this.edgePerm];
        newState.cornerOri = [...this.cornerOri];
        newState.edgeOri = [...this.edgeOri];
        return newState;
    }

    equals(other) {
        return JSON.stringify(this.cornerPerm) === JSON.stringify(other.cornerPerm) &&
               JSON.stringify(this.edgePerm) === JSON.stringify(other.edgePerm) &&
               JSON.stringify(this.cornerOri) === JSON.stringify(other.cornerOri) &&
               JSON.stringify(this.edgeOri) === JSON.stringify(other.edgeOri);
    }
}

// Move definitions
const MOVES = {
    'U': { corners: [[0, 1, 2, 3], [1, 2, 3, 0]], edges: [[0, 1, 2, 3], [1, 2, 3, 0]] },
    "U'": { corners: [[0, 1, 2, 3], [3, 0, 1, 2]], edges: [[0, 1, 2, 3], [3, 0, 1, 2]] },
    'U2': { corners: [[0, 1, 2, 3], [2, 3, 0, 1]], edges: [[0, 1, 2, 3], [2, 3, 0, 1]] },
    'D': { corners: [[4, 5, 6, 7], [3, 0, 1, 2]], edges: [[4, 5, 6, 7], [3, 0, 1, 2]] },
    "D'": { corners: [[4, 5, 6, 7], [1, 2, 3, 0]], edges: [[4, 5, 6, 7], [1, 2, 3, 0]] },
    'D2': { corners: [[4, 5, 6, 7], [2, 3, 0, 1]], edges: [[4, 5, 6, 7], [2, 3, 0, 1]] },
    'L': { corners: [[0, 3, 7, 4], [3, 7, 4, 0]], edges: [[3, 7, 11, 4], [7, 11, 4, 3]], cornerOri: [1, 2, 1, 2] },
    "L'": { corners: [[0, 3, 7, 4], [4, 0, 3, 7]], edges: [[3, 7, 11, 4], [4, 3, 7, 11]], cornerOri: [2, 1, 2, 1] },
    'L2': { corners: [[0, 3, 7, 4], [7, 4, 0, 3]], edges: [[3, 7, 11, 4], [11, 4, 3, 7]] },
    'R': { corners: [[1, 2, 6, 5], [2, 6, 5, 1]], edges: [[1, 5, 9, 6], [5, 9, 6, 1]], cornerOri: [2, 1, 2, 1] },
    "R'": { corners: [[1, 2, 6, 5], [5, 1, 2, 6]], edges: [[1, 5, 9, 6], [6, 1, 5, 9]], cornerOri: [1, 2, 1, 2] },
    'R2': { corners: [[1, 2, 6, 5], [6, 5, 1, 2]], edges: [[1, 5, 9, 6], [9, 6, 1, 5]] },
    'F': { corners: [[0, 1, 5, 4], [1, 5, 4, 0]], edges: [[0, 4, 8, 5], [4, 8, 5, 0]], cornerOri: [1, 2, 1, 2], edgeOri: [1, 1, 1, 1] },
    "F'": { corners: [[0, 1, 5, 4], [4, 0, 1, 5]], edges: [[0, 4, 8, 5], [5, 0, 4, 8]], cornerOri: [2, 1, 2, 1], edgeOri: [1, 1, 1, 1] },
    'F2': { corners: [[0, 1, 5, 4], [5, 4, 0, 1]], edges: [[0, 4, 8, 5], [8, 5, 0, 4]] },
    'B': { corners: [[2, 3, 7, 6], [3, 7, 6, 2]], edges: [[2, 6, 10, 7], [6, 10, 7, 2]], cornerOri: [2, 1, 2, 1], edgeOri: [1, 1, 1, 1] },
    "B'": { corners: [[2, 3, 7, 6], [6, 2, 3, 7]], edges: [[2, 6, 10, 7], [7, 2, 6, 10]], cornerOri: [1, 2, 1, 2], edgeOri: [1, 1, 1, 1] },
    'B2': { corners: [[2, 3, 7, 6], [7, 6, 2, 3]], edges: [[2, 6, 10, 7], [10, 7, 2, 6]] }
};

// Simplified move application
function applyMove(state, move) {
    const newState = state.copy();
    const moveDef = MOVES[move];
    if (!moveDef) return state;

    // Apply corner permutation
    if (moveDef.corners) {
        const [indices, mapping] = moveDef.corners;
        const temp = indices.map(i => newState.cornerPerm[i]);
        indices.forEach((i, idx) => {
            newState.cornerPerm[i] = temp[mapping[idx]];
        });
    }

    // Apply edge permutation
    if (moveDef.edges) {
        const [indices, mapping] = moveDef.edges;
        const temp = indices.map(i => newState.edgePerm[i]);
        indices.forEach((i, idx) => {
            newState.edgePerm[i] = temp[mapping[idx]];
        });
    }

    // Apply corner orientation
    if (moveDef.cornerOri) {
        const [indices] = moveDef.corners;
        const oriChanges = moveDef.cornerOri;
        indices.forEach((i, idx) => {
            newState.cornerOri[i] = (newState.cornerOri[i] + oriChanges[idx]) % 3;
        });
    }

    // Apply edge orientation
    if (moveDef.edgeOri) {
        const [indices] = moveDef.edges;
        indices.forEach(i => {
            newState.edgeOri[i] = (newState.edgeOri[i] + 1) % 2;
        });
    }

    return newState;
}

// Apply sequence of moves
function applyMoves(state, moves) {
    let currentState = state.copy();
    for (const move of moves) {
        currentState = applyMove(currentState, move);
    }
    return currentState;
}

// Parse scramble string
function parseScramble(scramble) {
    return scramble.trim().split(/\s+/).filter(m => m);
}

// Apply scramble to solved cube
function applyScramble(scramble) {
    const moves = parseScramble(scramble);
    let state = new CubeState();
    for (const move of moves) {
        state = applyMove(state, move);
    }
    return state;
}

// Check if solved
function isSolved(state) {
    const solved = new CubeState();
    return state.equals(solved);
}

// Phase 1 goal: corners and edges oriented, slice edges in middle
function isPhase1Goal(state) {
    // All corner orientations must be 0
    if (state.cornerOri.some(o => o !== 0)) return false;
    
    // All edge orientations must be 0
    if (state.edgeOri.some(o => o !== 0)) return false;
    
    // Slice edges (4, 5, 6, 7) must be in middle layer positions (4, 5, 6, 7)
    const sliceEdges = [4, 5, 6, 7];
    const middlePositions = [4, 5, 6, 7];
    for (const edge of sliceEdges) {
        if (!middlePositions.includes(state.edgePerm.indexOf(edge))) {
            return false;
        }
    }
    
    return true;
}

// Heuristics
function phase1Heuristic(state) {
    // Simplified: count misoriented corners and edges
    let cornerDist = state.cornerOri.filter(o => o !== 0).length;
    let edgeDist = state.edgeOri.filter(o => o !== 0).length;
    
    // Slice edge distance (simplified)
    const sliceEdges = [4, 5, 6, 7];
    const middlePositions = [4, 5, 6, 7];
    let sliceDist = 0;
    for (const edge of sliceEdges) {
        const pos = state.edgePerm.indexOf(edge);
        if (!middlePositions.includes(pos)) {
            sliceDist++;
        }
    }
    
    return Math.max(Math.ceil(cornerDist / 2), Math.ceil(edgeDist / 2), Math.ceil(sliceDist / 2));
}

function phase2Heuristic(state) {
    // Simplified: count misplaced corners and edges
    let cornerDist = 0;
    for (let i = 0; i < 8; i++) {
        if (state.cornerPerm[i] !== i) cornerDist++;
    }
    
    let edgeDist = 0;
    for (let i = 0; i < 12; i++) {
        if (state.edgePerm[i] !== i) edgeDist++;
    }
    
    return Math.max(Math.ceil(cornerDist / 4), Math.ceil(edgeDist / 4));
}

// Check if moves are inverses
function isInverse(move1, move2) {
    if (!move2) return false;
    const inverses = {
        'U': "U'", "U'": 'U', 'U2': 'U2',
        'D': "D'", "D'": 'D', 'D2': 'D2',
        'L': "L'", "L'": 'L', 'L2': 'L2',
        'R': "R'", "R'": 'R', 'R2': 'R2',
        'F': "F'", "F'": 'F', 'F2': 'F2',
        'B': "B'", "B'": 'B', 'B2': 'B2'
    };
    return inverses[move1] === move2 || move1 === move2;
}

// Phase 1 moves (all moves)
const PHASE1_MOVES = ['U', "U'", 'U2', 'D', "D'", 'D2', 'L', "L'", 'L2', 'R', "R'", 'R2', 'F', "F'", 'F2', 'B', "B'", 'B2'];

// Phase 2 moves (restricted)
const PHASE2_MOVES = ['U', "U'", 'U2', 'D', "D'", 'D2', 'L2', 'R2', 'F2', 'B2'];

const FOUND = -1;
const INFINITY = 10000;
const MAX_DEPTH_PHASE1 = 10; // Reduced for faster solving
const MAX_DEPTH_PHASE2 = 15; // Reduced for faster solving

// IDA* Phase 1 - Optimized for speed
function idaStarPhase1(startState) {
    let bound = Math.max(phase1Heuristic(startState), 1);
    const solutionPath = [];
    let iterations = 0;
    const maxIterations = 50; // Reduced iterations for speed
    
    while (iterations < maxIterations && bound < MAX_DEPTH_PHASE1) {
        iterations++;
        solutionPath.length = 0;
        const result = dfsPhase1(startState, 0, bound, solutionPath, null, MAX_DEPTH_PHASE1);
        if (result === FOUND) {
            return [...solutionPath];
        }
        if (result >= INFINITY) {
            return null;
        }
        bound = result;
        // Early exit if bound increases too much
        if (bound > MAX_DEPTH_PHASE1) break;
    }
    return null;
}

function dfsPhase1(state, depth, bound, path, lastMove, depthLimit) {
    if (depth > depthLimit) {
        return INFINITY;
    }
    
    const f = depth + phase1Heuristic(state);
    if (f > bound) {
        return f;
    }
    
    if (isPhase1Goal(state)) {
        return FOUND;
    }
    
    let minNextBound = INFINITY;
    
    for (const move of PHASE1_MOVES) {
        if (isInverse(move, lastMove)) {
            continue;
        }
        
        const nextState = applyMove(state, move);
        path.push(move);
        
        const result = dfsPhase1(nextState, depth + 1, bound, path, move, depthLimit);
        
        if (result === FOUND) {
            return FOUND;
        }
        
        minNextBound = Math.min(minNextBound, result);
        path.pop();
    }
    
    return minNextBound;
}

// IDA* Phase 2 - Optimized for speed
function idaStarPhase2(startState) {
    let bound = Math.max(phase2Heuristic(startState), 1);
    const solutionPath = [];
    let iterations = 0;
    const maxIterations = 50; // Reduced iterations for speed
    
    while (iterations < maxIterations && bound < MAX_DEPTH_PHASE2) {
        iterations++;
        solutionPath.length = 0;
        const result = dfsPhase2(startState, 0, bound, solutionPath, null, MAX_DEPTH_PHASE2);
        if (result === FOUND) {
            return [...solutionPath];
        }
        if (result >= INFINITY) {
            return null;
        }
        bound = result;
        // Early exit if bound increases too much
        if (bound > MAX_DEPTH_PHASE2) break;
    }
    return null;
}

function dfsPhase2(state, depth, bound, path, lastMove, depthLimit) {
    if (depth > depthLimit) {
        return INFINITY;
    }
    
    const f = depth + phase2Heuristic(state);
    if (f > bound) {
        return f;
    }
    
    if (isSolved(state)) {
        return FOUND;
    }
    
    let minNextBound = INFINITY;
    
    for (const move of PHASE2_MOVES) {
        if (isInverse(move, lastMove)) {
            continue;
        }
        
        const nextState = applyMove(state, move);
        path.push(move);
        
        const result = dfsPhase2(nextState, depth + 1, bound, path, move, depthLimit);
        
        if (result === FOUND) {
            return FOUND;
        }
        
        minNextBound = Math.min(minNextBound, result);
        path.pop();
    }
    
    return minNextBound;
}

// Main solve function
function solveCube(scramble) {
    try {
        console.log('Starting solve for scramble:', scramble);
        
        // Apply scramble to get scrambled state
        const scrambledState = applyScramble(scramble);
        console.log('Scrambled state created');
        
        // Phase 1: Get to phase 1 goal
        console.log('Starting Phase 1...');
        const phase1Solution = idaStarPhase1(scrambledState);
        if (!phase1Solution || phase1Solution.length === 0) {
            console.log('Phase 1 failed - no solution found');
            return null;
        }
        console.log('Phase 1 complete:', phase1Solution.length, 'moves');
        
        // Apply phase 1 solution
        const phase1State = applyMoves(scrambledState, phase1Solution);
        console.log('Phase 1 state reached');
        
        // Phase 2: Solve completely
        console.log('Starting Phase 2...');
        const phase2Solution = idaStarPhase2(phase1State);
        if (!phase2Solution || phase2Solution.length === 0) {
            console.log('Phase 2 failed - no solution found');
            return null;
        }
        console.log('Phase 2 complete:', phase2Solution.length, 'moves');
        
        // Combine solutions
        const fullSolution = [...phase1Solution, ...phase2Solution];
        console.log('Full solution found:', fullSolution.length, 'total moves');
        
        return fullSolution;
    } catch (error) {
        console.error('Solve error:', error);
        return null;
    }
}

// Fallback solver using IDA* with 30-move limit
// This finds a completely different solution (not reverse scramble)
function solveCubeFallback(scramble) {
    try {
        console.log('Starting fallback solver for scramble:', scramble);
        const scrambledState = applyScramble(scramble);
        
        // Calculate reverse scramble to avoid it
        const scrambleMoves = parseScramble(scramble);
        const reverseScramble = scrambleMoves.reverse().map(move => {
            if (move.includes("'")) {
                return move.replace("'", '');
            } else if (move.includes('2')) {
                return move;
            } else {
                return move + "'";
            }
        });
        
        // Use IDA* with 30-move limit
        let bound = Math.max(phase2Heuristic(scrambledState), 1);
        const solutionPath = [];
        let iterations = 0;
        const maxIterations = 300;
        const MAX_MOVES = 30;
        
        while (iterations < maxIterations && bound < MAX_MOVES) {
            iterations++;
            solutionPath.length = 0;
            const result = dfsFallback(scrambledState, 0, bound, solutionPath, null, MAX_MOVES, reverseScramble);
            if (result === FOUND) {
                // Check if solution is different from reverse scramble
                const solutionStr = solutionPath.join(' ');
                const reverseStr = reverseScramble.join(' ');
                if (solutionStr !== reverseStr && solutionPath.length <= MAX_MOVES) {
                    console.log('Fallback solution found:', solutionPath.length, 'moves');
                    return [...solutionPath];
                }
                // If it's the same as reverse, continue searching
                bound = result + 1;
                continue;
            }
            if (result >= INFINITY) {
                break;
            }
            bound = result;
        }
        
        console.log('Fallback solver failed');
        return null;
    } catch (error) {
        console.error('Fallback solver error:', error);
        return null;
    }
}

function dfsFallback(state, depth, bound, path, lastMove, maxDepth, avoidSequence) {
    if (depth > maxDepth) {
        return INFINITY;
    }
    
    const f = depth + phase2Heuristic(state);
    if (f > bound) {
        return f;
    }
    
    if (isSolved(state)) {
        return FOUND;
    }
    
    let minNextBound = INFINITY;
    
    // Use all moves for fallback solver
    // Shuffle move order to find different solutions
    const moves = [...PHASE1_MOVES];
    for (let i = moves.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [moves[i], moves[j]] = [moves[j], moves[i]];
    }
    
    for (const move of moves) {
        if (isInverse(move, lastMove)) {
            continue;
        }
        
        const nextState = applyMove(state, move);
        path.push(move);
        
        // Check if we're building the reverse scramble (avoid it)
        if (path.length <= avoidSequence.length) {
            const pathStr = path.join(' ');
            const avoidPrefix = avoidSequence.slice(0, path.length).join(' ');
            if (pathStr === avoidPrefix) {
                path.pop();
                continue;
            }
        }
        
        const result = dfsFallback(nextState, depth + 1, bound, path, move, maxDepth, avoidSequence);
        
        if (result === FOUND) {
            return FOUND;
        }
        
        minNextBound = Math.min(minNextBound, result);
        path.pop();
    }
    
    return minNextBound;
}

// Make functions globally accessible
window.solveCube = solveCube;
window.solveCubeFallback = solveCubeFallback;
window.applyScramble = applyScramble;
window.applyMoves = applyMoves;
window.isSolved = isSolved;
window.CubeState = CubeState;

// Export for use in main script (Node.js)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { solveCube, applyScramble, isSolved, CubeState };
}
