//
//  Entry+CoreDataProperties.swift
//  Zitate
//
//  Created on 2026-03-14.
//

import Foundation
import CoreData

extension Entry {

    @nonobjc public class func fetchRequest() -> NSFetchRequest<Entry> {
        return NSFetchRequest<Entry>(entityName: "Entry")
    }

    @NSManaged public var id: UUID?
    @NSManaged public var text: String?
    @NSManaged public var latitude: Double
    @NSManaged public var longitude: Double
    @NSManaged public var createdAt: Date?
    @NSManaged public var updatedAt: Date?
    @NSManaged public var author: Author?
    @NSManaged public var labels: NSSet?
    @NSManaged public var images: NSSet?
    @NSManaged public var audio: AudioAttachment?

    /// Computed property to check if location is set
    var hasLocation: Bool {
        latitude != 0.0 || longitude != 0.0
    }

    /// Returns images as a sorted array
    var imagesArray: [ImageAttachment] {
        let set = images as? Set<ImageAttachment> ?? []
        return set.sorted { $0.order < $1.order }
    }

    /// Returns labels as an array
    var labelsArray: [Label] {
        let set = labels as? Set<Label> ?? []
        return set.sorted { ($0.name ?? "") < ($1.name ?? "") }
    }
}

// MARK: Generated accessors for labels
extension Entry {

    @objc(addLabelsObject:)
    @NSManaged public func addToLabels(_ value: Label)

    @objc(removeLabelsObject:)
    @NSManaged public func removeFromLabels(_ value: Label)

    @objc(addLabels:)
    @NSManaged public func addToLabels(_ values: NSSet)

    @objc(removeLabels:)
    @NSManaged public func removeFromLabels(_ values: NSSet)

}

// MARK: Generated accessors for images
extension Entry {

    @objc(addImagesObject:)
    @NSManaged public func addToImages(_ value: ImageAttachment)

    @objc(removeImagesObject:)
    @NSManaged public func removeFromImages(_ value: ImageAttachment)

    @objc(addImages:)
    @NSManaged public func addToImages(_ values: NSSet)

    @objc(removeImages:)
    @NSManaged public func removeFromImages(_ values: NSSet)

}

extension Entry : Identifiable {

}
