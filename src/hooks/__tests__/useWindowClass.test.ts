import type {
   resolveWindowClass as ResolveWindowClassFn,
  WINDOW_CLASS_BREAKPOINTS as WindowClassBreakpointsType,
} from '@/hooks/useWindowClass';

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  useWindowDimensions: jest.fn(() => ({ width: 393, height: 852 })),
}));

// Carregado após jest.mock pois jest-transformer.js usa ts.transpileModule (sem babel-plugin-jest-hoist)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { resolveWindowClass, WINDOW_CLASS_BREAKPOINTS } = require('@/hooks/useWindowClass') as {
  resolveWindowClass: typeof ResolveWindowClassFn;
  WINDOW_CLASS_BREAKPOINTS: typeof WindowClassBreakpointsType;
};

describe('useWindowClass / resolveWindowClass (iOS 27 & iPhone Duo)', () => {
  it('retorna compact no iOS para larguras menores que o breakpoint (ex.: iPhone padrão 393pt)', () => {
    const res = resolveWindowClass({
      width: 393,
      height: 852,
      platformOS: 'ios',
      isDev: false,
      forceRegularInDev: false,
    });

    expect(res.sizeClass).toBe('compact');
    expect(res.isCompact).toBe(true);
    expect(res.isRegular).toBe(false);
    expect(res.columns).toBe(1);
    expect(res.columnGap).toBe(0);
    expect(res.maxContentWidth).toBeUndefined();
    expect(res.maxFormWidth).toBeUndefined();
    expect(res.isForcedRegularDev).toBe(false);
  });

  it('retorna regular no iOS quando a largura atinge ou supera o breakpoint (ex.: iPhone Duo aberto 720x840)', () => {
    const atBreakpoint = resolveWindowClass({
      width: WINDOW_CLASS_BREAKPOINTS.regularMinWidth,
      height: 900,
      platformOS: 'ios',
    });
    expect(atBreakpoint.sizeClass).toBe('regular');
    expect(atBreakpoint.isRegular).toBe(true);
    expect(atBreakpoint.columns).toBe(2);
    expect(atBreakpoint.columnGap).toBe(
      WINDOW_CLASS_BREAKPOINTS.columnGapRegular
    );
    expect(atBreakpoint.maxContentWidth).toBe(
      WINDOW_CLASS_BREAKPOINTS.maxContentWidthRegular
    );
    expect(atBreakpoint.maxFormWidth).toBe(
      WINDOW_CLASS_BREAKPOINTS.maxFormWidthRegular
    );

    // Mesmo com height > width (retrato na tela interna do Duo), reage à largura da janela e não à orientação
    const duoPortraitUnfolded = resolveWindowClass({
      width: 720,
      height: 840,
      platformOS: 'ios',
    });
    expect(duoPortraitUnfolded.sizeClass).toBe('regular');
    expect(duoPortraitUnfolded.isRegular).toBe(true);
    expect(duoPortraitUnfolded.columns).toBe(2);
    expect(duoPortraitUnfolded.maxFormWidth).toBe(
      WINDOW_CLASS_BREAKPOINTS.maxFormWidthRegular
    );
  });

  it('mantém Android e Web sempre em compact, mesmo em janelas largas ou com flag de dev', () => {
    const androidWide = resolveWindowClass({
      width: 840,
      height: 900,
      platformOS: 'android',
      isDev: true,
      forceRegularInDev: true,
    });
    expect(androidWide.sizeClass).toBe('compact');
    expect(androidWide.isRegular).toBe(false);
    expect(androidWide.columns).toBe(1);
    expect(androidWide.maxContentWidth).toBeUndefined();
    expect(androidWide.maxFormWidth).toBeUndefined();

    const webWide = resolveWindowClass({
      width: 1280,
      height: 800,
      platformOS: 'web',
      isDev: true,
      forceRegularInDev: true,
    });
    expect(webWide.sizeClass).toBe('compact');
    expect(webWide.isRegular).toBe(false);
    expect(webWide.columns).toBe(1);
  });

  it('permite forçar o modo regular no iOS somente quando isDev=true', () => {
    const forcedInDev = resolveWindowClass({
      width: 390,
      height: 844,
      platformOS: 'ios',
      isDev: true,
      forceRegularInDev: true,
    });
    expect(forcedInDev.sizeClass).toBe('regular');
    expect(forcedInDev.isRegular).toBe(true);
    expect(forcedInDev.isForcedRegularDev).toBe(true);
    expect(forcedInDev.columns).toBe(2);
    expect(forcedInDev.maxFormWidth).toBe(
      WINDOW_CLASS_BREAKPOINTS.maxFormWidthRegular
    );

    // Em produção (isDev=false), a flag forceRegularInDev é ignorada
    const ignoredInProd = resolveWindowClass({
      width: 390,
      height: 844,
      platformOS: 'ios',
      isDev: false,
      forceRegularInDev: true,
    });
    expect(ignoredInProd.sizeClass).toBe('compact');
    expect(ignoredInProd.isRegular).toBe(false);
    expect(ignoredInProd.isForcedRegularDev).toBe(false);
  });

  it('trata dimensões inválidas ou zeradas com segurança como compact', () => {
    const zeroDim = resolveWindowClass({
      width: 0,
      height: 0,
      platformOS: 'ios',
    });
    expect(zeroDim.sizeClass).toBe('compact');
    expect(zeroDim.width).toBe(0);
    expect(zeroDim.height).toBe(0);
  });
});
