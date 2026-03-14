//
//  ImageAttachment+CoreDataProperties.swift
//  Zitate
//
//  Created on 2026-03-14.
//

import Foundation
import CoreData

extension ImageAttachment {

    @nonobjc public class func fetchRequest() -> NSFetchRequest<ImageAttachment> {
        return NSFetchRequest<ImageAttachment>(entityName: "ImageAttachment")
    }

    @NSManaged public var id: UUID?
    @NSManaged public var filePath: String?
    @NSManaged public var order: Int16
    @NSManaged public var createdAt: Date?
    @NSManaged public var entry: Entry?

}

extension ImageAttachment : Identifiable {

}
