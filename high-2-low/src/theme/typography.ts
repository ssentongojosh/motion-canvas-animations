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
