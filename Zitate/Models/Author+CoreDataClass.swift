//
//  Author+CoreDataClass.swift
//  Zitate
//
//  Created on 2026-03-14.
//

import Foundation
import CoreData

@objc(Author)
public class Author: NSManagedObject {

    /// Validates the author data
    /// - Returns: true if name is present and within limits
    func isValid() -> Bool {
        guard let name = name else { return false }
        return !name.isEmpty && name.count <= 200
    }

    /// Creates a new author with default values
    static func create(in context: NSManagedObjectContext, name: String) -> Author {
        let author = Author(context: context)
        author.id = UUID()
        author.name = name
        return author
    }

    /// Check if author can be deleted (has no entries)
    func canDelete() -> Bool {
        return (entries as? Set<Entry>)?.isEmpty ?? true
    }
}
