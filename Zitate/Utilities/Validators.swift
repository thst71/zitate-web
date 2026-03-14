//
//  Validators.swift
//  Zitate
//
//  Created on 2026-03-14.
//

import Foundation

enum Validators {

    /// Validate text entry
    static func validateEntryText(_ text: String?) -> ValidationResult {
        guard let text = text, !text.isEmpty else {
            return .invalid("Text cannot be empty")
        }

        if text.count < Constants.minTextLength {
            return .invalid("Text must be at least \(Constants.minTextLength) character")
        }

        if text.count > Constants.maxTextLength {
            return .invalid("Text cannot exceed \(Constants.maxTextLength) characters")
        }

        return .valid
    }

    /// Validate author name
    static func validateAuthorName(_ name: String?) -> ValidationResult {
        guard let name = name, !name.isEmpty else {
            return .invalid("Author name cannot be empty")
        }

        if name.count > Constants.maxAuthorNameLength {
            return .invalid("Author name cannot exceed \(Constants.maxAuthorNameLength) characters")
        }

        return .valid
    }

    /// Validate label name
    static func validateLabelName(_ name: String?) -> ValidationResult {
        guard let name = name, !name.isEmpty else {
            return .invalid("Label name cannot be empty")
        }

        if name.count > Constants.maxLabelNameLength {
            return .invalid("Label name cannot exceed \(Constants.maxLabelNameLength) characters")
        }

        // Check for disallowed characters
        if name.contains(",") || name.contains(";") {
            return .invalid("Label name cannot contain commas or semicolons")
        }

        return .valid
    }

    /// Validate URL
    static func validateURL(_ urlString: String?) -> ValidationResult {
        guard let urlString = urlString, !urlString.isEmpty else {
            return .valid // URL is optional
        }

        guard URL(string: urlString) != nil else {
            return .invalid("Invalid URL format")
        }

        return .valid
    }

    /// Validate folder name
    static func validateFolderName(_ name: String?) -> ValidationResult {
        guard let name = name, !name.isEmpty else {
            return .invalid("Folder name cannot be empty")
        }

        if name.count > Constants.maxFolderNameLength {
            return .invalid("Folder name cannot exceed \(Constants.maxFolderNameLength) characters")
        }

        return .valid
    }
}

enum ValidationResult: Equatable {
    case valid
    case invalid(String)

    var isValid: Bool {
        if case .valid = self {
            return true
        }
        return false
    }

    var errorMessage: String? {
        if case .invalid(let message) = self {
            return message
        }
        return nil
    }
}
