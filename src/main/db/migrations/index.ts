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
import * as migration028 from './028_add_navigation_system';
import * as migration029 from './029_add_focus_mode_system';
import * as migration030 from './030_fix_navigation_mode_values';
import * as migration031 from './031_increase_header_height_limit';
import * as migration032 from './032_increase_header_height_to_220px';
import * as migration033 from './033_normalize_header_navigation_height';
import * as migration034 from './034_add_navigation_mode_settings';
import * as migration035 from './035_add_focus_mode_preferences';
import * as migration036 from './036_add_theme_overrides';
import * as migration037 from './037_centralized_configuration_architecture';
import * as migration038 from './038_correct_header_heights_final';
import * as migration039 from './039_fix_full_sidebar_header_height';
import * as migration040 from './040_fix_navigation_preferences_constraint';
import * as migration041 from './041_add_footer_content_preferences';
import * as migration042 from './042_user_navigation_mode_settings';
import * as migration043 from './043_convert_legacy_navigation_modes';
import * as migration044 from './044_cleanup_navigation_modes';
import * as migration045 from './045_enforce_ki_safe_navigation';
import * as migration046 from './046_add_navigation_mode_history';
import * as migration047 from './047_add_navigation_mode_history_view';

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
    version: 12,
    name: '011_extend_offer_line_items',
    up: migration011.up,
    down: migration011.down
  },
  {
    version: 13,
    name: '012_add_tax_office_field',
    up: migration012.up,
    down: migration012.down
  },
  {
    version: 14,
    name: '013_add_discount_system',
    up: migration013.up,
    down: migration013.down
  },
  {
    version: 15,
    name: '014_add_item_origin_system',
    up: migration014.up,
    down: migration014.down
  },
  {
    version: 16,
    name: '015_add_status_versioning',
    up: migration015.up,
    down: migration015.down
  },
  {
    version: 17,
    name: '016_add_offer_attachments',
    up: migration016.up,
    down: migration016.down
  },
  {
    version: 18,
    name: '017_add_update_history',
    up: migration017.up,
    down: migration017.down
  },
  {
    version: 19,
    name: '018_add_auto_update_preferences',
    up: migration018.up,
    down: migration018.down
  },
  {
    version: 20,
    name: '019_mini_fix_delivery',
    up: migration019.up,
    down: migration019.down
  },
  {
    version: 21,
    name: '020_cleanup_v1041_settings',
    up: migration020.up,
    down: migration020.down
  },
  {
    version: 22,
    name: '021_unify_package_unit_price',
    up: migration021.up,
    down: migration021.down
  },
  {
    version: 23,
    name: '022_add_invoice_attachments',
    up: migration022.up,
    down: migration022.down
  },
  {
    version: 24,
    name: '023_add_line_item_hierarchy_level',
    up: migration023.up,
    down: migration023.down
  },
  {
    version: 25,
    name: '024_restore_package_line_item_metadata',
    up: migration024.up,
    down: migration024.down
  },
  {
    version: 26,
    name: '025_add_price_display_mode',
    up: migration025.up,
    down: migration025.down
  },
  {
    version: 27,
    name: '026_add_price_display_mode_to_packages',
    up: migration026.up,
    down: migration026.down
  },
  {
    version: 28,
    name: '027_add_theme_system',
    up: migration027.up,
    down: migration027.down
  },
  {
    version: 29,
    name: '028_add_navigation_system',
    up: migration028.up,
    down: migration028.down
  },
  {
    version: 30,
    name: '029_add_focus_mode_system',
    up: migration029.up,
    down: migration029.down
  },
  {
    version: 31,
    name: '030_fix_navigation_mode_values',
    up: migration030.up,
    down: migration030.down
  },
  {
    version: 32,
    name: '031_increase_header_height_limit',
    up: migration031.up,
    down: migration031.down
  },
  {
    version: 33,
    name: '032_increase_header_height_to_220px',
    up: migration032.up,
    down: migration032.down
  },
  {
    version: 34,
    name: '033_normalize_header_navigation_height',
    up: migration033.migrate033,
    down: () => {} // No rollback needed - height normalization is forward-compatible
  },
  {
    version: 35,
    name: '034_add_navigation_mode_settings',
    up: migration034.up,
    down: migration034.down
  },
  {
    version: 36,
    name: '035_add_focus_mode_preferences',
    up: migration035.up,
    down: migration035.down
  },
  {
    version: 37,
    name: '036_add_theme_overrides',
    up: migration036.up,
    down: migration036.down
  },
  {
    version: 38,
    name: '037_centralized_configuration_architecture',
    up: migration037.up,
    down: migration037.down
  },
  {
    version: 39,
    name: '038_correct_header_heights_final',
    up: migration038.up,
    down: migration038.down
  },
  {
    version: 40,
    name: '039_fix_full_sidebar_header_height',
    up: migration039.up,
    down: migration039.down
  },
  {
    version: 41,
    name: '040_fix_navigation_preferences_constraint',
    up: migration040.up,
    down: migration040.down
  },
  {
    version: 42,
    name: '041_add_footer_content_preferences',
    up: migration041.up,
    down: migration041.down
  },
  {
    version: 43,
    name: '042_user_navigation_mode_settings',
    up: migration042.up,
    down: migration042.down
  },
  {
    version: 44,
    name: '043_convert_legacy_navigation_modes',
    up: migration043.up,
    down: migration043.down
  },
  {
    version: 45,
    name: '044_cleanup_navigation_modes',
    up: migration044.up,
    down: migration044.down
  },
  {
    version: 46,
    name: '045_enforce_ki_safe_navigation',
    up: migration045.up,
    down: migration045.down
  },
  {
    version: 47,
    name: '046_add_navigation_mode_history',
    up: migration046.up,
    down: migration046.down
  },
  {
    version: 48,
    name: '047_add_navigation_mode_history_view',
    up: migration047.up,
    down: migration047.down
  }
];

export default migrations;
