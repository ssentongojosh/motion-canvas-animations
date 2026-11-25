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
