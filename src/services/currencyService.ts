/**
 * Universal Business Platform - Currencies Service & Repository
 * Handles Multi-Currency, Single Base Currency constraint, and decimal formatting.
 */

import { Currency } from '../types/entities';
import { dbEngine } from '../db/databaseEngine';
import { toUtcIsoString } from '../utils/datetime';
import { createAppError } from '../utils/logger';

export class CurrencyService {
  public static getAll(): Currency[] {
    return dbEngine.getState().currencies;
  }

  public static getBaseCurrency(): Currency {
    const base = dbEngine.getState().currencies.find((c) => c.is_base);
    if (!base) {
      return dbEngine.getState().currencies[0];
    }
    return base;
  }

  public static create(
    data: Omit<Currency, 'id' | 'created_at' | 'updated_at' | 'version'>,
    actorId: string
  ): Currency {
    const state = dbEngine.getState();
    const existingCode = state.currencies.find(
      (c) => c.currency_code.toUpperCase() === data.currency_code.toUpperCase()
    );
    if (existingCode) throw createAppError(400, 'كود العملة مستخدم بالفعل', 'Currency code already exists');

    // If marked as base, ensure no other currency is base
    if (data.is_base) {
      state.currencies.forEach((c) => (c.is_base = false));
    }

    const newCurrency: Currency = {
      ...data,
      id: `c-${Date.now()}`,
      currency_code: data.currency_code.toUpperCase(),
      created_at: toUtcIsoString(),
      updated_at: toUtcIsoString(),
      version: 1,
    };

    state.currencies.push(newCurrency);
    dbEngine.saveState();
    dbEngine.logAudit('currencies', newCurrency.id, 'INSERT', null, newCurrency, actorId);
    return newCurrency;
  }

  public static update(currency: Currency, actorId: string): Currency {
    const state = dbEngine.getState();
    const existing = state.currencies.find((c) => c.id === currency.id);
    if (!existing) throw createAppError(404, 'العملة غير موجودة', 'Currency not found');

    dbEngine.verifyConcurrency(existing.version, currency.version);

    if (currency.is_base && !existing.is_base) {
      state.currencies.forEach((c) => {
        if (c.id !== currency.id) c.is_base = false;
      });
    } else if (!currency.is_base && existing.is_base) {
      throw createAppError(
        400,
        'يجب أن تحتوي المنظومة على عملة أساسية واحدة دائماً',
        'System must always have one base currency'
      );
    }

    const oldData = { ...existing };
    existing.currency_code = currency.currency_code.toUpperCase();
    existing.name_ar = currency.name_ar;
    existing.name_en = currency.name_en;
    existing.symbol = currency.symbol;
    existing.decimals = currency.decimals;
    existing.is_base = currency.is_base;
    existing.updated_at = toUtcIsoString();
    existing.version += 1;

    dbEngine.saveState();
    dbEngine.logAudit('currencies', existing.id, 'UPDATE', oldData, existing, actorId);
    return { ...existing };
  }

  public static delete(id: string, actorId: string): void {
    const state = dbEngine.getState();
    const index = state.currencies.findIndex((c) => c.id === id);
    if (index === -1) throw createAppError(404, 'العملة غير موجودة', 'Currency not found');

    const currency = state.currencies[index];
    if (currency.is_base) {
      throw createAppError(400, 'لا يمكن حذف العملة الأساسية للنظام', 'Cannot delete base currency');
    }

    state.currencies.splice(index, 1);
    dbEngine.saveState();
    dbEngine.logAudit('currencies', id, 'DELETE', currency, null, actorId);
  }
}
