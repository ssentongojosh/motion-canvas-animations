import type {Step} from '../trace';

// Reference example of the trace pattern. Delete it once you have your own.
export type SortAction =
  | {kind: 'compare'; i: number; j: number}
  | {kind: 'swap'; i: number; j: number}
  | {kind: 'done'};

export type SortStep = Step<SortAction, number[]>;

export function bubbleSortSteps(input: readonly number[]): SortStep[] {
  const a = [...input];
  const steps: SortStep[] = [];

  for (let pass = 0; pass < a.length - 1; pass++) {
    for (let j = 0; j < a.length - 1 - pass; j++) {
      steps.push({action: {kind: 'compare', i: j, j: j + 1}, state: [...a]});
      if (a[j] > a[j + 1]) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        steps.push({action: {kind: 'swap', i: j, j: j + 1}, state: [...a]});
      }
    }
  }

  steps.push({action: {kind: 'done'}, state: [...a]});
  return steps;
}
