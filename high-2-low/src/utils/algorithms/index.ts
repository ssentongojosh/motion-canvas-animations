import { Lexer } from "./lexer";

const code = `int main() {
  int x = 10;
  if (x == 10) {
    return x;
  }
}`;

const lexer = new Lexer(code);
const tokens = lexer.scanTokens();
console.table(tokens);
