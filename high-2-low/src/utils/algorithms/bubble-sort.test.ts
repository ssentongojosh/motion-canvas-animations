import {describe, expect, it} from 'vitest';
import {bubbleSortSteps} from './bubble-sort';

describe('bubbleSortSteps', () => {
  it('ends with a sorted array', () => {
    const steps = bubbleSortSteps([3, 1, 2]);
    expect(steps[steps.length - 1].state).toEqual([1, 2, 3]);
  });

  it('does not change the input', () => {
    const input = [3, 1, 2];
    bubbleSortSteps(input);
    expect(input).toEqual([3, 1, 2]);
  });

  it('makes 3 swaps for a reversed 3 item array', () => {
    const swaps = bubbleSortSteps([3, 2, 1]).filter(s => s.action.kind === 'swap');
    expect(swaps).toHaveLength(3);
  });
});
