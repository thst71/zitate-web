//
//  Label+CoreDataProperties.swift
//  Zitate
//
//  Created on 2026-03-14.
//

import Foundation
import CoreData

extension Label {

    @nonobjc public class func fetchRequest() -> NSFetchRequest<Label> {
        return NSFetchRequest<Label>(entityName: "Label")
    }

    @NSManaged public var id: UUID?
    @NSManaged public var name: String?
    @NSManaged public var entries: NSSet?

    /// Returns entries as an array
    var entriesArray: [Entry] {
        let set = entries as? Set<Entry> ?? []
        return set.sorted { ($0.createdAt ?? Date()) > ($1.createdAt ?? Date()) }
    }

    /// Returns count of entries with this label
    var entryCount: Int {
        return (entries as? Set<Entry>)?.count ?? 0
    }
}

// MARK: Generated accessors for entries
extension Label {

    @objc(addEntriesObject:)
    @NSManaged public func addToEntries(_ value: Entry)

    @objc(removeEntriesObject:)
    @NSManaged public func removeFromEntries(_ value: Entry)

    @objc(addEntries:)
    @NSManaged public func addToEntries(_ values: NSSet)

    @objc(removeEntries:)
    @NSManaged public func removeFromEntries(_ values: NSSet)

}

extension Label : Identifiable {

}
