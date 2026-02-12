import { fonts } from './fonts';

export const typography = {
  h1: {
    fontSize: 24,
    fontFamily: fonts.bold,
  },
  h2: {
    fontSize: 22,
    fontFamily: fonts.bold,
  },
  h3: {
    fontSize: 18,
    fontFamily: fonts.semiBold,
  },
  title: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
  },
  body: {
    fontSize: 14,
    fontFamily: fonts.regular,
  },
  small: {
    fontSize: 12,
    fontFamily: fonts.regular,
  },
  caption: {
    fontSize: 11,
    fontFamily: fonts.regular,
  },
  tiny: {
    fontSize: 9,
    fontFamily: fonts.regular,
  },
};

export type TypographyVariant = keyof typeof typography;
export type FontWeight = 'regular' | 'medium' | 'semiBold' | 'bold';

export const fontWeights: Record<FontWeight, string> = {
  regular: fonts.regular,
  medium: fonts.medium,
  semiBold: fonts.semiBold,
  bold: fonts.bold,
};
