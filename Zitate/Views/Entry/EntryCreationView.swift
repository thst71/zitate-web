//
//  EntryCreationView.swift
//  Zitate
//
//  Created on 2026-03-14.
//

import SwiftUI

struct EntryCreationView: View {
    @Environment(\.managedObjectContext) private var viewContext
    @Environment(\.dismiss) private var dismiss

    @StateObject private var viewModel: EntryViewModel
    @State private var showingError = false

    init() {
        // Note: We'll inject the context in the initializer body
        _viewModel = StateObject(wrappedValue: EntryViewModel(context: PersistenceController.shared.container.viewContext))
    }

    var body: some View {
        NavigationStack {
            Form {
                // Text Input Section
                Section {
                    TextEditor(text: $viewModel.text)
                        .frame(minHeight: 150)
                        .onChange(of: viewModel.text) { oldValue, newValue in
                            viewModel.validateText()
                        }

                    HStack {
                        Text("\(viewModel.characterCount) / 10,000")
                            .font(.caption)
                            .foregroundStyle(viewModel.isTextValid ? .secondary : .red)

                        Spacer()

                        if let validationError = viewModel.validationError {
                            Text(validationError)
                                .font(.caption)
                                .foregroundStyle(.red)
                        }
                    }
                } header: {
                    Text("Quote Text")
                } footer: {
                    Text("Enter the quote, saying, or citation (1-10,000 characters)")
                }

                // Location Section
                Section {
                    HStack {
                        Image(systemName: "location.fill")
                            .foregroundStyle(.blue)

                        VStack(alignment: .leading, spacing: 4) {
                            Text(viewModel.displayLocation)
                                .font(.body)

                            if viewModel.location != nil {
                                Text("Tap to modify location")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }

                        Spacer()

                        if viewModel.location == nil {
                            Button("Capture") {
                                viewModel.captureLocation()
                            }
                            .buttonStyle(.bordered)
                        }
                    }
                } header: {
                    Text("Location")
                } footer: {
                    Text("Location is automatically captured. Grant permission to enable.")
                }

                // Error Display
                if let errorMessage = viewModel.errorMessage {
                    Section {
                        Text(errorMessage)
                            .foregroundStyle(.red)
                    }
                }
            }
            .navigationTitle("New Quote")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        Task {
                            let success = await viewModel.saveEntry()
                            if success {
                                dismiss()
                            } else {
                                showingError = true
                            }
                        }
                    }
                    .disabled(!viewModel.canSave)
                }
            }
            .onAppear {
                viewModel.captureLocation()
            }
            .alert("Error", isPresented: $showingError) {
                Button("OK", role: .cancel) { }
            } message: {
                if let errorMessage = viewModel.errorMessage {
                    Text(errorMessage)
                }
            }
        }
    }
}

#Preview {
    EntryCreationView()
        .environment(\.managedObjectContext, PersistenceController.preview.container.viewContext)
}
