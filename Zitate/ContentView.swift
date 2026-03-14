//
//  ContentView.swift
//  Zitate
//
//  Created on 2026-03-14.
//

import SwiftUI

struct ContentView: View {
    @Environment(\.managedObjectContext) private var viewContext
    @State private var showingEntryCreation = false

    var body: some View {
        NavigationStack {
            VStack {
                Text("Zitate")
                    .font(.largeTitle)
                    .padding()

                Text("Your quotes collection")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)

                Spacer()
            }
            .navigationTitle("Home")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button {
                        showingEntryCreation = true
                    } label: {
                        Label("Add Entry", systemImage: "plus")
                    }
                }
            }
            .sheet(isPresented: $showingEntryCreation) {
                EntryCreationView()
            }
        }
    }
}

#Preview {
    ContentView()
        .environment(\.managedObjectContext, PersistenceController.preview.container.viewContext)
}
