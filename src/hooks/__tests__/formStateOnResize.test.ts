/* eslint-disable @typescript-eslint/no-require-imports */
import type {
  resolveWindowClass as ResolveWindowClassFn,
  WINDOW_CLASS_BREAKPOINTS as WindowClassBreakpointsType,
} from '@/hooks/useWindowClass';

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  useWindowDimensions: jest.fn(() => ({ width: 393, height: 852 })),
}));

const { resolveWindowClass, WINDOW_CLASS_BREAKPOINTS } = require('@/hooks/useWindowClass') as {
  resolveWindowClass: typeof ResolveWindowClassFn;
  WINDOW_CLASS_BREAKPOINTS: typeof WindowClassBreakpointsType;
};

describe('Resiliência dos formulários em janelas adaptativas (Duo / Split View)', () => {
  it('dimensiona a largura máxima dos formulários somente em janela regular', () => {
    // 1. iPhone compacto (dobrado / 393pt)
    const compactWindow = resolveWindowClass({
      width: 393,
      height: 852,
      platformOS: 'ios',
    });
    expect(compactWindow.isCompact).toBe(true);
    expect(compactWindow.maxFormWidth).toBeUndefined();

    // 2. iPhone Duo aberto (regular / 720pt)
    const regularWindow = resolveWindowClass({
      width: 720,
      height: 840,
      platformOS: 'ios',
    });
    expect(regularWindow.isRegular).toBe(true);
    expect(regularWindow.maxFormWidth).toBe(
      WINDOW_CLASS_BREAKPOINTS.maxFormWidthRegular
    );
    expect(regularWindow.maxFormWidth).toBe(560);
  });

  it('valida que transições de layout mantêm integridade de estado e propriedades dimensionais', () => {
    // Simula a transição contínua de largura durante a abertura/fechamento do dobrável
    const steps = [
      { width: 393, expectedRegular: false, expectedFormWidth: undefined },
      { width: 500, expectedRegular: false, expectedFormWidth: undefined },
      { width: 599, expectedRegular: false, expectedFormWidth: undefined },
      { width: 600, expectedRegular: true, expectedFormWidth: 560 },
      { width: 720, expectedRegular: true, expectedFormWidth: 560 },
      { width: 1024, expectedRegular: true, expectedFormWidth: 560 },
      { width: 393, expectedRegular: false, expectedFormWidth: undefined },
    ];

    for (const step of steps) {
      const windowInfo = resolveWindowClass({
        width: step.width,
        height: 800,
        platformOS: 'ios',
      });

      expect(windowInfo.isRegular).toBe(step.expectedRegular);
      expect(windowInfo.maxFormWidth).toBe(step.expectedFormWidth);
    }
  });
});
