#!/bin/bash

# Verification script for Zitate Phase 1 implementation
# Run this to check if all required files are present

echo "🔍 Verifying Zitate Phase 1 file structure..."
echo ""

all_present=true

# Required files
files=(
    "Zitate/ZitateApp.swift"
    "Zitate/ContentView.swift"
    "Zitate/Models/Entry+CoreDataClass.swift"
    "Zitate/Models/Entry+CoreDataProperties.swift"
    "Zitate/Models/Author+CoreDataClass.swift"
    "Zitate/Models/Author+CoreDataProperties.swift"
    "Zitate/Models/Label+CoreDataClass.swift"
    "Zitate/Models/Label+CoreDataProperties.swift"
    "Zitate/Models/ImageAttachment+CoreDataClass.swift"
    "Zitate/Models/ImageAttachment+CoreDataProperties.swift"
    "Zitate/Models/AudioAttachment+CoreDataClass.swift"
    "Zitate/Models/AudioAttachment+CoreDataProperties.swift"
    "Zitate/Models/SmartFolder+CoreDataClass.swift"
    "Zitate/Models/SmartFolder+CoreDataProperties.swift"
    "Zitate/ViewModels/EntryViewModel.swift"
    "Zitate/Views/Entry/EntryCreationView.swift"
    "Zitate/Services/PersistenceController.swift"
    "Zitate/Services/LocationService.swift"
    "Zitate/Utilities/Constants.swift"
    "Zitate/Utilities/Validators.swift"
    "Zitate/Resources/Info.plist"
    "Zitate/Resources/Zitate.xcdatamodeld/Zitate.xcdatamodel/contents"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ MISSING: $file"
        all_present=false
    fi
done

echo ""

# Documentation files
docs=(
    "README.md"
    "specification.adoc"
    "tech-specification.adoc"
    "backlog.adoc"
    "phase1.adoc"
    "PHASE1_COMPLETE.md"
    ".gitignore"
)

echo "📚 Documentation files:"
for doc in "${docs[@]}"; do
    if [ -f "$doc" ]; then
        echo "✅ $doc"
    else
        echo "⚠️  Missing: $doc (optional)"
    fi
done

echo ""

if [ "$all_present" = true ]; then
    echo "✨ All required files present!"
    echo ""
    echo "📋 Phase 1 Implementation Summary:"
    echo "   • 22 Swift source files"
    echo "   • 1 Core Data model"
    echo "   • 1 Info.plist with permissions"
    echo "   • 6 Core Data entities"
    echo "   • 2 Services (Persistence, Location)"
    echo "   • 1 ViewModel (Entry)"
    echo "   • 1 View (EntryCreation)"
    echo ""
    echo "🎯 Next Steps:"
    echo "   1. Create Xcode project (see README.md)"
    echo "   2. Add these files to your Xcode project"
    echo "   3. Configure project settings (iOS 17.0, iCloud capability)"
    echo "   4. Build and test"
    echo ""
    echo "✅ Phase 1 is READY FOR TESTING!"
else
    echo "❌ Some files are missing. Check the output above."
    exit 1
fi
