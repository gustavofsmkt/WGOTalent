import { describe, it, expect } from 'vitest';
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { isNull, and, eq, type SQL } from 'drizzle-orm';
import { notDeleted } from './query-helpers';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const testTable = pgTable('test', {
  id: text('id').primaryKey(),
  deletedAt: timestamp('deleted_at'),
});

const client = postgres('postgres://postgres:postgres@localhost:5432/wgotalent');
const db = drizzle(client);

describe('query-helpers', () => {
  describe('notDeleted', () => {
    it('appends isNull(deletedAt) to a basic query', () => {
      const qb = db.select().from(testTable);
      const query = notDeleted(qb, testTable);
      
      const sql = query.toSQL().sql;
      expect(sql).toContain('"test"."deleted_at" is null');
      expect(sql).not.toContain('and');
    });

    it('combines isNull(deletedAt) with additional conditions', () => {
      const qb = db.select().from(testTable);
      const query = notDeleted(qb, testTable, eq(testTable.id, '123'));
      
      const sql = query.toSQL().sql;
      expect(sql).toContain('"test"."deleted_at" is null');
      expect(sql).toContain('and');
      expect(sql).toContain('"test"."id" = $1');
    });

    it('ignores undefined conditions and only applies isNull(deletedAt)', () => {
      const qb = db.select().from(testTable);
      const condition: SQL | undefined = undefined;
      const query = notDeleted(qb, testTable, condition);
      
      const sql = query.toSQL().sql;
      expect(sql).toContain('"test"."deleted_at" is null');
      expect(sql).not.toContain('and');
    });
  });
});
