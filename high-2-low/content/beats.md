# Beats: From High To Low

One beat = one scene = one unit of work.
Stages per beat: logic (pure code and tests), visual (component), scene (assembled), audio (synced).

- [ ] 01 Why compilers exist (punch cards to assembly to high-level)
  - logic: none
  - [ ] visual
  - [ ] scene
  - [ ] audio
- [ ] 02 The six stages overview (pipeline diagram)
  - logic: none
  - [ ] visual
  - [ ] scene
  - [ ] audio
- [ ] 03 Preprocessing (macros, comments, headers, `gcc -E`, file grows 4 KB to 20 KB)
  - logic: likely (expand an include and a macro into output lines)
  - [ ] logic
  - [ ] visual
  - [ ] scene
  - [ ] audio
- [ ] 04 Is C high level or low level? (medium-level sidebar)
  - logic: none
  - [ ] visual
  - [ ] scene
  - [ ] audio
- [ ] 05 Compiling: lexical, syntax, semantic analysis
  - logic: likely (tokenizer, then parse tree)
  - [ ] logic
  - [ ] visual
  - [ ] scene
  - [ ] audio
- [ ] 06 IR generation and optimization
  - logic: likely (a few optimization passes on a small IR)
  - [ ] logic
  - [ ] visual
  - [ ] scene
  - [ ] audio
- [ ] 07 Assembly (assembly text to machine code)
  - logic: maybe
  - [ ] visual
  - [ ] scene
  - [ ] audio
- [ ] 08 Linking (object files, symbols, libraries)
  - logic: likely (resolve symbols across files)
  - [ ] logic
  - [ ] visual
  - [ ] scene
  - [ ] audio
- [ ] 09 Loading (executable into memory, program starts)
  - logic: none
  - [ ] visual
  - [ ] scene
  - [ ] audio
- [ ] 10 Outro
  - logic: none
  - [ ] visual
  - [ ] scene
  - [ ] audio

## Suggested first beat

05 or 03. Both have a clear input, a clear output and a testable process. A tokenizer for `int main() { printf("hello"); }` is the smallest one.

## Open items

- Timing per beat: set after you write `script.md`.
- Beats 07 to 09 need details from the post that I did not capture.
