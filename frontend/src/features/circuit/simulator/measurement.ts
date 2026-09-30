/**
 * QUANTUMANIA - Quantum Measurement Sampling Engine
 * Phase 4: Quantum Simulator
 * Probabilistic sampling across multiple shots with injectable RNG for deterministic testing
 */

export interface MeasurementResult {
  counts: Record<string, number>;
  shots: number;
}

/**
 * Samples measurement outcomes given a probability distribution and shot count
 * Uses Cumulative Distribution Function (CDF) inversion.
 */
export function sampleMeasurements(
  probabilities: Record<string, number>,
  shots: number,
  rng: () => number = Math.random
): Record<string, number> {
  const keys = Object.keys(probabilities);
  if (keys.length === 0 || shots <= 0) {
    return {};
  }

  // Build CDF
  const cumulative: number[] = [];
  let sum = 0;
  for (const k of keys) {
    sum += probabilities[k];
    cumulative.push(sum);
  }

  // Normalize cumulative to 1.0 in case of minor floating-point drift
  if (sum > 0) {
    for (let i = 0; i < cumulative.length; i++) {
      cumulative[i] /= sum;
    }
  }

  const counts: Record<string, number> = {};
  for (const k of keys) {
    counts[k] = 0;
  }

  for (let s = 0; s < shots; s++) {
    const r = rng();

    // Binary search through CDF
    let low = 0;
    let high = cumulative.length - 1;
    let chosenIndex = high;

    while (low <= high) {
      const mid = (low + high) >> 1;
      if (r <= cumulative[mid]) {
        chosenIndex = mid;
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    }

    const outcome = keys[chosenIndex];
    counts[outcome] = (counts[outcome] || 0) + 1;
  }

  return counts;
}

/**
 * Filters counts to only include observed bitstrings (count > 0)
 */
export function filterObservedCounts(counts: Record<string, number>): Record<string, number> {
  const filtered: Record<string, number> = {};
  for (const [k, v] of Object.entries(counts)) {
    if (v > 0) {
      filtered[k] = v;
    }
  }
  return filtered;
}
