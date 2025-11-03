#!/usr/bin/env python3
"""
MODERNIZE_ARCHIVE_TEMPLATES.py
Batch-update CAVE-marker templates to modern KI-AUTO-DETECTION SYSTEM format
"""
import os
import glob
from pathlib import Path

CAVE_PATTERN = "CAVE:  **🤖 KI-AUTO-DETECTION SYSTEM NEEDED. KI HAS TO READ HANDBOOK FIRST**"
MODERN_HEADER = """> **🤖 KI-AUTO-DETECTION SYSTEM:**
> - **AKTUELLER STATUS:** KNOWLEDGE_ONLY (Archived Historical Reference)
> - **TEMPLATE-QUELLE:** 06-handbook/TEMPLATE/VALIDATED_TEMPLATE-LESSONS-LEARNED_2025-10-26.md
> - **AUTO-UPDATE:** Bei ähnlichen Problemen als Referenz nutzen
> - **STATUS-KEYWORDS:** Erkannt durch "LESSON_FIX", "Knowledge Base", "Historical Reference\"""

def modernize_file(filepath):
    """Modernize single file template"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        if CAVE_PATTERN not in content:
            return None  # No CAVE-marker found
        
        # Replace CAVE-marker with modern header
        new_content = content.replace(CAVE_PATTERN, MODERN_HEADER)
        
        # Write back
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        return True  # Success
    except Exception as e:
        print(f"❌ ERROR {os.path.basename(filepath)}: {e}")
        return False

def main():
    print("\n🔄 BATCH MODERNIZATION: Archive Templates")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
    
    success_count = 0
    skip_count = 0
    fail_count = 0
    
    # Get all LESSON_FIX files
    lesson_files = glob.glob("docs/09-archive/Knowledge/LESSON_FIX/*.md")
    
    for filepath in lesson_files:
        result = modernize_file(filepath)
        filename = os.path.basename(filepath)
        
        if result is True:
            print(f"✅ {filename}")
            success_count += 1
        elif result is False:
            print(f"❌ {filename}")
            fail_count += 1
        else:
            skip_count += 1
    
    # Get KNOWLEDGE_ONLY files
    knowledge_files = glob.glob("docs/09-archive/Knowledge/KNOWLEDGE_ONLY*.md")
    for filepath in knowledge_files:
        result = modernize_file(filepath)
        filename = os.path.basename(filepath)
        
        if result is True:
            print(f"✅ {filename}")
            success_count += 1
        elif result is False:
            print(f"❌ {filename}")
            fail_count += 1
    
    # Get DEPRECATED files
    deprecated_files = glob.glob("docs/09-archive/DEPRECATED*.md")
    for filepath in deprecated_files:
        result = modernize_file(filepath)
        filename = os.path.basename(filepath)
        
        if result is True:
            print(f"✅ {filename}")
            success_count += 1
        elif result is False:
            print(f"❌ {filename}")
            fail_count += 1
    
    print("\n" + "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print(f"📊 MODERNIZATION COMPLETE")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print(f"✅ Updated: {success_count} files")
    print(f"⏭️  Skipped: {skip_count} files (no CAVE-marker)")
    if fail_count > 0:
        print(f"❌ Failed: {fail_count} files")
    print()

if __name__ == "__main__":
    main()
