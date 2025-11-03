#!/usr/bin/env python3
"""
Add KI-AUTO-DETECTION SYSTEM headers to files missing them.
Processes 25 files from Answer 2 of the schema compliance audit.
"""

import os
from pathlib import Path
from datetime import datetime

# KI-AUTO-DETECTION header template
KI_AUTO_DETECTION_TEMPLATE = """
> **🤖 KI-AUTO-DETECTION SYSTEM:**
> - **AKTUELLER STATUS:** {status} (Archivierte Dokumentation)
> - **TEMPLATE-QUELLE:** 06-handbook/TEMPLATE/VALIDATED_TEMPLATE-LESSONS-LEARNED_2025-10-26.md
> - **AUTO-UPDATE:** Bei ähnlichen Problemen als Referenz nutzen
> - **STATUS-KEYWORDS:** Erkannt durch Dateiname, Schema-Konformität
"""

# Files to update with their appropriate status
FILES_TO_UPDATE = {
    # COMPLETED_ files
    "COMPLETED_PHASE2-STEP1-BACKEND-IPC-HANDLERS_2025-11-03.md": "COMPLETED",
    "COMPLETED_PHASE2-STEP2-BACKUPRECOVERYSERVICE_2025-11-03.md": "COMPLETED",
    "COMPLETED_PHASE2-STEP3-RENDERROLLBACKSERVICE_2025-11-03.md": "COMPLETED",
    "COMPLETED_PHASE2-STEP4-REACT-UI-COMPONENTS_2025-11-03.md": "COMPLETED",
    "COMPLETED_VERIFICATION-PHASE1-PHASE2-FULL-REVIEW_2025-11-03.md": "COMPLETED",
    "COMPLETED_AUDIT-PHASE3-OUTDATED-KI-MISLEADING-DOCS_2025-11-03.md": "COMPLETED",
    "COMPLETED_REPORT-INDEX-MD-COMPLIANCE-AUDIT_2025-11-03.md": "COMPLETED",
    "COMPLETED_REPORT-KI-SESSION-PHASE1-COMPLETION_2025-11-03.md": "COMPLETED",
    "COMPLETED_REPORT-WIP-DOKUMENTE-AKTUALITAETSPRUEFUNG_2025-11-03.md": "COMPLETED",
    "COMPLETED_REPORT-ABSCHLUSSBERICHT_2025-11-03.md": "COMPLETED",
    "COMPLETED_REPORT-KI-SESSION-03-NOV-2025_2025-11-03.md": "COMPLETED",
    
    # PLAN_ files
    "PLAN_IMPL-PHASE2-ROLLBACK-SYSTEM-ARCHITECTURE_2025-11-03.md": "PLAN",
    
    # Other files without prefix
    "COMPLETED-NAVIGATION-LAYOUT-FIX.md": "COMPLETED",
    "AUDIT_REPORT-OPEN-STATUS-DOCUMENTS-2025-11-03.md": "VALIDATED",
    "AUDIT_REPORT-PHASE2B-TEMPLATE-COMPLIANCE-FINDINGS_2025-11-03.md": "VALIDATED",
    "EMERGENCY_DOCUMENTATION_SYSTEM_REPAIR_SUCCESS_2025-10-20.md": "COMPLETED",
    "PHASE-1-EXECUTIVE-SUMMARY-DEUTSCH.md": "COMPLETED",
    "README.md": "VALIDATED",
    "VERIFICATION-REPORT-CODE-REALITY-CHECK-2025-10-30.md": "VALIDATED",
    "VERIFICATION-REPORT-DATABASE-PFAD-DOKUMENTATION-2025-10-22.md": "VALIDATED",
    "VALIDATION-RESULTS-NAVIGATION-SYSTEM.md": "VALIDATED",
    
    # Release notes (special handling)
    "RELEASE_NOTES_v1.0.41.md": "COMPLETED",
    "RELEASE_NOTES_v1.0.42.md": "COMPLETED",
}

def get_first_heading_line(content: str) -> int:
    """Find the line number of the first heading."""
    lines = content.split('\n')
    for i, line in enumerate(lines):
        if line.startswith('#'):
            return i
    return 0

def has_ki_auto_detection(content: str) -> bool:
    """Check if content has KI-AUTO-DETECTION header."""
    return "🤖 KI-AUTO-DETECTION SYSTEM" in content

def add_header_to_file(filepath: str, status: str) -> bool:
    """Add KI-AUTO-DETECTION header to file."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Skip if already has header
        if has_ki_auto_detection(content):
            return False
        
        # Find insertion point (after first heading + blank line)
        lines = content.split('\n')
        insert_idx = get_first_heading_line(content)
        
        # Skip heading and immediate content to find good insertion point
        # Usually after title and first blank line
        i = insert_idx + 1
        while i < len(lines) and lines[i].startswith('**'):
            i += 1
        
        # Create header
        header = KI_AUTO_DETECTION_TEMPLATE.format(status=status).strip()
        
        # Insert header
        lines.insert(i + 1, "")
        lines.insert(i + 2, header)
        lines.insert(i + 3, "")
        
        updated_content = '\n'.join(lines)
        
        # Write back
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(updated_content)
        
        return True
    except Exception as e:
        print(f"❌ Error processing {filepath}: {e}")
        return False

def main():
    print("🚀 Starting KI-AUTO-DETECTION header addition...")
    print(f"📋 Processing {len(FILES_TO_UPDATE)} files\n")
    
    updated = 0
    skipped = 0
    errors = 0
    not_found = 0
    
    for filename, status in FILES_TO_UPDATE.items():
        filepath = os.path.join(".", filename)
        
        if not os.path.exists(filepath):
            # Try with different path patterns
            alt_paths = [
                os.path.join("c:/Users/ramon/Desktop/RawaLite", filename),
                filename
            ]
            found = False
            for alt_path in alt_paths:
                if os.path.exists(alt_path):
                    filepath = alt_path
                    found = True
                    break
            
            if not found:
                print(f"⚠️  NOT FOUND: {filename}")
                not_found += 1
                continue
        
        # Check if already has header
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        if has_ki_auto_detection(content):
            print(f"⏭️  SKIP (has header): {filename}")
            skipped += 1
            continue
        
        # Add header
        if add_header_to_file(filepath, status):
            print(f"✅ UPDATED ({status}): {filename}")
            updated += 1
        else:
            print(f"❌ ERROR: {filename}")
            errors += 1
    
    print(f"\n{'='*60}")
    print(f"📊 RESULTS:")
    print(f"✅ Updated: {updated}")
    print(f"⏭️  Skipped (already had header): {skipped}")
    print(f"⚠️  Not Found: {not_found}")
    print(f"❌ Errors: {errors}")
    print(f"{'='*60}")

if __name__ == "__main__":
    main()
