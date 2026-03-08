//
//  IdeasViewModel.swift
//  SparkVault
//

import Foundation
import Observation
import UIKit

enum SortOption: String, CaseIterable {
    case newest = "Newest"
    case oldest = "Oldest"
    case favorites = "Favorites"
}

@Observable
final class IdeasViewModel {
    var ideas: [Idea] = []
    var settings: AppSettings = .default
    
    var searchQuery: String = ""
    var filterCategory: String? = nil
    var filterStatus: IdeaStatus? = nil
    var sortBy: SortOption = .newest
    
    var isLoading = false
    
    private let storage = StorageService.shared
    private let imageStorage = ImageStorageService.shared
    
    var filteredIdeas: [Idea] {
        var result = ideas
        
        if !searchQuery.trimmingCharacters(in: .whitespaces).isEmpty {
            let q = searchQuery.lowercased().trimmingCharacters(in: .whitespaces)
            result = result.filter {
                $0.title.lowercased().contains(q) ||
                $0.description.lowercased().contains(q) ||
                $0.tags.contains { $0.lowercased().contains(q) }
            }
        }
        
        if let cat = filterCategory {
            result = result.filter { $0.category == cat }
        }
        
        if let status = filterStatus {
            result = result.filter { $0.status == status }
        }
        
        switch sortBy {
        case .newest:
            result.sort { $0.createdAt > $1.createdAt }
        case .oldest:
            result.sort { $0.createdAt < $1.createdAt }
        case .favorites:
            result.sort { $0.isFavorite && !$1.isFavorite }
            result.sort { $0.createdAt > $1.createdAt }
        }
        
        return result
    }
    
    var allCategories: [String] {
        predefinedCategories + settings.customCategories
    }
    
    init() {
        load()
    }
    
    func load() {
        isLoading = true
        ideas = storage.loadIdeas()
        settings = storage.loadSettings()
        isLoading = false
    }
    
    func addIdea(
        title: String,
        description: String,
        category: String,
        tags: [String],
        status: IdeaStatus,
        problem: String? = nil,
        targetUsers: String? = nil,
        features: String? = nil,
        monetization: String? = nil,
        challenges: String? = nil,
        pendingImages: [UIImage] = [],
        pendingLinks: [(url: String, label: String?)] = []
    ) -> Idea {
        let now = Date()
        var idea = Idea(
            title: title,
            description: description,
            category: category.isEmpty ? "Other" : category,
            tags: tags,
            status: status,
            createdAt: now,
            lastActivityAt: now,
            isFavorite: false,
            problem: problem?.isEmpty == true ? nil : problem,
            targetUsers: targetUsers?.isEmpty == true ? nil : targetUsers,
            features: features?.isEmpty == true ? nil : features,
            monetization: monetization?.isEmpty == true ? nil : monetization,
            challenges: challenges?.isEmpty == true ? nil : challenges
        )
        
        for (i, image) in pendingImages.enumerated() {
            let filename = "img_\(Int(now.timeIntervalSince1970))_\(i).jpg"
            if let path = imageStorage.saveImage(image, toIdea: idea.id, filename: filename) {
                idea.images.append(path)
            }
        }
        
        for link in pendingLinks {
            idea.links.append(ReferenceLink(url: link.url, label: link.label))
        }
        
        ideas.append(idea)
        storage.saveIdeas(ideas)
        return idea
    }
    
    func updateIdea(_ id: UUID, updates: (inout Idea) -> Void) {
        guard let idx = ideas.firstIndex(where: { $0.id == id }) else { return }
        updates(&ideas[idx])
        ideas[idx].lastActivityAt = Date()
        storage.saveIdeas(ideas)
    }
    
    func deleteIdea(_ id: UUID) {
        imageStorage.deleteIdeaImages(ideaId: id)
        ideas.removeAll { $0.id == id }
        storage.saveIdeas(ideas)
    }
    
    func getIdea(by id: UUID) -> Idea? {
        ideas.first { $0.id == id }
    }
    
    func toggleFavorite(_ id: UUID) {
        guard let idx = ideas.firstIndex(where: { $0.id == id }) else { return }
        ideas[idx].isFavorite.toggle()
        storage.saveIdeas(ideas)
    }
    
    func addTask(to ideaId: UUID, title: String) {
        guard let idx = ideas.firstIndex(where: { $0.id == ideaId }) else { return }
        ideas[idx].tasks.append(IdeaTask(title: title))
        ideas[idx].lastActivityAt = Date()
        storage.saveIdeas(ideas)
    }
    
    func toggleTask(ideaId: UUID, taskId: UUID) {
        guard let idx = ideas.firstIndex(where: { $0.id == ideaId }),
              let taskIdx = ideas[idx].tasks.firstIndex(where: { $0.id == taskId }) else { return }
        ideas[idx].tasks[taskIdx].completed.toggle()
        ideas[idx].lastActivityAt = Date()
        storage.saveIdeas(ideas)
    }
    
    func deleteTask(ideaId: UUID, taskId: UUID) {
        guard let idx = ideas.firstIndex(where: { $0.id == ideaId }) else { return }
        ideas[idx].tasks.removeAll { $0.id == taskId }
        ideas[idx].lastActivityAt = Date()
        storage.saveIdeas(ideas)
    }
    
    func addLink(to ideaId: UUID, url: String, label: String? = nil) {
        guard let idx = ideas.firstIndex(where: { $0.id == ideaId }) else { return }
        ideas[idx].links.append(ReferenceLink(url: url, label: label))
        ideas[idx].lastActivityAt = Date()
        storage.saveIdeas(ideas)
    }
    
    func removeLink(from ideaId: UUID, linkId: UUID) {
        guard let idx = ideas.firstIndex(where: { $0.id == ideaId }) else { return }
        ideas[idx].links.removeAll { $0.id == linkId }
        ideas[idx].lastActivityAt = Date()
        storage.saveIdeas(ideas)
    }
    
    func addImage(to ideaId: UUID, image: UIImage) {
        guard let idx = ideas.firstIndex(where: { $0.id == ideaId }) else { return }
        let filename = "img_\(Int(Date().timeIntervalSince1970)).jpg"
        if let path = imageStorage.saveImage(image, toIdea: ideaId, filename: filename) {
            ideas[idx].images.append(path)
            ideas[idx].lastActivityAt = Date()
            storage.saveIdeas(ideas)
        }
    }
    
    func removeImage(from ideaId: UUID, path: String) {
        guard let idx = ideas.firstIndex(where: { $0.id == ideaId }) else { return }
        ideas[idx].images.removeAll { $0 == path }
        imageStorage.deleteImage(at: path)
        ideas[idx].lastActivityAt = Date()
        storage.saveIdeas(ideas)
    }
    
    func updateSettings(_ updates: (inout AppSettings) -> Void) {
        updates(&settings)
        storage.saveSettings(settings)
    }
    
    func addCustomCategory(_ name: String) {
        let trimmed = name.trimmingCharacters(in: .whitespaces)
        guard !trimmed.isEmpty, !settings.customCategories.contains(trimmed) else { return }
        settings.customCategories.append(trimmed)
        storage.saveSettings(settings)
    }
    
    func removeCustomCategory(_ name: String) {
        settings.customCategories.removeAll { $0 == name }
        storage.saveSettings(settings)
    }
}
