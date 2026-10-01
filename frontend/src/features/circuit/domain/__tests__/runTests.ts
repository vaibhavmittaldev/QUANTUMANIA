/**
 * QUANTUMANIA - Comprehensive Code Parser, Generator & Sync Automated Verification
 */

import { generateQuantumCode } from '../codeGenerator';
import { parseQuantumCode } from '../codeParser';
import { moveGate } from '../circuitDomain';
import { CIRCUIT_TEMPLATES } from '../circuitTemplates';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${msg}`);
  }
}

console.log('--- RUNNING QUANTUM LAB CODE SYNC SUITE ---');

// Test 1: Bell State Round-Trip
{
  const bellTemplate = CIRCUIT_TEMPLATES.find((t) => t.id === 'bell-state')!;
  assert(!!bellTemplate, 'Bell state template must exist');

  const generated = generateQuantumCode(bellTemplate.circuit);
  assert(generated.code.includes('qc.h(0)'), 'Must include qc.h(0)');
  assert(generated.code.includes('qc.cx(0, 1)'), 'Must include qc.cx(0, 1)');

  const parsed = parseQuantumCode(generated.code);
  assert(parsed.success, 'Parser must succeed on generated code');
  assert(parsed.circuit!.qubits === 2, 'Parsed circuit must have 2 qubits');
  assert(parsed.circuit!.gates.length === 4, 'Parsed circuit must have 4 gates (H, CX, 2x MEASURE)');
  assert(parsed.circuit!.gates[0].type === 'H', 'First gate must be H');
  assert(parsed.circuit!.gates[1].type === 'CNOT', 'Second gate must be CNOT');
  console.log('✓ Test 1: Bell State Round-Trip Passed!');
}

// Test 2: Code -> Parse -> Generate Round-Trip
{
  const source = `# User code
qc = QuantumCircuit(3)

qc.h(0)
qc.x(1)
qc.cx(0, 2)
qc.measure(0, 0)
`;

  const parsed = parseQuantumCode(source);
  assert(parsed.success, 'Parser must succeed');
  assert(parsed.circuit!.qubits === 3, 'Must have 3 qubits');
  assert(parsed.circuit!.gates.length === 4, 'Must have 4 gates');

  const regen = generateQuantumCode(parsed.circuit!);
  assert(regen.code.includes('QuantumCircuit(3)'), 'Must preserve 3 qubits');
  assert(regen.code.includes('qc.h(0)'), 'Must preserve qc.h(0)');
  assert(regen.code.includes('qc.x(1)'), 'Must preserve qc.x(1)');
  assert(regen.code.includes('qc.cx(0, 2)'), 'Must preserve qc.cx(0, 2)');
  console.log('✓ Test 2: Code -> Circuit -> Code Passed!');
}

// Test 3: Diagnostics on Invalid Code
{
  // Qubit out of bounds
  const badCode1 = `qc = QuantumCircuit(2)
qc.h(5)
`;
  const res1 = parseQuantumCode(badCode1);
  assert(!res1.success, 'Must fail on out-of-bounds qubit');
  assert(res1.diagnostics.length > 0, 'Must produce diagnostics');
  assert(res1.diagnostics[0].message.includes('out of range'), 'Diagnostic message must mention out of range');

  // Identical control & target in CNOT
  const badCode2 = `qc = QuantumCircuit(2)
qc.cx(1, 1)
`;
  const res2 = parseQuantumCode(badCode2);
  assert(!res2.success, 'Must fail on CNOT with identical control and target');
  assert(res2.diagnostics[0].message.includes('cannot be identical'), 'Must detect identical control/target');

  // Unknown operation
  const badCode3 = `qc = QuantumCircuit(2)
qc.teleport(0)
`;
  const res3 = parseQuantumCode(badCode3);
  assert(!res3.success, 'Must fail on unknown operation');
  assert(res3.diagnostics[0].message.includes("Unsupported quantum operation 'qc.teleport'"), 'Must flag unsupported op');

  // Malformed syntax: unclosed parenthesis
  const badCode4 = `qc = QuantumCircuit(2)
