export function isAtEnd(source: string, current: number): boolean {
  return current >= source.length;
}

export function advance(source: string, current: number): string {
  return source[current++];
}

export function peek(source: string, current: number): string {
  if (isAtEnd(source, current)) return '\0';
  return source[current];
}

export function isDigit(char: string): boolean {
  return char >= "0" && char <= "9";
}

export function isAlpha(char: string): boolean {
  return char >= "a" && char <= "z" ||
    char >= "A" && char <= "Z" ||
    char === "_"
}

export function isAlphaNumeric(char: string): boolean {
  return isAlpha(char) || isDigit(char);
}




