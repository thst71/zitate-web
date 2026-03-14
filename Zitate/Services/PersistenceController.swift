//
//  PersistenceController.swift
//  Zitate
//
//  Created on 2026-03-14.
//

import CoreData
import Foundation

/// Manages Core Data persistence stack
struct PersistenceController {
    static let shared = PersistenceController()

    /// Preview instance with in-memory store for SwiftUI previews
    static var preview: PersistenceController = {
        let result = PersistenceController(inMemory: true)
        let viewContext = result.container.viewContext

        // Create sample data for previews
        for i in 0..<10 {
            let entry = Entry.create(in: viewContext)
            entry.text = "Sample quote \(i): This is a test entry for preview purposes."
            entry.latitude = 48.8566 + Double(i) * 0.01
            entry.longitude = 2.3522 + Double(i) * 0.01
        }

        do {
            try viewContext.save()
        } catch {
            let nsError = error as NSError
            fatalError("Unresolved error \(nsError), \(nsError.userInfo)")
        }

        return result
    }()

    let container: NSPersistentCloudKitContainer

    init(inMemory: Bool = false) {
        container = NSPersistentCloudKitContainer(name: "Zitate")

        if inMemory {
            container.persistentStoreDescriptions.first!.url = URL(fileURLWithPath: "/dev/null")
        }

        // Configure CloudKit container (optional sync)
        if let description = container.persistentStoreDescriptions.first {
            // Enable persistent history tracking for CloudKit
            description.setOption(true as NSNumber, forKey: NSPersistentHistoryTrackingKey)
            description.setOption(true as NSNumber, forKey: NSPersistentStoreRemoteChangeNotificationPostOptionKey)
        }

        container.loadPersistentStores { (storeDescription, error) in
            if let error = error as NSError? {
                // Replace this implementation with code to handle the error appropriately.
                // fatalError() causes the application to generate a crash log and terminate.
                // You should not use this function in a shipping application.
                fatalError("Unresolved error \(error), \(error.userInfo)")
            }
        }

        // Automatically merge changes from parent
        container.viewContext.automaticallyMergesChangesFromParent = true
        container.viewContext.mergePolicy = NSMergeByPropertyObjectTrumpMergePolicy
    }

    /// Creates a background context for heavy operations
    func newBackgroundContext() -> NSManagedObjectContext {
        let context = container.newBackgroundContext()
        context.mergePolicy = NSMergeByPropertyObjectTrumpMergePolicy
        return context
    }

    /// Saves the view context if there are changes
    func save() {
        let context = container.viewContext

        if context.hasChanges {
            do {
                try context.save()
            } catch {
                let nsError = error as NSError
                print("Error saving context: \(nsError), \(nsError.userInfo)")
            }
        }
    }

    /// Saves a background context
    func saveContext(_ context: NSManagedObjectContext) {
        if context.hasChanges {
            do {
                try context.save()
            } catch {
                let nsError = error as NSError
                print("Error saving background context: \(nsError), \(nsError.userInfo)")
            }
        }
    }
}