qc.h(0
`;
  const res4 = parseQuantumCode(badCode4);
  assert(!res4.success, 'Must fail on malformed syntax');
  assert(res4.diagnostics.length > 0, 'Must report syntax error');

  console.log('✓ Test 3: Diagnostics & Error Handling Passed!');
}

// Test 4: All Standard Circuit Templates Round-Trip
{
  for (const tpl of CIRCUIT_TEMPLATES) {
    const gen = generateQuantumCode(tpl.circuit);
    const parsed = parseQuantumCode(gen.code);
    assert(parsed.success, `Template '${tpl.name}' must parse successfully`);
    assert(parsed.circuit!.qubits === tpl.circuit.qubits, `Template '${tpl.name}' qubit count must match`);
    assert(parsed.circuit!.gates.length === tpl.circuit.gates.length, `Template '${tpl.name}' gate count must match`);
  }
  console.log(`✓ Test 4: All ${CIRCUIT_TEMPLATES.length} Templates Round-Trip Passed!`);
}

// Test 5: Move Gate Domain Logic
{
  const bell = CIRCUIT_TEMPLATES.find((t) => t.id === 'bell-state')!;
  const hGate = bell.circuit.gates.find((g) => g.type === 'H')!;
  assert(!!hGate, 'H gate must exist in Bell template');

  const moveRes = moveGate(bell.circuit, hGate.id, 2, 1);
  assert(!moveRes.error, 'Move gate must succeed without error');
  const movedGate = moveRes.circuit.gates.find((g) => g.id === hGate.id)!;
  assert(movedGate.step === 2, 'Moved gate step must be 2');
  assert(movedGate.target === 1, 'Moved gate target must be 1');

  // Regenerate code after move and verify
  const genMoved = generateQuantumCode(moveRes.circuit);
  assert(genMoved.code.includes('qc.h(1)'), 'Generated code must reflect new target qubit');
  console.log('✓ Test 5: Gate Movement & Code Generation Sync Passed!');
}

// Test 6: Parameterized Phase Gates (RX, RY, RZ, S, T)
{
  const paramCode = `qc = QuantumCircuit(2)
qc.rx(1.5708, 0)
qc.ry(3.14159, 1)
qc.rz(0.7854, 0)
qc.s(0)
qc.t(1)
`;
  const parsed = parseQuantumCode(paramCode);
  assert(parsed.success, 'Must parse parameterized gates');
  assert(parsed.circuit!.gates.length === 5, 'Must have 5 gates');
  assert(parsed.circuit!.gates[0].type === 'RX', 'First must be RX');
  assert(parsed.circuit!.gates[0].params?.theta === 1.5708, 'RX angle must be parsed');
  assert(parsed.circuit!.gates[1].type === 'RY', 'Second must be RY');
  assert(parsed.circuit!.gates[2].type === 'RZ', 'Third must be RZ');

  const regen = generateQuantumCode(parsed.circuit!);
  assert(regen.code.includes('qc.rx(1.5708, 0)'), 'Must regenerate RX parameter');
  assert(regen.code.includes('qc.ry(3.14159, 1)'), 'Must regenerate RY parameter');
  console.log('✓ Test 6: Parameterized Gates & Angular Arguments Passed!');
}

// Test 7: Measure All Convenience Function
{
  const measureAllCode = `qc = QuantumCircuit(2)
qc.h(0)
qc.cx(0, 1)
qc.measure_all()
`;
  const parsed = parseQuantumCode(measureAllCode);
  assert(parsed.success, 'Must parse measure_all');
  assert(parsed.circuit!.measurements?.length === 2, 'Must create 2 measurement mappings');
  console.log('✓ Test 7: qc.measure_all() Convenience Method Passed!');
}

console.log('\n======================================================');
console.log('ALL 7 CODE SYNC UNIT & INTEGRATION TESTS PASSED! ✨');
console.log('======================================================\n');
