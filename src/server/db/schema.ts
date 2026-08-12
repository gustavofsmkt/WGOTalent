import { pgTableCreator } from "drizzle-orm/pg-core";

/**
 * Multi-project schema feature of Drizzle ORM.
 * Prefix all tables with `wgotalent_`.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `wgotalent_${name}`);

