//
//  LocationService.swift
//  Zitate
//
//  Created on 2026-03-14.
//

import Foundation
import CoreLocation
import Combine

/// Service for managing location services
class LocationService: NSObject, ObservableObject {
    static let shared = LocationService()

    private let locationManager = CLLocationManager()
    private let geocoder = CLGeocoder()

    @Published var currentLocation: CLLocation?
    @Published var locationAddress: String?
    @Published var authorizationStatus: CLAuthorizationStatus = .notDetermined
    @Published var locationError: String?

    private override init() {
        super.init()
        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyBest
        locationManager.distanceFilter = 500 // Update when moved 500m
        authorizationStatus = locationManager.authorizationStatus
    }

    /// Request location permission
    func requestPermission() {
        locationManager.requestWhenInUseAuthorization()
    }

    /// Start updating location
    func startUpdatingLocation() {
        guard authorizationStatus == .authorizedWhenInUse || authorizationStatus == .authorizedAlways else {
            requestPermission()
            return
        }

        locationManager.startUpdatingLocation()
    }

    /// Stop updating location
    func stopUpdatingLocation() {
        locationManager.stopUpdatingLocation()
    }

    /// Get current location once
    func getCurrentLocation() {
        guard authorizationStatus == .authorizedWhenInUse || authorizationStatus == .authorizedAlways else {
            requestPermission()
            return
        }

        locationManager.requestLocation()
    }

    /// Reverse geocode coordinates to address
    func reverseGeocode(location: CLLocation, completion: @escaping (String?) -> Void) {
        geocoder.reverseGeocodeLocation(location) { [weak self] placemarks, error in
            guard let self = self else { return }

            if let error = error {
                print("Reverse geocoding error: \(error)")
                self.locationAddress = nil
                completion(nil)
                return
            }

            if let placemark = placemarks?.first {
                let address = self.formatAddress(from: placemark)
                DispatchQueue.main.async {
                    self.locationAddress = address
                    completion(address)
                }
            } else {
                DispatchQueue.main.async {
                    self.locationAddress = nil
                    completion(nil)
                }
            }
        }
    }

    /// Format address from placemark
    private func formatAddress(from placemark: CLPlacemark) -> String {
        var components: [String] = []

        if let name = placemark.name {
            components.append(name)
        }

        if let locality = placemark.locality {
            components.append(locality)
        }

        if let country = placemark.country {
            components.append(country)
        }

        return components.isEmpty ? "Unknown Location" : components.joined(separator: ", ")
    }

    /// Format coordinates as string
    func formatCoordinates(_ latitude: Double, _ longitude: Double) -> String {
        return String(format: "%.6f, %.6f", latitude, longitude)
    }

    /// Calculate distance between two coordinates in kilometers
    func distance(from: CLLocation, to: CLLocation) -> Double {
        return from.distance(from: to) / 1000.0 // Convert to km
    }
}

// MARK: - CLLocationManagerDelegate
extension LocationService: CLLocationManagerDelegate {

    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        DispatchQueue.main.async {
            self.authorizationStatus = manager.authorizationStatus

            if manager.authorizationStatus == .authorizedWhenInUse ||
               manager.authorizationStatus == .authorizedAlways {
                self.locationError = nil
            } else if manager.authorizationStatus == .denied {
                self.locationError = "Location permission denied"
            }
        }
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.last else { return }

        DispatchQueue.main.async {
            self.currentLocation = location
            self.locationError = nil
        }

        // Reverse geocode the location
        reverseGeocode(location: location) { _ in }
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        DispatchQueue.main.async {
            self.locationError = error.localizedDescription
            print("Location error: \(error)")
        }
    }
}
