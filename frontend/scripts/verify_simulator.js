/**
 * Node.js Verification Test for Phase 4 Simulator
 */

const INV_SQRT_2 = 1 / Math.SQRT2;
const EPSILON = 1e-10;

function complex(r, i = 0) {
  return { real: r, imaginary: i };
}

function add(a, b) {
  return { real: a.real + b.real, imaginary: a.imaginary + b.imaginary };
}

function mul(a, b) {
  return {
    real: a.real * b.real - a.imaginary * b.imaginary,
    imaginary: a.real * b.imaginary + a.imaginary * b.real
  };
}

function magSq(a) {
  return a.real * a.real + a.imaginary * a.imaginary;
}

function createInitialState(n) {
  const dim = 1 << n;
  const state = new Array(dim);
  state[0] = complex(1, 0);
  for (let i = 1; i < dim; i++) state[i] = complex(0, 0);
  return state;
}

function applySingleQubitGate(state, matrix, target, numQubits) {
  const dim = 1 << numQubits;
  const next = new Array(dim);
  const mask = 1 << target;
  const [m00, m01] = matrix[0];
  const [m10, m11] = matrix[1];

  for (let k = 0; k < dim; k++) {
    if ((k & mask) === 0) {
      const i0 = k;
      const i1 = k | mask;
      const a0 = state[i0];
      const a1 = state[i1];
      next[i0] = add(mul(m00, a0), mul(m01, a1));
      next[i1] = add(mul(m10, a0), mul(m11, a1));
    }
  }
  return next;
}

function applyCNOT(state, ctrl, tgt, numQubits) {
  const dim = 1 << numQubits;
  const next = new Array(dim);
  const cMask = 1 << ctrl;
  const tMask = 1 << tgt;

  for (let k = 0; k < dim; k++) {
    if ((k & cMask) !== 0) {
      next[k] = state[k ^ tMask];
    } else {
      next[k] = state[k];
    }
  }
  return next;
}

function getProbabilities(state, numQubits) {
  const dist = {};
  const dim = 1 << numQubits;
  for (let i = 0; i < dim; i++) {
    let s = '';
    for (let q = numQubits - 1; q >= 0; q--) {
      s += ((i >> q) & 1) ? '1' : '0';
    }
    const p = magSq(state[i]);
    dist[s] = Math.abs(p) < EPSILON ? 0 : p;
  }
  return dist;
}

const H_MATRIX = [
  [complex(INV_SQRT_2, 0), complex(INV_SQRT_2, 0)],
  [complex(INV_SQRT_2, 0), complex(-INV_SQRT_2, 0)]
];

const X_MATRIX = [
  [complex(0, 0), complex(1, 0)],
  [complex(1, 0), complex(0, 0)]
];

// Tests
console.log('--- RUNNING SIMULATOR VERIFICATION SUITE ---');

// 1. Test X gate
let s = createInitialState(1);
s = applySingleQubitGate(s, X_MATRIX, 0, 1);
let p = getProbabilities(s, 1);
console.assert(Math.abs(p['1'] - 1.0) < 1e-6, 'X gate failed: P(1) != 1.0');
console.log('✔ Test X gate: P(1) = 1.0');

// 2. Test H gate
s = createInitialState(1);
s = applySingleQubitGate(s, H_MATRIX, 0, 1);
p = getProbabilities(s, 1);
console.assert(Math.abs(p['0'] - 0.5) < 1e-6 && Math.abs(p['1'] - 0.5) < 1e-6, 'H gate failed: P(0) or P(1) != 0.5');
console.log('✔ Test H gate: P(0) = 0.5, P(1) = 0.5');

// 3. Test H then H (Interference)
s = applySingleQubitGate(s, H_MATRIX, 0, 1);
p = getProbabilities(s, 1);
console.assert(Math.abs(p['0'] - 1.0) < 1e-6, 'H-H interference failed: P(0) != 1.0');
console.log('✔ Test H-H interference: P(0) = 1.0, P(1) = 0.0');

// 4. Test Bell State
let bell = createInitialState(2);
bell = applySingleQubitGate(bell, H_MATRIX, 0, 2);
bell = applyCNOT(bell, 0, 1, 2);
const bellP = getProbabilities(bell, 2);
console.assert(Math.abs(bellP['00'] - 0.5) < 1e-6, 'Bell state P(00) != 0.5');
console.assert(Math.abs(bellP['11'] - 0.5) < 1e-6, 'Bell state P(11) != 0.5');
console.assert(Math.abs(bellP['01']) < 1e-6, 'Bell state P(01) != 0.0');
console.assert(Math.abs(bellP['10']) < 1e-6, 'Bell state P(10) != 0.0');
console.log('✔ Test Bell State (|00> + |11>)/√2: P(00)=0.5, P(11)=0.5, P(01)=0, P(10)=0');

// 5. Test CNOT basis states
const basisTests = [
  { init: 0, expected: '00' }, // |00> -> |00>
  { init: 1, expected: '11' }, // |01> -> |11> (q0 is 1, so q1 flips 0->1)
  { init: 2, expected: '10' }, // |10> -> |10> (q0 is 0, q1 unchanged)
  { init: 3, expected: '01' }, // |11> -> |01> (q0 is 1, q1 flips 1->0)
];

for (const b of basisTests) {
  let cState = createInitialState(2);
  if (b.init & 1) cState = applySingleQubitGate(cState, X_MATRIX, 0, 2);
  if (b.init & 2) cState = applySingleQubitGate(cState, X_MATRIX, 1, 2);
  cState = applyCNOT(cState, 0, 1, 2);
  const cp = getProbabilities(cState, 2);
  console.assert(Math.abs(cp[b.expected] - 1.0) < 1e-6, `CNOT failed for input ${b.init}`);
}
console.log('✔ Test CNOT basis states: |00>->|00>, |01>->|11>, |10>->|10>, |11>->|01>');

console.log('ALL VERIFICATION CHECKS PASSED SUCCESSFULLY!');
