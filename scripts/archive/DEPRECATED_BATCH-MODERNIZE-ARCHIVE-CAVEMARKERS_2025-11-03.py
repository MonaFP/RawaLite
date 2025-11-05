#!/usr/bin/env python3
"""
MODERNIZE_ARCHIVE_CAVEMARKERS.py
Modernizes 44 CAVE-marker files in docs/09-archive/ to modern KI-AUTO-DETECTION SYSTEM headers
"""

import glob
import re
from pathlib import Path

# Pattern to replace
OLD_PATTERN = r'^CAVE:\s+\*\*🤖 KI-AUTO-DETECTION SYSTEM NEEDED\. KI HAS TO READ HANDBOOK FIRST\*\*'

# Modern replacement header
MODERN_HEADER = '''> **🤖 KI-AUTO-DETECTION SYSTEM:**
> - **AKTUELLER STATUS:** KNOWLEDGE_ONLY (Archived Historical Reference)
> - **TEMPLATE-QUELLE:** 06-handbook/TEMPLATE/VALIDATED_TEMPLATE-LESSONS-LEARNED_2025-10-26.md
> - **AUTO-UPDATE:** Bei ähnlichen Problemen als Referenz nutzen
> - **STATUS-KEYWORDS:** Erkannt durch Archive, DEPRECATED, Historical Reference'''

def modernize_file(filepath):
    """Modernize a single file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check if CAVE pattern exists
        if not re.search(OLD_PATTERN, content, re.MULTILINE):
            return False
        
        # Replace CAVE with modern header
        new_content = re.sub(OLD_PATTERN, MODERN_HEADER, content, count=1, flags=re.MULTILINE)
        
        # Write back
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        return True
    except Exception as e:
        print(f"❌ Error processing {filepath}: {e}")
        return False

# Process all archive files
print("🔧 MODERNIZING 44 CAVE-MARKER FILES IN docs/09-archive/")
print("=" * 70)

all_patterns = [
    "docs/09-archive/INDEX.md",
    "docs/09-archive/COMPLETED_REPORT-*.md",
    "docs/09-archive/COMPLETED_PLAN-*.md",
    "docs/09-archive/deprecated/INDEX.md",
    "docs/09-archive/deprecated/PLAN_*.md",
    "docs/09-archive/deprecated/DEPRECATED_*.md",
]

total_updated = 0
total_skipped = 0

for pattern in all_patterns:
    files = glob.glob(pattern)
    
    for filepath in files:
        if modernize_file(filepath):
            total_updated += 1
            print(f"✅ {Path(filepath).name}")
        else:
            total_skipped += 1

print("\n" + "=" * 70)
print(f"📊 RESULTS:")
print(f"✅ Updated: {total_updated} files")
print(f"⏭️  Skipped: {total_skipped} files (already modern or no CAVE-marker)")
print(f"🎯 Total: {total_updated + total_skipped} files processed")
print("\n✅ MODERNIZATION COMPLETE!")
print("🔍 Verify: grep -r 'CAVE:' docs/09-archive/ → should return 0 results")
