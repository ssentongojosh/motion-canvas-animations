#!/usr/bin/env bash
# Usage: ./setup-mc-project.sh <project-name>
#
# Scaffolds a Motion Canvas project, then adds:
#   - content/ for script, beats and a session log
#   - src/theme/ for palette, fonts, timing
#   - src/utils/ for pure logic with tests (no Motion Canvas imports)
#   - a second "playground" project so test scenes never reach the real video
#
# Safe to re-run: existing files are never overwritten.

set -euo pipefail

if [ $# -ne 1 ]; then
  echo "Usage: $0 <project-name>" >&2
  exit 1
fi

NAME="$1"

if [ -e "$NAME" ]; then
  echo "Folder '$NAME' already exists. Stop." >&2
  exit 1
fi

write_file() {
  # write_file <path>  (content comes from stdin)
  if [ -e "$1" ]; then
    echo "skip (exists): $1"
    cat > /dev/null
  else
    mkdir -p "$(dirname "$1")"
    cat > "$1"
    echo "created: $1"
  fi
}

echo "Step 1: scaffold the base project. Pick TypeScript and 2D when asked."
npm init @motion-canvas@latest "$NAME"

if [ ! -d "$NAME" ]; then
  echo "Scaffolder did not create '$NAME'. Check the folder name it used and cd there manually." >&2
  exit 1
fi

cd "$NAME"

echo "Step 2: folders"
mkdir -p content prompts
mkdir -p public/fonts public/images
mkdir -p src/audio
mkdir -p src/components/{diagrams,code,ui}
mkdir -p src/theme
mkdir -p src/utils/{algorithms,math}
mkdir -p src/scenes

echo "Step 3: content files"

write_file content/draft.md <<'EOF'
# Video title

## Research and notes
-

## Rough script
EOF

write_file content/script.md <<'EOF'
# Final script

Write the narration here, one paragraph per beat.
EOF

write_file content/beats.md <<'EOF'
# Beats

One beat = one scene = one unit of work.
Stages: [logic] pure code and tests, [visual] component, [scene] assembled, [audio] synced.

- [ ] 01 intro
  - [ ] logic (skip if none)
  - [ ] visual
  - [ ] scene
  - [ ] audio
- [ ] 02 ...
EOF

write_file content/log.md <<'EOF'
# Session log

One entry per session. Write the next step before you stop.

## YYYY-MM-DD
- Did:
- Stuck on:
- Next:
EOF

write_file prompts/review.md <<'EOF'
# Review prompt

Use an LLM to check your code, not to write it.

I wrote this file myself. Do not rewrite it. Do this instead:
1. List bugs and edge cases I missed.
2. Point out where logic and rendering are mixed.
3. Point out hardcoded colors, fonts or durations that belong in src/theme/.
4. Ask me up to three questions about choices that look unclear.

File path: <path>
Code:
<paste>
EOF

echo "Step 4: theme"

write_file src/theme/palette.ts <<'EOF'
// All colors live here. Never hardcode a color in a component.
export const palette = {
  background: '#0f172a',
  surface: '#1e293b',
  text: '#f8fafc',
  textMuted: '#94a3b8',
  primary: '#38bdf8',
  secondary: '#a78bfa',
  accent: '#34d399',
  error: '#f87171',
} as const;
EOF

write_file src/theme/fonts.css <<'EOF'
/* Put the font files in public/fonts/ with these exact names, or edit the paths. */
@font-face {
  font-family: 'Inter';
  src: url('/fonts/Inter.woff2') format('woff2');
  font-weight: 100 900;
}
@font-face {
  font-family: 'JetBrains Mono';
  src: url('/fonts/JetBrainsMono.woff2') format('woff2');
  font-weight: 100 800;
}
EOF

write_file src/theme/typography.ts <<'EOF'
import './fonts.css';

export const fonts = {
  sans: 'Inter',
  mono: 'JetBrains Mono',
} as const;

// Spread into a Txt: <Txt text="Hi" {...typography.h1} fill={palette.text} />
export const typography = {
  h1: {fontSize: 64, fontFamily: fonts.sans, fontWeight: 700},
  h2: {fontSize: 48, fontFamily: fonts.sans, fontWeight: 600},
  body: {fontSize: 32, fontFamily: fonts.sans, fontWeight: 400},
  code: {fontSize: 28, fontFamily: fonts.mono, fontWeight: 400},
} as const;
EOF

write_file src/theme/easing.ts <<'EOF'
import {easeInOutCubic, easeOutExpo} from '@motion-canvas/core';

// All animation durations (seconds) and curves live here.
// Algorithms must not know about time. Scenes pick timing from this file.
export const timing = {
  fast: 0.3,
  normal: 0.6,
  slow: 1.2,
} as const;

export const ease = {
  standard: easeInOutCubic,
  snap: easeOutExpo,
} as const;
EOF

echo "Step 5: pure logic (no Motion Canvas imports allowed in src/utils/)"

write_file src/utils/trace.ts <<'EOF'
/**
 * TRACE PATTERN
 *
 * An algorithm runs once and returns a list of steps.
 * Each step says what happened (action) and what the data looks like after it (state).
 * A scene later walks the list and animates one step at a time.
 *
 * Rules:
 * - No imports from @motion-canvas in src/utils/.
 * - No durations or colors in a step. Timing and looks belong to the scene and theme.
 * - Store a full state snapshot per step so a scene can jump to any step.
 */
export interface Step<Action, State> {
  action: Action;
  state: State;
}
EOF

write_file src/utils/algorithms/bubble-sort.ts <<'EOF'
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
EOF

write_file src/utils/algorithms/bubble-sort.test.ts <<'EOF'
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
EOF

write_file src/utils/math/dft.ts <<'EOF'
// A DFT output is complex numbers, not plain numbers.
export interface Complex {
  re: number;
  im: number;
}

export function dft(_signal: readonly number[]): Complex[] {
  throw new Error('not implemented');
}
EOF

write_file src/utils/math/dft.test.ts <<'EOF'
import {describe, it} from 'vitest';

describe('dft', () => {
  it.todo('returns N bins for N samples');
  it.todo('puts all energy in bin 0 for a constant signal');
});
EOF

echo "Step 6: playground project"

write_file src/scenes/playground.tsx <<'EOF'
import {Txt, makeScene2D} from '@motion-canvas/2d';
import {waitFor} from '@motion-canvas/core';
import {palette} from '../theme/palette';
import {typography} from '../theme/typography';

// Test one component at a time here. This scene belongs to the playground
// project only, so it never appears in the real video or its render.
//
// Pattern for consuming a trace:
//   const steps = bubbleSortSteps([5, 2, 4, 1]);
//   for (const step of steps) {
//     // read step.action and step.state, then yield* the matching animation
//   }
export default makeScene2D(function* (view) {
  view.fill(palette.background);

  view.add(<Txt text="Playground" {...typography.h1} fill={palette.text} />);

  yield* waitFor(1);
});
EOF

write_file src/playground.ts <<'EOF'
import {makeProject} from '@motion-canvas/core';
import playground from './scenes/playground?scene';

export default makeProject({
  scenes: [playground],
});
EOF

if [ -f vite.config.ts ]; then
  if grep -q 'motionCanvas()' vite.config.ts; then
    sed -i.bak "s#motionCanvas()#motionCanvas({project: ['./src/project.ts', './src/playground.ts']})#" vite.config.ts
    rm -f vite.config.ts.bak
    echo "patched: vite.config.ts now registers both projects"
  else
    echo "WARNING: could not patch vite.config.ts. Set the plugin to:"
    echo "  motionCanvas({project: ['./src/project.ts', './src/playground.ts']})"
  fi
else
  echo "WARNING: vite.config.ts not found. Register src/playground.ts by hand."
fi

echo "Step 7: git and tests"

if [ -f .gitignore ]; then
  grep -qxF 'output/' .gitignore || echo 'output/' >> .gitignore
else
  echo 'output/' > .gitignore
  echo 'node_modules/' >> .gitignore
fi

npm install
# Motion Canvas pins vite 4. Vitest 0.34 is the last line that supports it.
npm install -D vitest@0.34
npm pkg set scripts.test="vitest run"

if [ ! -d .git ]; then
  git init -q
fi

cat <<EOF

Done: $NAME

Run:
  cd $NAME
  npm run test     check pure logic, no renderer needed
  npm run serve    open the editor, pick "project" or "playground" at the top

Next:
  1. Drop Inter.woff2 and JetBrainsMono.woff2 into public/fonts/.
  2. Fill content/script.md, then cut it into beats in content/beats.md.
  3. Add scenes as src/scenes/01-name.tsx and list them in src/project.ts.
  4. Commit the .meta files. They hold your timing edits.
EOF
