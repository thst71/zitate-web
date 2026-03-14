//
//  Author+CoreDataProperties.swift
//  Zitate
//
//  Created on 2026-03-14.
//

import Foundation
import CoreData

extension Author {

    @nonobjc public class func fetchRequest() -> NSFetchRequest<Author> {
        return NSFetchRequest<Author>(entityName: "Author")
    }

    @NSManaged public var id: UUID?
    @NSManaged public var name: String?
    @NSManaged public var dateOfBirth: Date?
    @NSManaged public var locationOfBirth: String?
    @NSManaged public var dateOfDeath: Date?
    @NSManaged public var wikipediaURL: String?
    @NSManaged public var entries: NSSet?

    /// Returns entries as an array
    var entriesArray: [Entry] {
        let set = entries as? Set<Entry> ?? []
        return set.sorted { ($0.createdAt ?? Date()) > ($1.createdAt ?? Date()) }
    }

    /// Returns count of entries by this author
    var entryCount: Int {
        return (entries as? Set<Entry>)?.count ?? 0
    }
}

// MARK: Generated accessors for entries
extension Author {

    @objc(addEntriesObject:)
    @NSManaged public func addToEntries(_ value: Entry)

    @objc(removeEntriesObject:)
    @NSManaged public func removeFromEntries(_ value: Entry)

    @objc(addEntries:)
    @NSManaged public func addToEntries(_ values: NSSet)

    @objc(removeEntries:)
    @NSManaged public func removeFromEntries(_ values: NSSet)

}

extension Author : Identifiable {

}
