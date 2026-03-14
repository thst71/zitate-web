//
//  EntryViewModel.swift
//  Zitate
//
//  Created on 2026-03-14.
//

import Foundation
import CoreData
import CoreLocation
import Combine

/// ViewModel for Entry creation and editing
class EntryViewModel: ObservableObject {
    @Published var text: String = ""
    @Published var location: CLLocation?
    @Published var locationAddress: String?
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var validationError: String?

    private let context: NSManagedObjectContext
    private let locationService = LocationService.shared
    private var cancellables = Set<AnyCancellable>()

    init(context: NSManagedObjectContext) {
        self.context = context
        setupLocationObservers()
    }

    /// Character count
    var characterCount: Int {
        text.count
    }

    /// Is text valid (1-10,000 characters)
    var isTextValid: Bool {
        text.count >= 1 && text.count <= 10000
    }

    /// Can save entry
    var canSave: Bool {
        isTextValid && !isLoading
    }

    /// Setup location observers
    private func setupLocationObservers() {
        locationService.$currentLocation
            .sink { [weak self] location in
                self?.location = location
            }
            .store(in: &cancellables)

        locationService.$locationAddress
            .sink { [weak self] address in
                self?.locationAddress = address
            }
            .store(in: &cancellables)
    }

    /// Request location and start capturing
    func captureLocation() {
        locationService.getCurrentLocation()
    }

    /// Validate text input
    func validateText() {
        if text.isEmpty {
            validationError = "Text cannot be empty"
        } else if text.count > 10000 {
            validationError = "Text cannot exceed 10,000 characters"
        } else {
            validationError = nil
        }
    }

    /// Save entry
    func saveEntry() async -> Bool {
        validateText()

        guard isTextValid else {
            errorMessage = validationError ?? "Invalid entry"
            return false
        }

        isLoading = true
        errorMessage = nil

        do {
            // Create entry in background context
            let entry = Entry.create(in: context)
            entry.text = text

            // Set location if available
            if let location = location {
                entry.latitude = location.coordinate.latitude
                entry.longitude = location.coordinate.longitude
            }

            // Save context
            try context.save()

            isLoading = false
            return true

        } catch {
            isLoading = false
            errorMessage = "Failed to save entry: \(error.localizedDescription)"
            return false
        }
    }

    /// Reset form
    func reset() {
        text = ""
        location = nil
        locationAddress = nil
        errorMessage = nil
        validationError = nil
    }

    /// Display location string
    var displayLocation: String {
        if let address = locationAddress {
            return address
        } else if let location = location {
            return locationService.formatCoordinates(
                location.coordinate.latitude,
                location.coordinate.longitude
            )
        } else {
            return "No location"
        }
    }
}
