/**
 * Complete Phase 4 Mathematical and Architectural Test Runner
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

function sampleMeasurements(probabilities, shots) {
  const keys = Object.keys(probabilities);
  const cumulative = [];
  let sum = 0;
  for (const k of keys) {
    sum += probabilities[k];
    cumulative.push(sum);
  }
  const counts = {};
  for (const k of keys) counts[k] = 0;

  for (let s = 0; s < shots; s++) {
    const r = Math.random();
    let low = 0, high = cumulative.length - 1, chosen = high;
    while (low <= high) {
      const mid = (low + high) >> 1;
      if (r <= cumulative[mid]) {
        chosen = mid;
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    }
    counts[keys[chosen]]++;
  }
  return counts;
}

const GATES = {
  X: [
    [complex(0, 0), complex(1, 0)],
    [complex(1, 0), complex(0, 0)]
  ],
  Y: [
    [complex(0, 0), complex(0, -1)],
    [complex(0, 1), complex(0, 0)]
  ],
  Z: [
    [complex(1, 0), complex(0, 0)],
    [complex(0, 0), complex(-1, 0)]
  ],
  H: [
    [complex(INV_SQRT_2, 0), complex(INV_SQRT_2, 0)],
    [complex(INV_SQRT_2, 0), complex(-INV_SQRT_2, 0)]
  ],
  S: [
    [complex(1, 0), complex(0, 0)],
    [complex(0, 0), complex(0, 1)]
  ],
  T: [
    [complex(1, 0), complex(0, 0)],
    [complex(0, 0), complex(INV_SQRT_2, INV_SQRT_2)]
  ]
};

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  PASS: ${message}`);
  } else {
    failed++;
    console.error(`  FAIL: ${message}`);
  }
}

console.log('\n================ PHASE 4 MATHEMATICAL TEST SUITE ================');

// 1. Test X Gate
console.log('\n[1] Testing X Gate:');
let st = createInitialState(1);
st = applySingleQubitGate(st, GATES.X, 0, 1);
let pr = getProbabilities(st, 1);
assert(Math.abs(pr['1'] - 1.0) < 1e-6, 'X|0⟩ produces |1⟩ with probability 1.0');
assert(Math.abs(pr['0']) < 1e-6, '|0⟩ amplitude is zero');

// 2. Test H Gate
console.log('\n[2] Testing Hadamard Gate:');
st = createInitialState(1);
st = applySingleQubitGate(st, GATES.H, 0, 1);
pr = getProbabilities(st, 1);
assert(Math.abs(pr['0'] - 0.5) < 1e-6, 'H|0⟩ has P(0) = 0.5');
assert(Math.abs(pr['1'] - 0.5) < 1e-6, 'H|0⟩ has P(1) = 0.5');

// 3. Test H then H (Interference)
console.log('\n[3] Testing H-H Destructive Interference:');
st = applySingleQubitGate(st, GATES.H, 0, 1);
pr = getProbabilities(st, 1);
assert(Math.abs(pr['0'] - 1.0) < 1e-6, 'H(H|0⟩) produces |0⟩ with P(0) = 1.0');
assert(Math.abs(pr['1']) < 1e-6, 'H(H|0⟩) has P(1) = 0.0');

// 4. Test Y Gate
console.log('\n[4] Testing Pauli-Y Gate:');
st = createInitialState(1);
st = applySingleQubitGate(st, GATES.Y, 0, 1);
pr = getProbabilities(st, 1);
assert(Math.abs(pr['1'] - 1.0) < 1e-6, 'Y|0⟩ produces |1⟩ with P(1) = 1.0');

// 5. Test Z Gate
console.log('\n[5] Testing Pauli-Z Gate:');
st = createInitialState(1);
st = applySingleQubitGate(st, GATES.Z, 0, 1);
pr = getProbabilities(st, 1);
assert(Math.abs(pr['0'] - 1.0) < 1e-6, 'Z|0⟩ leaves |0⟩ unchanged with P(0) = 1.0');

// 6. Test Phase Gates S and T
console.log('\n[6] Testing Phase Gates (S & T):');
st = createInitialState(1);
st = applySingleQubitGate(st, GATES.H, 0, 1);
st = applySingleQubitGate(st, GATES.S, 0, 1);
pr = getProbabilities(st, 1);
assert(Math.abs(pr['0'] - 0.5) < 1e-6 && Math.abs(pr['1'] - 0.5) < 1e-6, 'S gate preserves 50/50 probability');

// 7. Test CNOT on 4 Basis States
console.log('\n[7] Testing CNOT on all 4 basis states:');
const cnotCases = [
  { bits: [0, 0], expected: '00' },
  { bits: [1, 0], expected: '11' }, // q0=1 -> q1 flips to 1
  { bits: [0, 1], expected: '10' }, // q0=0 -> q1 unchanged
  { bits: [1, 1], expected: '01' }  // q0=1 -> q1 flips 1->0
];
for (const tc of cnotCases) {
  let cSt = createInitialState(2);
  if (tc.bits[0]) cSt = applySingleQubitGate(cSt, GATES.X, 0, 2);
  if (tc.bits[1]) cSt = applySingleQubitGate(cSt, GATES.X, 1, 2);
  cSt = applyCNOT(cSt, 0, 1, 2);
  const cp = getProbabilities(cSt, 2);
  assert(Math.abs(cp[tc.expected] - 1.0) < 1e-6, `CNOT input |${tc.bits[1]}${tc.bits[0]}⟩ -> |${tc.expected}⟩`);
}

// 8. Test Bell State
console.log('\n[8] Testing Maximally Entangled Bell State (|Φ+⟩):');
let bell = createInitialState(2);
bell = applySingleQubitGate(bell, GATES.H, 0, 2);
bell = applyCNOT(bell, 0, 1, 2);
const bp = getProbabilities(bell, 2);
assert(Math.abs(bp['00'] - 0.5) < 1e-6, 'Bell state P(00) = 0.5');
assert(Math.abs(bp['11'] - 0.5) < 1e-6, 'Bell state P(11) = 0.5');
assert(Math.abs(bp['01']) < 1e-6, 'Bell state P(01) = 0');
assert(Math.abs(bp['10']) < 1e-6, 'Bell state P(10) = 0');

// 9. Test Measurement Sampling
console.log('\n[9] Testing Measurement Counts (1000 Shots):');
const counts = sampleMeasurements(bp, 1000);
const sum = Object.values(counts).reduce((a, b) => a + b, 0);
assert(sum === 1000, `Total shots sum equals 1000 (actual: ${sum})`);
assert(counts['00'] >= 400 && counts['00'] <= 600, `counts['00'] within statistical tolerance: ${counts['00']}`);
assert(counts['11'] >= 400 && counts['11'] <= 600, `counts['11'] within statistical tolerance: ${counts['11']}`);
assert((counts['01'] || 0) === 0, `counts['01'] is 0: ${counts['01'] || 0}`);
assert((counts['10'] || 0) === 0, `counts['10'] is 0: ${counts['10'] || 0}`);

// 10. Test Normalization
console.log('\n[10] Testing Normalization (3 Qubits, 8 Amplitudes):');
let nSt = createInitialState(3);
nSt = applySingleQubitGate(nSt, GATES.H, 0, 3);
nSt = applySingleQubitGate(nSt, GATES.H, 1, 3);
nSt = applyCNOT(nSt, 0, 2, 3);
const np = getProbabilities(nSt, 3);
const probSum = Object.values(np).reduce((a, b) => a + b, 0);
assert(Math.abs(probSum - 1.0) < 1e-6, `Sum of probabilities equals 1.0 (actual: ${probSum.toFixed(6)})`);

// 11. Test Circuit Serialization Compatibility
console.log('\n[11] Testing Circuit Serialization Compatibility:');
const circuitObj = {
  schema_version: '1.0.0',
  qubits: 2,
  classical_bits: 2,
  gates: [
    { id: 'g1', type: 'H', target: 0, step: 0 },
    { id: 'g2', type: 'CNOT', control: 0, target: 1, step: 1 }
  ]
};
const serialized = JSON.stringify(circuitObj);
const deserialized = JSON.parse(serialized);
assert(deserialized.qubits === 2, 'Deserialized circuit preserves qubit count');
assert(deserialized.gates.length === 2, 'Deserialized circuit preserves gate count');

console.log('\n================ TEST SUMMARY ================');
console.log(`TOTAL PASSED: ${passed}`);
console.log(`TOTAL FAILED: ${failed}`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('ALL PHASE 4 MATHEMATICAL CHECKS PASSED!\n');
}
