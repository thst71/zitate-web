//
//  AudioAttachment+CoreDataClass.swift
//  Zitate
//
//  Created on 2026-03-14.
//

import Foundation
import CoreData

@objc(AudioAttachment)
public class AudioAttachment: NSManagedObject {

    /// Creates a new audio attachment
    static func create(in context: NSManagedObjectContext, filePath: String, duration: Double) -> AudioAttachment {
        let audio = AudioAttachment(context: context)
        audio.id = UUID()
        audio.filePath = filePath
        audio.duration = duration
        audio.createdAt = Date()
        return audio
    }

    /// Validates the audio attachment
    func isValid() -> Bool {
        guard let filePath = filePath else { return false }
        return !filePath.isEmpty && duration > 0 && duration <= 300 // max 5 minutes
    }

    /// Formatted duration string (MM:SS)
    var formattedDuration: String {
        let minutes = Int(duration) / 60
        let seconds = Int(duration) % 60
        return String(format: "%02d:%02d", minutes, seconds)
    }
}
