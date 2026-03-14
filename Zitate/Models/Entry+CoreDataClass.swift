//
//  Entry+CoreDataClass.swift
//  Zitate
//
//  Created on 2026-03-14.
//

import Foundation
import CoreData

@objc(Entry)
public class Entry: NSManagedObject {

    /// Validates the entry text
    /// - Returns: true if text is between 1 and 10,000 characters
    func isValid() -> Bool {
        guard let text = text else { return false }
        return text.count >= 1 && text.count <= 10000
    }

    /// Creates a new entry with default values
    static func create(in context: NSManagedObjectContext) -> Entry {
        let entry = Entry(context: context)
        entry.id = UUID()
        entry.createdAt = Date()
        entry.updatedAt = Date()
        return entry
    }

    public override func willSave() {
        super.willSave()
        // Update the updatedAt timestamp whenever the object is saved
        if !isDeleted {
            updatedAt = Date()
        }
    }
}
