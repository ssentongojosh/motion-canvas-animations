import { TokenKind, TokenCategory, KEYWORDS, Token } from "../../types/token";
import { isAtEnd, isAlphaNumeric, peek, isDigit, isAlpha } from "./helpers/lexer-helpers";

export class Lexer {
  private start = 0;
  private current = 0;
  private line = 1;
  private tokens: Token[] = [];

  constructor(private source: string) { }



  scanTokens(): Token[] {
    while (!isAtEnd(this.source, this.current)) {
      this.start = this.current;
      this.scanToken();
    }
    this.tokens.push({ category: "EOF", kind: TokenKind.EOF, value: "", line: this.line });
    return this.tokens;
  }

  private addToken(category: TokenCategory, kind: TokenKind): void {
    const value = this.source.slice(this.start, this.current);
    this.tokens.push({ category, kind, value, line: this.line });
  }

  private scanToken(): void {
    const char = this.source[this.current++];
    switch (char) {
      case " ": case "\r": case "\t": break;
      case "\n": this.line++; break;
      case ";": this.addToken("Punctuation", TokenKind.Semicolon); break;
      case ",": this.addToken("Punctuation", TokenKind.Comma); break;
      case "(": this.addToken("Punctuation", TokenKind.Lparen); break;
      case ")": this.addToken("Punctuation", TokenKind.Rparen); break;
      case "{": this.addToken("Punctuation", TokenKind.Lbrac); break;
      case "}": this.addToken("Punctuation", TokenKind.Rbrac); break;
      case "=":
        if (peek(this.source, this.current) === "=") {
          this.current++;
          this.addToken("Operator", TokenKind.Equal);

        } else {
          this.addToken("Operator", TokenKind.Assign);
        }
        break;
      default:
        if (isDigit(char)) {
          while (isDigit(peek(this.source, this.current))) {
            this.current = this.current + 1;
          }
          this.addToken("Literal", TokenKind.Number);
        } else if (isAlpha(char)) {
          while (isAlphaNumeric(peek(this.source, this.current))) {
            this.current = this.current + 1;
          }
          let tokenKey: string = this.source.slice(this.start, this.current);
          if (tokenKey in KEYWORDS) {
            this.addToken("Keyword", KEYWORDS[tokenKey])
          } else {
            this.addToken("Identifier", TokenKind.Identifier)
          }
        }
    }
  }
}

