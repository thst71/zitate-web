//
//  SmartFolder+CoreDataClass.swift
//  Zitate
//
//  Created on 2026-03-14.
//

import Foundation
import CoreData

@objc(SmartFolder)
public class SmartFolder: NSManagedObject {

    /// Creates a new smart folder
    static func create(in context: NSManagedObjectContext, name: String, criteria: [String: Any]) -> SmartFolder {
        let folder = SmartFolder(context: context)
        folder.id = UUID()
        folder.name = name
        folder.setCriteria(criteria)
        folder.createdAt = Date()
        folder.order = 0
        return folder
    }

    /// Validates the smart folder
    func isValid() -> Bool {
        guard let name = name else { return false }
        return !name.isEmpty && name.count <= 100 && criteriaJSON != nil
    }

    /// Set criteria from dictionary
    func setCriteria(_ criteria: [String: Any]) {
        if let jsonData = try? JSONSerialization.data(withJSONObject: criteria),
           let jsonString = String(data: jsonData, encoding: .utf8) {
            self.criteriaJSON = jsonString
        }
    }

    /// Get criteria as dictionary
    func getCriteria() -> [String: Any]? {
        guard let jsonString = criteriaJSON,
              let jsonData = jsonString.data(using: .utf8),
              let criteria = try? JSONSerialization.jsonObject(with: jsonData) as? [String: Any] else {
            return nil
        }
        return criteria
    }
}
