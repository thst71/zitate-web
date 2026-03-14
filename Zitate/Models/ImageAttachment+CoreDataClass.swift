//
//  ImageAttachment+CoreDataClass.swift
//  Zitate
//
//  Created on 2026-03-14.
//

import Foundation
import CoreData

@objc(ImageAttachment)
public class ImageAttachment: NSManagedObject {

    /// Creates a new image attachment
    static func create(in context: NSManagedObjectContext, filePath: String, order: Int16) -> ImageAttachment {
        let image = ImageAttachment(context: context)
        image.id = UUID()
        image.filePath = filePath
        image.order = order
        image.createdAt = Date()
        return image
    }

    /// Validates the image attachment
    func isValid() -> Bool {
        guard let filePath = filePath else { return false }
        return !filePath.isEmpty
    }
}
