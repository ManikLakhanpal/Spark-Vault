//
//  ImageStorageService.swift
//  SparkVault
//

import Foundation
import UIKit

final class ImageStorageService {
    static let shared = ImageStorageService()
    
    private let fileManager = FileManager.default
    
    private var ideasDirectory: URL {
        let docs = fileManager.urls(for: .documentDirectory, in: .userDomainMask)[0]
        return docs.appendingPathComponent("ideas", isDirectory: true)
    }
    
    private init() {}
    
    func ideaImagesDirectory(ideaId: UUID) -> URL {
        ideasDirectory.appendingPathComponent(ideaId.uuidString, isDirectory: true)
    }
    
    func saveImage(_ image: UIImage, toIdea ideaId: UUID, filename: String) -> String? {
        let dir = ideaImagesDirectory(ideaId: ideaId)
        try? fileManager.createDirectory(at: dir, withIntermediateDirectories: true)
        
        let fileURL = dir.appendingPathComponent(filename)
        guard let data = image.jpegData(compressionQuality: 0.8) else { return nil }
        
        do {
            try data.write(to: fileURL)
            return fileURL.path
        } catch {
            return nil
        }
    }
    
    func saveImage(from sourceURL: URL, toIdea ideaId: UUID, filename: String) -> String? {
        let dir = ideaImagesDirectory(ideaId: ideaId)
        try? fileManager.createDirectory(at: dir, withIntermediateDirectories: true)
        
        let destURL = dir.appendingPathComponent(filename)
        do {
            if fileManager.fileExists(atPath: destURL.path) {
                try fileManager.removeItem(at: destURL)
            }
            try fileManager.copyItem(at: sourceURL, to: destURL)
            return destURL.path
        } catch {
            return nil
        }
    }
    
    func deleteIdeaImages(ideaId: UUID) {
        let dir = ideaImagesDirectory(ideaId: ideaId)
        try? fileManager.removeItem(at: dir)
    }
    
    func deleteImage(at path: String) {
        let url = URL(fileURLWithPath: path)
        try? fileManager.removeItem(at: url)
    }
    
    func imageURL(for path: String) -> URL {
        URL(fileURLWithPath: path)
    }
}
