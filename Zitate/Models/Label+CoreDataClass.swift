//
//  Label+CoreDataClass.swift
//  Zitate
//
//  Created on 2026-03-14.
//

import Foundation
import CoreData

@objc(Label)
public class Label: NSManagedObject {

    /// Validates the label data
    /// - Returns: true if name is present and within limits
    func isValid() -> Bool {
        guard let name = name else { return false }
        return !name.isEmpty && name.count <= 50
    }

    /// Creates a new label with default values
    /// Note: Name is automatically converted to lowercase
    static func create(in context: NSManagedObjectContext, name: String) -> Label {
        let label = Label(context: context)
        label.id = UUID()
        label.name = name.lowercased()
        return label
    }

    /// Find or create a label with the given name
    static func findOrCreate(in context: NSManagedObjectContext, name: String) -> Label? {
        let normalizedName = name.lowercased()

        let fetchRequest: NSFetchRequest<Label> = Label.fetchRequest()
        fetchRequest.predicate = NSPredicate(format: "name == %@", normalizedName)
        fetchRequest.fetchLimit = 1

        do {
            if let existing = try context.fetch(fetchRequest).first {
                return existing
            } else {
                return create(in: context, name: normalizedName)
            }
        } catch {
            print("Error finding or creating label: \(error)")
            return nil
        }
    }

    /// Override to ensure name is always lowercase
    public override func willSave() {
        super.willSave()
        if let name = name, !isDeleted {
            self.name = name.lowercased()
        }
    }

    /// Display name with first letter capitalized
    var displayName: String {
        guard let name = name else { return "" }
        return name.prefix(1).uppercased() + name.dropFirst()
    }
}
