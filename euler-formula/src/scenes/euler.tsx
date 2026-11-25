import { Latex, Line, Node, Rect, Txt, makeScene2D } from '@motion-canvas/2d';
import {
  Vector2,
  all,
  chain,
  createRef,
  createSignal,
  easeInOutCubic,
  linear,
  waitFor,
} from '@motion-canvas/core';

/* ------------------------------------------------------------------ *
 * Colors and fonts
 * ------------------------------------------------------------------ */
const C = {
  re: '#ff6b81',
  im: '#f6c244',
  cyan: '#5bd1e6',
  blue: '#3d8fe6',
  white: '#f2f2f2',
  boxCyan: '#4fb7d8',
};
const SERIF = "'Latin Modern Roman','CMU Serif','Times New Roman',Georgia,serif";

/* ------------------------------------------------------------------ *
 * Pseudo 3D camera.
 * A view is 8 numbers (screen y points DOWN, like Motion Canvas):
 *   [Re.x, Re.y,  Im.x, Im.y,  T.x, T.y,  origin.x, origin.y]
 * Each world axis (Re, Im, t) maps to a screen vector, in units of S px.
 * Tweening between two views gives the "camera rotation" look.
 * ------------------------------------------------------------------ */
type V8 = number[];
const lerpArr = (a: V8, b: V8, t: number): V8 => a.map((v, i) => v + (b[i] - v) * t);

const S = 147; // px per unit
const VIEW_2D: V8 = [1, 0, 0, -1, 0, 0, 0, 52];
const VIEW_3D: V8 = [0.84, -0.21, 0, -0.9, 0.5, 0.3, -202, -60];
const VIEW_COS: V8 = [0, -1, 0, 0, 1, 0, -403, 52];
const VIEW_SIN: V8 = [0, 0, 0, -1, 1, 0, -403, 52];

/* ------------------------------------------------------------------ *
 * Label poses (scene coords, y down). r = rotation deg, s = scale.
 * ------------------------------------------------------------------ */
type Pose = { x: number; y: number; r: number; s: number };
const POSE = {
  z2d: { x: 321, y: -41, r: 0, s: 1 },
  z3d: { x: 73, y: -214, r: -8, s: 0.87 },
  im3d: { x: -137, y: -300, r: 25, s: 0.52 },
  re3d: { x: 120, y: -83, r: 18, s: 0.72 },
  cos3d: { x: 150, y: 5, r: 20, s: 0.6 },
  sin3d: { x: -24, y: -154, r: 22, s: 0.62 },
  imPlot: { x: -266, y: -238, r: 0, s: 1 },
  rePlot: { x: -266, y: -238, r: 0, s: 1 },
  cosPlot: { x: -37, y: -141, r: 0, s: 1 },
  sinPlot: { x: -43, y: -143, r: 0, s: 1 },
} satisfies Record<string, Pose>;

/* ------------------------------------------------------------------ *
 * Tex helpers
 * ------------------------------------------------------------------ */
const col = (color: string, expr: string) => String.raw`{\color{${color}} ${expr}}`;
const zTex = (hi: string, range: string) =>
  String.raw`{\color{#ffffff} z=e^{i\pi t},\ t\in {\color{${hi}} ${range}}}`;

type LabelOpts = {
  tex: string;
  color: string;
  fill: string;
  w: number; // box width
  tw: number; // tex width
  h?: number;
};

const makeLabel = (o: LabelOpts) => {
  const h = o.h ?? 66;
  const root = createRef<Node>();
  const latex = createRef<Latex>();
  const reveal = createSignal(1); // 0..1 left-to-right wipe
  const node = (
    <Node ref={root} opacity={0}>
      <Rect
        width={() => o.w * reveal()}
        height={h}
        x={() => -o.w / 2 + (o.w * reveal()) / 2}
        radius={10}
        lineWidth={3}
        stroke={o.color}
        fill={o.fill}
        opacity={() => Math.min(1, reveal() * 20)}
        clip
      >
        <Latex
          ref={latex}
          tex={o.tex}
          width={o.tw}
          x={() => o.w / 2 - (o.w * reveal()) / 2}
        />
      </Rect>
    </Node>
  );
  return { node, root, latex, reveal };
};
type Label = ReturnType<typeof makeLabel>;

