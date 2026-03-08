//
//  StorageService.swift
//  SparkVault
//

import Foundation

final class StorageService {
    static let shared = StorageService()
    
    private let ideasKey = "sparkvault_ideas"
    private let settingsKey = "sparkvault_settings"
    
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()
    
    private init() {
        encoder.dateEncodingStrategy = .iso8601
        decoder.dateDecodingStrategy = .iso8601
    }
    
    func loadIdeas() -> [Idea] {
        guard let data = UserDefaults.standard.data(forKey: ideasKey) else { return [] }
        return (try? decoder.decode([Idea].self, from: data)) ?? []
    }
    
    func saveIdeas(_ ideas: [Idea]) {
        guard let data = try? encoder.encode(ideas) else { return }
        UserDefaults.standard.set(data, forKey: ideasKey)
    }
    
    func loadSettings() -> AppSettings {
        guard let data = UserDefaults.standard.data(forKey: settingsKey) else {
            return .default
        }
        return (try? decoder.decode(AppSettings.self, from: data)) ?? .default
    }
    
    func saveSettings(_ settings: AppSettings) {
        guard let data = try? encoder.encode(settings) else { return }
        UserDefaults.standard.set(data, forKey: settingsKey)
    }
}
