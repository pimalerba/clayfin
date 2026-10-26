import {
  CURRENT_BACKUP_VERSION,
  MAX_BACKUP_FILE_BYTES,
  validateBackupFileSize,
  validateBackupPayload,
} from '@/utils/backup';

describe('Validação estrita de backups do Clayfin', () => {
  const baseValidBackup = {
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

  it('aceita um payload de backup perfeitamente íntegro', () => {
    const res = validateBackupPayload(baseValidBackup);
    expect(res.valid).toBe(true);
    expect(res.error).toBeUndefined();
    expect(res.payload?.version).toBe(CURRENT_BACKUP_VERSION);
  });

  describe('Validação de versão', () => {
    it('rejeita backups com versão futura e orienta a atualizar o app', () => {
      const futureBackup = { ...baseValidBackup, version: 2 };
      const res = validateBackupPayload(futureBackup);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('mais recente do que a versão suportada');
      expect(res.error).toContain('atualize o Clayfin');
    });

    it('rejeita backups com versão 0 ou número inválido', () => {
      const invalidVersion = { ...baseValidBackup, version: 0 };
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

  describe('Validação de duplicidade de IDs', () => {
    it('rejeita IDs duplicados na coleção de categorias', () => {
      const duplicateCats = JSON.parse(JSON.stringify(baseValidBackup));
      duplicateCats.data.categories.push({
        ...duplicateCats.data.categories[0],
        name: 'Categoria Clone',
      });
      const res = validateBackupPayload(duplicateCats);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('ID de categoria duplicado no backup');
    });

    it('rejeita IDs duplicados na coleção de transações', () => {
      const duplicateTxs = JSON.parse(JSON.stringify(baseValidBackup));
      duplicateTxs.data.transactions.push({
        ...duplicateTxs.data.transactions[0],
        description: 'Transação Clone',
      });
      const res = validateBackupPayload(duplicateTxs);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('ID de transação duplicado no backup');
    });

    it('rejeita IDs duplicados na coleção de orçamentos', () => {
      const duplicateBudgets = JSON.parse(JSON.stringify(baseValidBackup));
      duplicateBudgets.data.budgets.push({
        ...duplicateBudgets.data.budgets[0],
        month: '2026-11',
      });
      const res = validateBackupPayload(duplicateBudgets);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('ID de orçamento duplicado no backup');
    });

    it('rejeita IDs duplicados na coleção de metas', () => {
      const duplicateGoals = JSON.parse(JSON.stringify(baseValidBackup));
      duplicateGoals.data.goals.push({
        ...duplicateGoals.data.goals[0],
        name: 'Meta Clone',
      });
      const res = validateBackupPayload(duplicateGoals);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('ID de meta duplicado no backup');
    });

    it('rejeita IDs duplicados na coleção de movimentações de meta', () => {
      const duplicateContribs = JSON.parse(JSON.stringify(baseValidBackup));
      duplicateContribs.data.goal_contributions.push({
        ...duplicateContribs.data.goal_contributions[0],
        amount_cents: 5000,
      });
      const res = validateBackupPayload(duplicateContribs);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('ID de movimentação de meta duplicado no backup');
    });
  });

  describe('Validação de integridade referencial', () => {
    it('rejeita transação apontando para categoria inexistente', () => {
      const badTx = JSON.parse(JSON.stringify(baseValidBackup));
      badTx.data.transactions[0].category_id = 'cat-inexistente';
      const res = validateBackupPayload(badTx);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('categoria inexistente no backup');
    });

    it('rejeita orçamento apontando para categoria inexistente', () => {
      const badBudget = JSON.parse(JSON.stringify(baseValidBackup));
      badBudget.data.budgets[0].category_id = 'cat-inexistente';
      const res = validateBackupPayload(badBudget);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('categoria inexistente no backup');
    });

    it('rejeita movimentação apontando para meta inexistente', () => {
      const badContrib = JSON.parse(JSON.stringify(baseValidBackup));
      badContrib.data.goal_contributions[0].goal_id = 'goal-fantasma';
      const res = validateBackupPayload(badContrib);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('meta inexistente no backup');
    });

    it('rejeita orçamentos duplicados para a mesma categoria e mesmo mês', () => {
      const dupBudgetMonth = JSON.parse(JSON.stringify(baseValidBackup));
      dupBudgetMonth.data.budgets.push({
        id: 'b-2',
        category_id: 'cat-1',
        month: '2026-10', // Mesmo mês e mesma categoria
        limit_cents: 80000,
      });
      const res = validateBackupPayload(dupBudgetMonth);
      expect(res.valid).toBe(false);
      expect(res.error).toContain(
        'Existe mais de um orçamento definido para a mesma categoria'
      );
    });
  });
});
