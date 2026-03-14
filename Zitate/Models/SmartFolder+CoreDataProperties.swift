//
//  SmartFolder+CoreDataProperties.swift
//  Zitate
//
//  Created on 2026-03-14.
//

import Foundation
import CoreData

extension SmartFolder {

    @nonobjc public class func fetchRequest() -> NSFetchRequest<SmartFolder> {
        return NSFetchRequest<SmartFolder>(entityName: "SmartFolder")
    }

    @NSManaged public var id: UUID?
    @NSManaged public var name: String?
    @NSManaged public var criteriaJSON: String?
    @NSManaged public var order: Int16
    @NSManaged public var createdAt: Date?

}

extension SmartFolder : Identifiable {

}
