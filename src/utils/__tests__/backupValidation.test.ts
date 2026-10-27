import {
  CURRENT_BACKUP_VERSION,
  MAX_BACKUP_FILE_BYTES,
  validateBackupFileSize,
  validateBackupPayload,
} from '@/utils/backup';

describe('Validação estrita de backups do Clayfin (v1 e v2)', () => {
  const baseValidBackupV1 = {
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
        {
          id: 'cat-2',
          name: 'Salário',
          icon: 'Wallet',
          color: '#44B988',
          type: 'income',
          is_default: 1,
          created_at: '2026-10-26T12:00:00.000Z',
        },
      ],
      transactions: [
        {
          id: 'tx-1',
          category_id: 'cat-1',
          type: 'expense',
          amount_cents: 3500,
          description: 'Almoço executivo',
          date: '2026-10-26',
          created_at: '2026-10-26T12:00:00.000Z',
        },
      ],
      budgets: [
        {
          id: 'b-1',
          category_id: 'cat-1',
          month: '2026-10',
          limit_cents: 60000,
        },
      ],
      goals: [
        {
          id: 'goal-1',
          name: 'Reserva',
          icon: 'Shield',
          target_cents: 500000,
          deadline: '2026-12-31',
          created_at: '2026-10-26T12:00:00.000Z',
        },
      ],
      goal_contributions: [
        {
          id: 'gc-1',
          goal_id: 'goal-1',
          amount_cents: 10000,
          date: '2026-10-26',
          created_at: '2026-10-26T12:00:00.000Z',
        },
      ],
    },
  };

  const baseValidBackupV2 = {
    app: 'Clayfin',
    version: 2,
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
      recurring_rules: [
        {
          id: 'rule-1',
          category_id: 'cat-1',
          type: 'expense',
          amount_cents: 12000,
          description: 'Almoço Recorrente',
          frequency: 'monthly',
          day_of_month: 15,
          weekday: null,
          start_date: '2026-08-15',
          end_date: null,
          is_active: 1,
          created_at: '2026-08-01T10:00:00.000Z',
        },
      ],
      transactions: [
        {
          id: 'tx-1',
          category_id: 'cat-1',
          type: 'expense',
          amount_cents: 12000,
          description: 'Almoço Recorrente',
          date: '2026-08-15',
          created_at: '2026-08-15T12:00:00.000Z',
          recurring_rule_id: 'rule-1',
          occurrence_date: '2026-08-15',
        },
      ],
      budgets: [],
      goals: [],
      goal_contributions: [],
    },
  };

  it('aceita payload de backup versão 1 perfeitamente íntegro (retrocompatibilidade)', () => {
    const res = validateBackupPayload(baseValidBackupV1);
    expect(res.valid).toBe(true);
    expect(res.error).toBeUndefined();
    expect(res.payload?.version).toBe(1);
    expect(res.payload?.data.recurring_rules).toEqual([]);
  });

  it('aceita payload de backup versão 2 com recurring_rules e transações vinculadas', () => {
    const res = validateBackupPayload(baseValidBackupV2);
    expect(res.valid).toBe(true);
    expect(res.error).toBeUndefined();
    expect(res.payload?.version).toBe(CURRENT_BACKUP_VERSION);
    expect(res.payload?.data.recurring_rules).toHaveLength(1);
  });

  describe('Validação de versão', () => {
    it('rejeita backups com versão acima de 2 e orienta a atualizar o app', () => {
      const futureBackup = { ...baseValidBackupV2, version: 3 };
      const res = validateBackupPayload(futureBackup);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('mais recente do que a versão suportada');
      expect(res.error).toContain('atualize o Clayfin');
    });

    it('rejeita backups com versão 0 ou número inválido', () => {
      const invalidVersion = { ...baseValidBackupV2, version: 0 };
      const res = validateBackupPayload(invalidVersion);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('Versão de backup não suportada');
    });
  });

  describe('Validação do limite de tamanho de arquivo', () => {
    it('aprova arquivos com tamanho dentro do limite de 10 MB', () => {
      const check = validateBackupFileSize(2 * 1024 * 1024); // 2 MB
      expect(check.valid).toBe(true);
      expect(check.error).toBeUndefined();
    });

    it('rejeita arquivos que excedem o limite de 10 MB com mensagem explicativa em pt-BR', () => {
      const check = validateBackupFileSize(MAX_BACKUP_FILE_BYTES + 500000);
      expect(check.valid).toBe(false);
      expect(check.error).toContain('excede o limite máximo permitido de 10 MB');
    });
  });

  describe('Validação de integridade e unicidade da v2', () => {
    it('rejeita IDs duplicados em recurring_rules', () => {
      const dupRules = JSON.parse(JSON.stringify(baseValidBackupV2));
      dupRules.data.recurring_rules.push({
        ...dupRules.data.recurring_rules[0],
        description: 'Regra Clone',
      });
      const res = validateBackupPayload(dupRules);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('ID de regra recorrente duplicado no backup');
    });

    it('rejeita recurring_rule apontando para categoria inexistente', () => {
      const badRule = JSON.parse(JSON.stringify(baseValidBackupV2));
      badRule.data.recurring_rules[0].category_id = 'cat-inexistente';
      const res = validateBackupPayload(badRule);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('Regra recorrente "rule-1" faz referência a uma categoria inexistente');
    });

    it('rejeita transação apontando para recurring_rule inexistente', () => {
      const badTx = JSON.parse(JSON.stringify(baseValidBackupV2));
      badTx.data.transactions[0].recurring_rule_id = 'rule-inexistente';
      const res = validateBackupPayload(badTx);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('Transação "tx-1" faz referência a uma regra recorrente inexistente');
    });

    it('rejeita par (recurring_rule_id, occurrence_date) duplicado em transações', () => {
      const dupOcc = JSON.parse(JSON.stringify(baseValidBackupV2));
      dupOcc.data.transactions.push({
        ...dupOcc.data.transactions[0],
        id: 'tx-dup-occ',
      });
      const res = validateBackupPayload(dupOcc);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('Existe mais de uma transação no backup para a mesma regra');
    });

    it('rejeita frequency inválida em recurring_rule', () => {
      const badFreq = JSON.parse(JSON.stringify(baseValidBackupV2));
      badFreq.data.recurring_rules[0].frequency = 'daily'; // Inválido: apenas weekly/monthly/yearly
      const res = validateBackupPayload(badFreq);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('Formato de backup inválido');
    });
  });
});
