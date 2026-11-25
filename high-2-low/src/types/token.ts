export type TokenCategory =
  | "Keyword" | "Identifier" | "Operator" | "Literal" | "Punctuation" | "EOF";

export enum TokenKind {
  //Keywords 
  Int = "INT", Return = "RETURN",
  // Identifiers and Literals 
  Identifier = "IDENTIFIER", Number = "NUMBER",
  // Operators 
  Plus = "PLUS", Minus = "MINUS", Assign = "ASSIGN",Equal = "EQUAL",
  //Punctuation
  Semicolon = "SEMICOLON", Comma = "COMMA", Lparen = "LPAREN", Rparen = "RPAREN", Lbrac = "LBRAC", Rbrac = "RBRAC",
  //EOF
  EOF = "EOF"
}

export interface Token {
  category: TokenCategory,
  kind: TokenKind,
  value: string,
  line: number
}

export const KEYWORDS: Record<string, TokenKind> = {
  int: TokenKind.Int,
  return: TokenKind.Return,
}
