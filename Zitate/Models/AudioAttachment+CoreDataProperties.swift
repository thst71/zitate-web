//
//  AudioAttachment+CoreDataProperties.swift
//  Zitate
//
//  Created on 2026-03-14.
//

import Foundation
import CoreData

extension AudioAttachment {

    @nonobjc public class func fetchRequest() -> NSFetchRequest<AudioAttachment> {
        return NSFetchRequest<AudioAttachment>(entityName: "AudioAttachment")
    }

    @NSManaged public var id: UUID?
    @NSManaged public var filePath: String?
    @NSManaged public var duration: Double
    @NSManaged public var createdAt: Date?
    @NSManaged public var entry: Entry?

}

extension AudioAttachment : Identifiable {

}
