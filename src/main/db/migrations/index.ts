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
import * as migration001 from './001_settings_restructure.js';

export const migrations: Migration[] = [
  {
    version: 1,
    name: '000_init',
    up: migration000.up,
    down: migration000.down
  },
  {
    version: 2,
    name: '001_settings_restructure',
    up: migration001.up,
    down: migration001.down
  }
  // Add future migrations here:
  // {
  //   version: 3,
  //   name: '002_add_packages_table',
  //   up: migration002.up,
  //   down: migration002.down
  // }
];

export default migrations;