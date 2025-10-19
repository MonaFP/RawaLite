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
import * as migration004 from './004_gap_placeholder';
import * as migration005 from './005_add_packages_numbering';
import * as migration006 from './006_fix_missing_circles';
import * as migration007 from './007_fix_packages_invoice_schema';
import * as migration008 from './008_fix_offers_schema';
import * as migration009 from './009_add_timesheets';
import * as migration010 from './010_add_timesheets_numbering';
import * as migration011 from './011_extend_offer_line_items';
import * as migration012 from './012_add_tax_office_field';
import * as migration013 from './013_add_discount_system';
import * as migration014 from './014_add_item_origin_system';
import * as migration015 from './015_add_status_versioning';
import * as migration016 from './016_add_offer_attachments';
import * as migration017 from './017_add_update_history';
import * as migration018 from './018_add_auto_update_preferences';
import * as migration019 from './019_mini_fix_delivery';
import * as migration020 from './020_cleanup_v1041_settings';
import * as migration021 from './021_unify_package_unit_price';
import * as migration022 from './022_add_invoice_attachments';
import * as migration023 from './023_add_line_item_hierarchy_level';
import * as migration024 from './024_restore_package_line_item_metadata';
import * as migration025 from './025_add_price_display_mode';
import * as migration026 from './026_add_price_display_mode_to_packages';
import * as migration027 from './027_add_theme_system';

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
    name: '004_gap_placeholder',
    up: migration004.up,
    down: migration004.down
  },
  {
    version: 6,
    name: '005_add_packages_numbering',
    up: migration005.up,
    down: migration005.down
  },
  {
    version: 7,
    name: '006_fix_missing_circles',
    up: migration006.up,
    down: migration006.down
  },
  {
    version: 8,
    name: '007_fix_packages_invoice_schema',
    up: migration007.up,
    down: migration007.down
  },
  {
    version: 9,
    name: '008_fix_offers_schema',
    up: migration008.up,
    down: migration008.down
  },
  {
    version: 10,
    name: '009_add_timesheets',
    up: migration009.up,
    down: migration009.down
  },
  {
    version: 11,
    name: '010_add_timesheets_numbering',
    up: migration010.up,
    down: migration010.down
  },
  {
    version: 11,
    name: '011_extend_offer_line_items',
    up: migration011.up,
    down: migration011.down
  },
  {
    version: 12,
    name: '012_add_tax_office_field',
    up: migration012.up,
    down: migration012.down
  },
  {
    version: 13,
    name: '013_add_discount_system',
    up: migration013.up,
    down: migration013.down
  },
  {
    version: 14,
    name: '014_add_item_origin_system',
    up: migration014.up,
    down: migration014.down
  },
  {
    version: 15,
    name: '015_add_status_versioning',
    up: migration015.up,
    down: migration015.down
  },
  {
    version: 16,
    name: '016_add_offer_attachments',
    up: migration016.up,
    down: migration016.down
  },
  {
    version: 17,
    name: '017_add_update_history',
    up: migration017.up,
    down: migration017.down
  },
  {
    version: 18,
    name: '018_add_auto_update_preferences',
    up: migration018.up,
    down: migration018.down
  },
  {
    version: 19,
    name: '019_mini_fix_delivery',
    up: migration019.up,
    down: migration019.down
  },
  {
    version: 20,
    name: '020_cleanup_v1041_settings',
    up: migration020.up,
    down: migration020.down
  },
  {
    version: 21,
    name: '021_unify_package_unit_price',
    up: migration021.up,
    down: migration021.down
  },
  {
    version: 22,
    name: '022_add_invoice_attachments',
    up: migration022.up,
    down: migration022.down
  },
  {
    version: 23,
    name: '023_add_line_item_hierarchy_level',
    up: migration023.up,
    down: migration023.down
  },
  {
    version: 24,
    name: '024_restore_package_line_item_metadata',
    up: migration024.up,
    down: migration024.down
  },
  {
    version: 25,
    name: '025_add_price_display_mode',
    up: migration025.up,
    down: migration025.down
  },
  {
    version: 26,
    name: '026_add_price_display_mode_to_packages',
    up: migration026.up,
    down: migration026.down
  },
  {
    version: 27,
    name: '027_add_theme_system',
    up: migration027.up,
    down: migration027.down
  }
];

export default migrations;
