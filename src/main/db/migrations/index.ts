// src/main/db/migrations/index.ts
import type Database from 'better-sqlite3';

export interface Migration {
  version: number;
  name: string;
  up: (db: Database.Database) => void;
  down?: (db: Database.Database) => void;
}

// Import all migrations
import * as migration000 from './000_init';
import * as migration001 from './001_settings_restructure';
import * as migration002 from './002_customers_schema_fix';
import * as migration003 from './003_fix_settings_schema';
import * as migration005 from './005_add_packages_numbering';
import * as migration006 from './006_fix_missing_circles';
import * as migration007 from './007_fix_packages_invoice_schema';
import * as migration008 from './008_fix_offers_schema';

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
  },
  {
    version: 3,
    name: '002_customers_schema_fix',
    up: migration002.up,
    down: migration002.down
  },
  {
    version: 4,
    name: '003_fix_settings_schema',
    up: migration003.up,
    down: migration003.down
  },
  {
    version: 5,
    name: '005_add_packages_numbering',
    up: migration005.up,
    down: migration005.down
  },
  {
    version: 6,
    name: '006_fix_missing_circles',
    up: migration006.up,
    down: migration006.down
  },
  {
    version: 7,
    name: '007_fix_packages_invoice_schema',
    up: migration007.up,
    down: migration007.down
  },
  {
    version: 8,
    name: '008_fix_offers_schema',
    up: migration008.up,
    down: migration008.down
  }
  // Add future migrations here:
  // {
  //   version: 9,
  //   name: '009_new_migration',
  //   up: migration009.up,
  //   down: migration009.down
  // }
];

export default migrations;