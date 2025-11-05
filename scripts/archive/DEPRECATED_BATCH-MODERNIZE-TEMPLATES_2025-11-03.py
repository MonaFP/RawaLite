#!/usr/bin/env python3
import os
import glob

CAVE = "CAVE:  **🤖 KI-AUTO-DETECTION SYSTEM NEEDED. KI HAS TO READ HANDBOOK FIRST**"
MODERN = "> **🤖 KI-AUTO-DETECTION SYSTEM:**\n> - **AKTUELLER STATUS:** KNOWLEDGE_ONLY\n> - **TEMPLATE-QUELLE:** 06-handbook/TEMPLATE/VALIDATED_TEMPLATE-LESSONS-LEARNED_2025-10-26.md\n> - **AUTO-UPDATE:** Bei ähnlichen Problemen als Referenz nutzen\n> - **STATUS-KEYWORDS:** Erkannt durch LESSON_FIX, Knowledge Base, Historical Reference"

success = 0
skip = 0
fail = 0

print("\n🔄 BATCH MODERNIZATION: Archive Templates\n")

# Process LESSON_FIX files
for fp in glob.glob("docs/09-archive/Knowledge/LESSON_FIX/*.md"):
    try:
        with open(fp, 'r', encoding='utf-8') as f:
            content = f.read()
        if CAVE in content:
            new = content.replace(CAVE, MODERN)
            with open(fp, 'w', encoding='utf-8') as f:
                f.write(new)
            print(f"✅ {os.path.basename(fp)}")
            success += 1
        else:
            skip += 1
    except Exception as e:
        print(f"❌ {os.path.basename(fp)}: {e}")
        fail += 1

# Process KNOWLEDGE_ONLY
for fp in glob.glob("docs/09-archive/Knowledge/KNOWLEDGE_ONLY*.md"):
    try:
        with open(fp, 'r', encoding='utf-8') as f:
            content = f.read()
        if CAVE in content:
            new = content.replace(CAVE, MODERN)
            with open(fp, 'w', encoding='utf-8') as f:
                f.write(new)
            print(f"✅ {os.path.basename(fp)}")
            success += 1
        else:
            skip += 1
    except Exception as e:
        print(f"❌ {os.path.basename(fp)}: {e}")
        fail += 1

# Process DEPRECATED
for fp in glob.glob("docs/09-archive/DEPRECATED*.md"):
    try:
        with open(fp, 'r', encoding='utf-8') as f:
            content = f.read()
        if CAVE in content:
            new = content.replace(CAVE, MODERN)
            with open(fp, 'w', encoding='utf-8') as f:
                f.write(new)
            print(f"✅ {os.path.basename(fp)}")
            success += 1
        else:
            skip += 1
    except Exception as e:
        print(f"❌ {os.path.basename(fp)}: {e}")
        fail += 1

print(f"\n✅ Updated: {success} files\n⏭️ Skipped: {skip} files\n")
