import type { CSSProperties } from 'react';

export const bohoFloralGreen = {
  id: 'boho-floral-green',
  colors: {
    primary: '#30530F', secondary: '#6B8040', leaf: '#8BC34A',
    lightLeaf: '#A5C862', paleLeaf: '#C8DFA0', ivory: '#FFFAF7',
    card: 'rgba(255,250,247,.95)', textSecondary: 'rgba(48,83,15,.70)',
    border: 'rgba(107,128,64,.15)',
  },
  assets: {
    flower: '/decor/hoa-moc-xanh/flower.webp',
    tulipCorner: '/assets/wedding/cover/linhlantrai06.png',
    lilyCorner: '/assets/wedding/cover/linhlanphai06.png',
    decorationBar: '/decor/hoa-moc-xanh/decoration_bar.webp',
    envelope: '/decor/hoa-moc-xanh/boho_floral_green.webp',
    paper: '/decor/hoa-moc-xanh/paper.webp',
    paperNote: '/assets/wedding/hoa-moc/papernote-background-green.webp',
  },
  fonts: {
    heading: "'Playfair Display','Noto Serif',Georgia,serif",
    body: "Lora,'Noto Serif',Georgia,serif",
    ui: "'Be Vietnam Pro',Arial,sans-serif",
  },
} as const;

export type WeddingTheme = typeof bohoFloralGreen;

export function themeVariables(theme: WeddingTheme): CSSProperties {
  return {
    '--w-primary': theme.colors.primary,
    '--w-secondary': theme.colors.secondary,
    '--w-leaf': theme.colors.leaf,
    '--w-light-leaf': theme.colors.lightLeaf,
    '--w-pale-leaf': theme.colors.paleLeaf,
    '--w-ivory': theme.colors.ivory,
    '--w-card': theme.colors.card,
    '--w-text-secondary': theme.colors.textSecondary,
    '--w-border': theme.colors.border,
    '--w-heading': theme.fonts.heading,
    '--w-body': theme.fonts.body,
    '--w-ui': theme.fonts.ui,
  } as CSSProperties;
}