const setPose = (l: Label, p: Pose) => {
  l.root().position([p.x, p.y]);
  l.root().rotation(p.r);
  l.root().scale(p.s);
};
const toPose = (l: Label, p: Pose, t: number) =>
  all(
    l.root().position([p.x, p.y], t, easeInOutCubic),
    l.root().rotation(p.r, t, easeInOutCubic),
    l.root().scale(p.s, t, easeInOutCubic),
  );

/* ------------------------------------------------------------------ *
 * Scene
 * ------------------------------------------------------------------ */
export default makeScene2D(function* (view) {
  view.fill('#000000');

  const viewSig = createSignal<V8>(VIEW_2D, lerpArr);

  const P = (re: number, im: number, t: number) => {
    const v = viewSig();
    return new Vector2(
      v[6] + S * (v[0] * re + v[2] * im + v[4] * t),
      v[7] + S * (v[1] * re + v[3] * im + v[5] * t),
    );
  };
  const along = (a: number, s: number) =>
    a === 0 ? P(s, 0, 0) : a === 1 ? P(0, s, 0) : P(0, 0, s);
  const dirOf = (a: number) => {
    const v = viewSig();
    return new Vector2(v[2 * a], v[2 * a + 1]);
  };
  const helix = (t0: number, t1: number, n: number) =>
    Array.from({ length: n + 1 }, (_, i) => {
      const t = t0 + ((t1 - t0) * i) / n;
      return P(Math.cos(Math.PI * t), Math.sin(Math.PI * t), t);
    });

  // visibility signals
  const showRe = createSignal(1);
  const showIm = createSignal(1);
  const showT = createSignal(0);
  const tickInt = createSignal(1); // t = 1,2,3...
  const tickHalf = createSignal(0); // t = 0.5,1.5,2.5...
  const lblC = createSignal(1); // -1, 1, i, -i
  const lblCos = createSignal(0); // 0, pi, 2pi...
  const lblSin = createSignal(0); // pi/2, 3pi/2...

  /* ---------- axes ---------- */
  const axisLine = (a: number, from: number, to: number, op: () => number) => (
    <Line
      points={() => [along(a, from), along(a, to)]}
      stroke={C.white}
      lineWidth={4}
      endArrow
      arrowSize={18}
      opacity={op}
    />
  );
  view.add(axisLine(0, -2.1, 2.1, showRe));
  view.add(axisLine(1, -2.1, 2.1, showIm));
  view.add(axisLine(2, 0, 5.2, showT));

  /* ---------- ticks ---------- */
  const tick = (a: number, s: number, op: () => number) => (
    <Line
      stroke={C.white}
      lineWidth={3}
      opacity={op}
      points={() => {
        const c = along(a, s);
        let d = dirOf(a);
        if (d.magnitude < 1e-3) {
          d = new Vector2(1, 0);
        }
        const n = d.normalized.perpendicular.scale(9);
        return [c.add(n), c.sub(n)];
      }}
    />
  );
  for (const s of [-1, 1]) {
    view.add(tick(0, s, showRe));
    view.add(tick(1, s, showIm));
  }
  for (const s of [1, 2, 3, 4, 5]) {
    view.add(tick(2, s, () => showT() * tickInt()));
  }
  for (const s of [0.5, 1.5, 2.5, 3.5]) {
    view.add(tick(2, s, () => showT() * tickHalf()));
  }

  /* ---------- curves ---------- */
  const cyan = createRef<Line>();
  const blue = createRef<Line>();
  view.add(
    <Line
      ref={cyan}
      points={() => helix(0, 2, 160)}
      stroke={C.cyan}
      lineWidth={7}
      lineCap="round"
      end={0}
    />,
  );
  view.add(
    <Line
      ref={blue}
      points={() => helix(2, 4, 160)}
      stroke={C.blue}
      lineWidth={7}
      lineCap="round"
      end={0}
    />,
  );

  /* ---------- tick labels ---------- */
  const mathTxt = (
    text: string,
    color: string,
    at: () => Vector2,
    op: () => number,
  ) => (
    <Txt
      text={text}
      fill={color}
      fontFamily={SERIF}
      fontStyle="italic"
      fontSize={44}
      position={at}
      opacity={op}
    />
  );
  const frac = (num: string, den: string, at: () => Vector2, op: () => number) => (
    <Node position={at} opacity={op}>
      <Txt text={num} y={-22} fill="#fff" fontFamily={SERIF} fontStyle="italic" fontSize={40} />
      <Rect width={54} height={2} fill="#fff" />
      <Txt text={den} y={24} fill="#fff" fontFamily={SERIF} fontSize={40} />
    </Node>
  );

  // complex plane labels
  view.add(mathTxt('−1', C.re, () => P(-1, 0, 0).add([-30, 34]), lblC));
  view.add(mathTxt('1', C.re, () => P(1, 0, 0).add([28, 34]), lblC));
  view.add(mathTxt('i', C.im, () => P(0, 1, 0).add([-34, -28]), lblC));
  view.add(mathTxt('-i', C.im, () => P(0, -1, 0).add([-30, 30]), lblC));

  // cosine plot labels: 0, pi, 2pi, 3pi, 4pi
  view.add(mathTxt('0', '#fff', () => P(0, 0, 0).add([-20, 46]), lblCos));
  ['π', '2π', '3π', '4π'].forEach((text, i) => {
    view.add(mathTxt(text, '#fff', () => P(0, 0, i + 1).add([0, 46]), lblCos));
  });

  // sine plot labels: pi/2, 3pi/2 ...
  ['π', '3π', '5π', '7π'].forEach((n, i) => {
    view.add(frac(n, '2', () => P(0, 0, i + 0.5).add([0, 62]), lblSin));
  });

  // t axis name
  view.add(
    mathTxt('πt', '#fff', () => P(0, 0, 5.2).add([36, -26]), () => showT()),
  );

  /* ---------- title ---------- */
  const title = createRef<Txt>();
  view.add(
    <Rect
      y={-482}
      width={460}
      height={76}
      radius={10}
      lineWidth={2}
      stroke="#8a8a8a"
      fill="#060606"
    >
      <Txt ref={title} text="" fill="#fff" fontFamily={SERIF} fontSize={54} />
    </Rect>,
  );

  /* ---------- formula labels ---------- */
  const lz = makeLabel({
    tex: zTex(C.cyan, '[0,2]'),
    color: C.boxCyan,
    fill: 'rgba(79,183,216,0.14)',
    w: 352,
    tw: 322,
  });
  const lim = makeLabel({
    tex: col(C.im, String.raw`y=\mathrm{Im}(z)`),
    color: C.im,
    fill: 'rgba(246,194,68,0.16)',
    w: 226,
    tw: 182,
  });
  const lre = makeLabel({
    tex: col(C.re, String.raw`x=\mathrm{Re}(z)`),
    color: C.re,
    fill: 'rgba(255,107,129,0.18)',
    w: 226,
    tw: 185,
  });
  const lcos = makeLabel({
    tex: col(C.re, String.raw`x=\cos(\pi t),\ t\in[0,4]`),
    color: C.re,
    fill: 'rgba(255,107,129,0.18)',
    w: 437,
    tw: 395,
  });
  const lsin = makeLabel({
    tex: col(C.im, String.raw`y=\sin(\pi t),\ t\in[0,4]`),
    color: C.im,
    fill: 'rgba(246,194,68,0.16)',
    w: 432,
    tw: 387,
  });
  for (const l of [lz, lim, lre, lcos, lsin]) {
    view.add(l.node);
  }

  // initial poses
  setPose(lz, POSE.z2d);
  setPose(lim, POSE.im3d);
  setPose(lre, POSE.re3d);
  setPose(lcos, POSE.cos3d);
  setPose(lsin, POSE.sinPlot);

  /* ================================================================ *
   * Timeline (about 15 s)
   * ================================================================ */

  // 0.0 - 1.2  intro: complex plane, circle z = e^{i pi t}
  lz.root().opacity(1);
  lz.reveal(0);
  yield* all(
    title().text('Euler’s Formula', 0.9, linear),
    chain(waitFor(0.2), lz.reveal(1, 0.8, linear)),
    chain(waitFor(0.3), cyan().end(1, 0.9, easeInOutCubic)),
  );

  // 1.2 - 2.2  lift into 3D, t axis grows, Im and Re labels appear
  yield* all(
    viewSig(VIEW_3D, 1.0, easeInOutCubic),
    showT(1, 1.0),
    lblC(0, 0.4),
    toPose(lz, POSE.z3d, 1.0),
    chain(
      waitFor(0.5),
      all(lim.root().opacity(1, 0.5), lre.root().opacity(1, 0.5)),
    ),
  );
  yield* waitFor(1.3);

  // 3.5 - 4.7  rotate to the Re - t plane (cosine)
  yield* all(
    viewSig(VIEW_COS, 1.2, easeInOutCubic),
    lim.root().opacity(0, 0.5),
    lz.root().opacity(0, 0.5),
    toPose(lre, POSE.rePlot, 1.2),
    chain(waitFor(0.9), lblCos(1, 0.3)),
  );
  showIm(0);
  // 4.8 - 6.1  cosine label writes in, curve extends to t = 4
  yield* waitFor(0.1);
  lcos.reveal(0);
  setPose(lcos, POSE.cosPlot);
  lcos.root().opacity(1);
  yield* lcos.reveal(1, 0.6, linear);
  yield* blue().end(1, 0.7, linear);
  yield* waitFor(1.5);

  // 7.6 - 8.8  rotate back to 3D
  lz.latex().tex(zTex(C.blue, '[0,4]'));
  yield* all(
    viewSig(VIEW_3D, 1.2, easeInOutCubic),
    showIm(1, 0.8),
    lblCos(0, 0.3),
    toPose(lre, POSE.re3d, 1.2),
    toPose(lcos, POSE.cos3d, 1.2),
    chain(
      waitFor(0.4),
      all(lim.root().opacity(1, 0.6), lz.root().opacity(1, 0.6)),
    ),
  );
  yield* waitFor(0.8);

  // 9.6 - 10.9  rotate to the Im - t plane (sine)
  yield* all(
    viewSig(VIEW_SIN, 1.2, easeInOutCubic),
    tickInt(0, 0.6),
    tickHalf(1, 0.6),
    lre.root().opacity(0, 0.3),
    lcos.root().opacity(0, 0.3),
    lz.root().opacity(0, 0.3),
    toPose(lim, POSE.imPlot, 1.2),
    chain(waitFor(0.9), lblSin(1, 0.3)),
  );
showRe(0);
  // 10.9 - 11.6  sine label writes in
  lsin.reveal(0);
  setPose(lsin, POSE.sinPlot);
  lsin.root().opacity(1);
  yield* lsin.reveal(1, 0.7, linear);
  yield* waitFor(1.1);

  // 12.7 - 14.0  rotate back to 3D, show every label
  yield* all(
    viewSig(VIEW_3D, 1.3, easeInOutCubic),
    showRe(1, 0.8),
    lblSin(0, 0.3),
    tickHalf(0, 0.6),
    tickInt(1, 0.6),
    toPose(lim, POSE.im3d, 1.3),
    toPose(lsin, POSE.sin3d, 1.3),
    chain(
      waitFor(0.9),
      all(
        lz.root().opacity(1, 0.4),
        lre.root().opacity(1, 0.4),
        lcos.root().opacity(1, 0.4),
      ),
    ),
  );
  yield* waitFor(1.0);
});
