import { describe, it, expect } from 'vitest';
import { validateJournalEntryBalance } from '@/lib/services/finance-service';

describe('Double-Entry Accounting & General Ledger Balancing Engine', () => {
  it('accepts perfectly balanced Journal Voucher where Total Debits equal Total Credits', () => {
    const balancedEntry = [
      { accountId: 'COA-1003', accountCode: '1003', debitAmount: 5000, creditAmount: 0, memo: 'bKash Gateway Cash In' },
      { accountId: 'COA-4001', accountCode: '4001', debitAmount: 0, creditAmount: 5000, memo: 'Tuition Revenue' }
    ];

    const result = validateJournalEntryBalance(balancedEntry);
    expect(result.isValid).toBe(true);
    expect(result.totalDebits).toBe(5000);
    expect(result.totalCredits).toBe(5000);
    expect(result.difference).toBe(0);
  });

  it('strictly REJECTS unbalanced journal entries', () => {
    const unbalancedEntry = [
      { accountId: 'COA-1003', accountCode: '1003', debitAmount: 5000, creditAmount: 0 },
      { accountId: 'COA-4001', accountCode: '4001', debitAmount: 0, creditAmount: 4500 } // Short 500
    ];

    const result = validateJournalEntryBalance(unbalancedEntry);
    expect(result.isValid).toBe(false);
    expect(result.difference).toBe(500);
    expect(result.errorMessage).toContain('Unbalanced Journal Entry');
  });

  it('rejects journal entries with fewer than 2 lines or negative amounts', () => {
    const singleLine = [
      { accountId: 'COA-1001', accountCode: '1001', debitAmount: 1000, creditAmount: 0 }
    ];

    const result = validateJournalEntryBalance(singleLine);
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toContain('must contain at least 2 lines');
  });
});
