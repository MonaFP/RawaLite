// src/main/db/migrations/index.ts
import type Database from 'better-sqlite3';

export interface Migration {
  version: number;
  name: string;
  up: (db: Database.Database) => void;
  down?: (db: Database.Database) => void;
}

// Import all migrations
import * as migration000 from './000_init.js';

export const migrations: Migration[] = [
  {
    version: 1,
    name: '000_init',
    up: migration000.up,
    down: migration000.down
  }
  // Add future migrations here:
  // {
  //   version: 2,
  //   name: '001_add_packages_table',
  //   up: migration001.up,
  //   down: migration001.down
  // }
];

export default migrations;