//
//  ZitateApp.swift
//  Zitate
//
//  Created on 2026-03-14.
//

import SwiftUI

@main
struct ZitateApp: App {
    let persistenceController = PersistenceController.shared

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(\.managedObjectContext, persistenceController.container.viewContext)
        }
    }
}
