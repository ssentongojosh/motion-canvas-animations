// A DFT output is complex numbers, not plain numbers.
export interface Complex {
  re: number;
  im: number;
}

export function dft(_signal: readonly number[]): Complex[] {
  throw new Error('not implemented');
}
