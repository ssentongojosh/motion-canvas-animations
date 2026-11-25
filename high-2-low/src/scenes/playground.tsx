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
