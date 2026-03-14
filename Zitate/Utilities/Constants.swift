//
//  Constants.swift
//  Zitate
//
//  Created on 2026-03-14.
//

import Foundation

enum Constants {
    // Text limits
    static let minTextLength = 1
    static let maxTextLength = 10_000

    // Author limits
    static let maxAuthorNameLength = 200
    static let maxLocationLength = 200

    // Label limits
    static let maxLabelNameLength = 50
    static let maxLabelsPerEntry = 50

    // Media limits
    static let maxImagesPerEntry = 10
    static let maxImageSizeMB = 2.0
    static let maxAudioDurationSeconds = 300.0 // 5 minutes

    // Folder limits
    static let maxFolderNameLength = 100

    // Location settings
    static let locationUpdateDistanceMeters = 500.0
    static let featuredQuoteRadiusKm = 10.0

    // Performance settings
    static let searchDebounceMilliseconds = 300
    static let fetchBatchSize = 20
}
