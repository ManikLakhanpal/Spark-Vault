//
//  Idea.swift
//  SparkVault
//

import Foundation

enum IdeaStatus: String, Codable, CaseIterable, Hashable {
    case idea
    case researching
    case building
    case launched
    case abandoned
    
    var label: String {
        switch self {
        case .idea: return "Idea"
        case .researching: return "Researching"
        case .building: return "Building"
        case .launched: return "Launched"
        case .abandoned: return "Abandoned"
        }
    }
    
    var iconName: String {
        switch self {
        case .idea: return "lightbulb.fill"
        case .researching: return "magnifyingglass"
        case .building: return "hammer.fill"
        case .launched: return "paperplane.fill"
        case .abandoned: return "xmark.circle.fill"
        }
    }
}

struct ReferenceLink: Identifiable, Codable, Equatable, Hashable {
    let id: UUID
    var url: String
    var label: String?
    
    init(id: UUID = UUID(), url: String, label: String? = nil) {
        self.id = id
        self.url = url
        self.label = label
    }
}

struct IdeaTask: Identifiable, Codable, Equatable, Hashable {
    let id: UUID
    var title: String
    var completed: Bool
    
    init(id: UUID = UUID(), title: String, completed: Bool = false) {
        self.id = id
        self.title = title
        self.completed = completed
    }
}

struct Idea: Identifiable, Codable, Hashable {
    let id: UUID
    var title: String
    var description: String
    var category: String
    var tags: [String]
    var status: IdeaStatus
    var createdAt: Date
    var lastActivityAt: Date?
    var isFavorite: Bool
    var images: [String]
    var links: [ReferenceLink]
    var problem: String?
    var targetUsers: String?
    var features: String?
    var monetization: String?
    var challenges: String?
    var tasks: [IdeaTask]
    
    init(
        id: UUID = UUID(),
        title: String,
        description: String = "",
        category: String,
        tags: [String] = [],
        status: IdeaStatus = .idea,
        createdAt: Date = Date(),
        lastActivityAt: Date? = nil,
        isFavorite: Bool = false,
        images: [String] = [],
        links: [ReferenceLink] = [],
        problem: String? = nil,
        targetUsers: String? = nil,
        features: String? = nil,
        monetization: String? = nil,
        challenges: String? = nil,
        tasks: [IdeaTask] = []
    ) {
        self.id = id
        self.title = title
        self.description = description
        self.category = category
        self.tags = tags
        self.status = status
        self.createdAt = createdAt
        self.lastActivityAt = lastActivityAt ?? createdAt
        self.isFavorite = isFavorite
        self.images = images
        self.links = links
        self.problem = problem
        self.targetUsers = targetUsers
        self.features = features
        self.monetization = monetization
        self.challenges = challenges
        self.tasks = tasks
    }
}

struct AppSettings: Codable {
    var remindersEnabled: Bool
    var reminderDays: Int
    var customCategories: [String]
    
    static let `default` = AppSettings(
        remindersEnabled: true,
        reminderDays: 7,
        customCategories: []
    )
}

let predefinedCategories = ["App", "Startup", "Book", "Content", "Story", "Other"]
