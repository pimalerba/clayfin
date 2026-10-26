import {
  formatCentsToBRL,
  parseCurrencyInputToCents,
} from '@/utils/currency';
import {
  calculateBudgetProgress,
  calculateGoalProgress,
  validateGoalTransfer,
} from '@/utils/progress';
import { validateBackupPayload } from '@/utils/backup';

describe('Conversão e formatação de moeda (centavos <-> BRL)', () => {
  it('formata centavos inteiros para R$ em pt-BR', () => {
    expect(formatCentsToBRL(0).replace(/\s/g, ' ')).toBe('R$ 0,00');
    expect(formatCentsToBRL(1250).replace(/\s/g, ' ')).toBe('R$ 12,50');
    expect(formatCentsToBRL(123456).replace(/\s/g, ' ')).toBe('R$ 1.234,56');
  });

  it('converte entrada de texto (máscara RTL) para centavos inteiros', () => {
    expect(parseCurrencyInputToCents('')).toBe(0);
    expect(parseCurrencyInputToCents('R$ 0,05')).toBe(5);
    expect(parseCurrencyInputToCents('R$ 1.234,56')).toBe(123456);
    expect(parseCurrencyInputToCents('9990')).toBe(9990);
  });
});

describe('Cálculo de progresso de orçamento mensal', () => {
  it('retorna estado normal abaixo de 80%', () => {
    const res = calculateBudgetProgress(5000, 10000);
    expect(res.percentage).toBe(50);
    expect(res.alertLevel).toBe('normal');
    expect(res.isOver80).toBe(false);
    expect(res.isOver100).toBe(false);
    expect(res.remainingCents).toBe(5000);
  });

  it('alerta warning quando atinge ou passa de 80% mas abaixo de 100%', () => {
    const res = calculateBudgetProgress(8500, 10000);
    expect(res.percentage).toBe(85);
    expect(res.alertLevel).toBe('warning');
    expect(res.isOver80).toBe(true);
    expect(res.isOver100).toBe(false);
  });

  it('alerta exceeded quando atinge ou ultrapassa 100%', () => {
    const res = calculateBudgetProgress(12000, 10000);
    expect(res.percentage).toBe(120);
    expect(res.clampedPercentage).toBe(100);
    expect(res.alertLevel).toBe('exceeded');
    expect(res.isOver80).toBe(true);
    expect(res.isOver100).toBe(true);
    expect(res.remainingCents).toBe(-2000);
  });
});

describe('Cálculo de progresso de metas / cofrinhos', () => {
  it('calcula percentual e valor restante da meta', () => {
    const res = calculateGoalProgress(25000, 100000);
    expect(res.percentage).toBe(25);
    expect(res.remainingCents).toBe(75000);
    expect(res.isCompleted).toBe(false);
  });

  it('marca meta como concluída quando atinge 100% ou mais', () => {
    const res = calculateGoalProgress(110000, 100000);
    expect(res.percentage).toBe(110);
    expect(res.clampedPercentage).toBe(100);
    expect(res.remainingCents).toBe(0);
    expect(res.isCompleted).toBe(true);
  });

  it('permite guardar no cofrinho apenas até o saldo disponível em conta e desconta o valor', () => {
    // Tem R$ 50,00 (5000 centavos) em conta e tenta adicionar R$ 100,00 (10000 centavos) -> bloqueado
    const blocked = validateGoalTransfer({
      mode: 'deposit',
      amountCents: 10000,
      availableAccountCents: 5000,
      currentGoalCents: 0,
    });
    expect(blocked.allowed).toBe(false);

    // Tem R$ 50,00 em conta e guarda R$ 40,00 -> sobra R$ 10,00 na conta e R$ 40,00 no cofrinho
    const okDeposit = validateGoalTransfer({
      mode: 'deposit',
      amountCents: 4000,
      availableAccountCents: 5000,
      currentGoalCents: 0,
    });
    expect(okDeposit.allowed).toBe(true);
    expect(okDeposit.newAccountBalanceCents).toBe(1000);
    expect(okDeposit.newGoalBalanceCents).toBe(4000);
  });

  it('permite retirar do cofrinho apenas até o valor investido e devolve ao saldo em conta', () => {
    const blockedWithdraw = validateGoalTransfer({
      mode: 'withdraw',
      amountCents: 5000,
      availableAccountCents: 1000,
      currentGoalCents: 4000,
    });
    expect(blockedWithdraw.allowed).toBe(false);

    const okWithdraw = validateGoalTransfer({
      mode: 'withdraw',
      amountCents: 1500,
      availableAccountCents: 1000,
      currentGoalCents: 4000,
    });
    expect(okWithdraw.allowed).toBe(true);
    expect(okWithdraw.newAccountBalanceCents).toBe(2500);
    expect(okWithdraw.newGoalBalanceCents).toBe(2500);
  });
});

describe('Validação do formato de backup JSON', () => {
  const validBackup = {
    app: 'Clayfin',
    version: 1,
    exported_at: '2026-10-26T12:00:00.000Z',
    data: {
      categories: [
        {
          id: 'cat-1',
          name: 'Alimentação',
          icon: 'Utensils',
          color: '#F07167',
          type: 'expense',
          is_default: 1,
          created_at: '2026-10-26T12:00:00.000Z',
        },
      ],
      transactions: [
        {
          id: 'tx-1',
          category_id: 'cat-1',
          type: 'expense',
          amount_cents: 4590,
          description: 'Almoço',
          date: '2026-10-26',
          created_at: '2026-10-26T12:00:00.000Z',
        },
      ],
      budgets: [],
      goals: [],
      goal_contributions: [],
    },
  };

  it('aceita um payload JSON válido do Clayfin', () => {
    const result = validateBackupPayload(JSON.stringify(validBackup));
    expect(result.valid).toBe(true);
    expect(result.payload?.data.transactions).toHaveLength(1);
  });

  it('rejeita JSON malformado ou de outro app', () => {
    expect(validateBackupPayload('{ invalid json').valid).toBe(false);
    expect(
      validateBackupPayload({ ...validBackup, app: 'OutroApp' }).valid
    ).toBe(false);
  });

  it('rejeita transação órfã sem categoria correspondente no backup', () => {
    const orphanBackup = {
      ...validBackup,
      data: {
        ...validBackup.data,
        categories: [],
      },
    };
    const result = validateBackupPayload(orphanBackup);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('categoria inexistente');
  });
});
