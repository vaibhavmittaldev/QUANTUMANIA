/**
 * QUANTUMANIA - Complex Number Mathematical Library
 * Phase 4: Quantum Simulator
 * Numerically stable complex arithmetic for quantum statevectors
 */

export interface Complex {
  real: number;
  imag: number;
}

export const EPSILON = 1e-10;

export function complex(real: number, imag = 0): Complex {
  return { real, imag };
}

export function add(a: Complex, b: Complex): Complex {
  return {
    real: a.real + b.real,
    imag: a.imag + b.imag
  };
}

export function sub(a: Complex, b: Complex): Complex {
  return {
    real: a.real - b.real,
    imag: a.imag - b.imag
  };
}

export function mul(a: Complex, b: Complex): Complex {
  return {
    real: a.real * b.real - a.imag * b.imag,
    imag: a.real * b.imag + a.imag * b.real
  };
}

export function scale(a: Complex, s: number): Complex {
  return {
    real: a.real * s,
    imag: a.imag * s
  };
}

export function conj(a: Complex): Complex {
  return {
    real: a.real,
    imag: -a.imag
  };
}

export function magSq(a: Complex): number {
  return a.real * a.real + a.imag * a.imag;
}

export function mag(a: Complex): number {
  return Math.sqrt(magSq(a));
}

export function phase(a: Complex): number {
  if (magSq(a) < EPSILON) return 0;
  return Math.atan2(a.imag, a.real);
}

export function isZero(a: Complex, eps = EPSILON): boolean {
  return Math.abs(a.real) < eps && Math.abs(a.imag) < eps;
}

export function formatComplex(a: Complex, precision = 4): string {
  const r = Math.abs(a.real) < EPSILON ? 0 : a.real;
  const i = Math.abs(a.imag) < EPSILON ? 0 : a.imag;

  if (i === 0) {
    return r.toFixed(precision);
  }
  if (r === 0) {
    return `${i < 0 ? '-' : ''}${Math.abs(i).toFixed(precision)}i`;
  }
  const sign = i < 0 ? '-' : '+';
  return `${r.toFixed(precision)} ${sign} ${Math.abs(i).toFixed(precision)}i`;
}
