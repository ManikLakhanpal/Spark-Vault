//
//  EditIdeaView.swift
//  SparkVault
//

import SwiftUI
import PhotosUI

struct EditIdeaView: View {
    @Environment(IdeasViewModel.self) private var viewModel
    @Environment(\.dismiss) private var dismiss
    
    let ideaId: UUID
    
    @State private var title = ""
    @State private var description = ""
    @State private var category = ""
    @State private var tagsStr = ""
    @State private var status: IdeaStatus = .idea
    @State private var problem = ""
    @State private var targetUsers = ""
    @State private var features = ""
    @State private var monetization = ""
    @State private var challenges = ""
    @State private var newLinkURL = ""
    @State private var newLinkLabel = ""
    @State private var selectedPhotoItem: PhotosPickerItem?
    
    private var idea: Idea? { viewModel.getIdea(by: ideaId) }
    
    private var photoPickerBinding: Binding<PhotosPickerItem?> {
        Binding(
            get: { selectedPhotoItem },
            set: { newValue in
                selectedPhotoItem = newValue
                guard let newValue else { return }
                Task {
                    if let data = try? await newValue.loadTransferable(type: Data.self),
                       let image = UIImage(data: data) {
                        viewModel.addImage(to: ideaId, image: image)
                    }
                    await MainActor.run { selectedPhotoItem = nil }
                }
            }
        )
    }
    
    var body: some View {
        Group {
            if let idea = idea {
                Form {
                    basicSection
                    attachmentsSection(idea: idea)
                    expansionSection
                }
            } else {
                ContentUnavailableView("Idea not found", systemImage: "questionmark.circle")
            }
        }
        .navigationTitle("Edit Idea")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .confirmationAction) {
                Button("Save") { save() }
            }
        }
        .onAppear {
            if let idea = idea {
                title = idea.title
                description = idea.description
                category = idea.category
                tagsStr = idea.tags.joined(separator: ", ")
                status = idea.status
                problem = idea.problem ?? ""
                targetUsers = idea.targetUsers ?? ""
                features = idea.features ?? ""
                monetization = idea.monetization ?? ""
                challenges = idea.challenges ?? ""
            }
        }
    }
    
    private var basicSection: some View {
        Section("Basic") {
            TextField("Title", text: $title)
            TextField("Description", text: $description, axis: .vertical)
                .lineLimit(3...6)
            
            Picker("Category", selection: $category) {
                ForEach(viewModel.allCategories, id: \.self) { cat in
                    Text(cat).tag(cat)
                }
            }
            
            TextField("Tags (comma-separated)", text: $tagsStr)
            
            Picker("Status", selection: $status) {
                ForEach(IdeaStatus.allCases, id: \.self) { s in
                    Text(s.label).tag(s)
                }
            }
        }
    }
    
    private func attachmentsSection(idea: Idea) -> some View {
        Section("Images & Links") {
            PhotosPicker(selection: photoPickerBinding, matching: .images) {
                Label("Add Image", systemImage: "photo.fill")
            }
            
            if !idea.images.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(idea.images, id: \.self) { path in
                            ZStack(alignment: .topTrailing) {
                                if let uiImage = UIImage(contentsOfFile: path) {
                                    Image(uiImage: uiImage)
                                        .resizable()
                                        .scaledToFill()
                                        .frame(width: 80, height: 80)
                                        .clipped()
                                        .cornerRadius(8)
                                }
                                Button {
                                    viewModel.removeImage(from: ideaId, path: path)
                                } label: {
                                    Image(systemName: "xmark.circle.fill")
                                        .foregroundStyle(.red)
                                }
                                .offset(x: 8, y: -8)
                            }
                        }
                    }
                }
            }
            
            HStack {
                TextField("URL", text: $newLinkURL)
                    .keyboardType(.URL)
                TextField("Label (optional)", text: $newLinkLabel)
                Button("Add") {
                    let url = newLinkURL.trimmingCharacters(in: .whitespaces)
                    guard !url.isEmpty else { return }
                    viewModel.addLink(to: ideaId, url: url, label: newLinkLabel.isEmpty ? nil : newLinkLabel)
                    newLinkURL = ""
                    newLinkLabel = ""
                }
            }
            
            ForEach(idea.links) { link in
                HStack {
                    Text(link.label ?? link.url)
                        .lineLimit(1)
                    Spacer()
                    Button(role: .destructive) {
                        viewModel.removeLink(from: ideaId, linkId: link.id)
                    } label: {
                        Image(systemName: "trash")
                    }
                }
            }
        }
    }
    
    private var expansionSection: some View {
        Section("Expansion") {
            TextField("Problem it solves", text: $problem, axis: .vertical)
                .lineLimit(2...4)
            TextField("Target users", text: $targetUsers, axis: .vertical)
                .lineLimit(2...4)
            TextField("Possible features", text: $features, axis: .vertical)
                .lineLimit(2...4)
            TextField("Monetization", text: $monetization, axis: .vertical)
                .lineLimit(2...4)
            TextField("Challenges", text: $challenges, axis: .vertical)
                .lineLimit(2...4)
        }
    }
    
    private func save() {
        let trimmedTitle = title.trimmingCharacters(in: .whitespaces)
        guard !trimmedTitle.isEmpty else { return }
        
        let category = category.trimmingCharacters(in: .whitespaces)
        let tags = tagsStr.split(separator: ",").map { $0.trimmingCharacters(in: .whitespaces) }.filter { !$0.isEmpty }
        
        viewModel.updateIdea(ideaId) { idea in
            idea.title = trimmedTitle
            idea.description = description.trimmingCharacters(in: .whitespaces)
            idea.category = category.isEmpty ? "Other" : category
            idea.tags = tags
            idea.status = status
            idea.problem = problem.isEmpty ? nil : problem
            idea.targetUsers = targetUsers.isEmpty ? nil : targetUsers
            idea.features = features.isEmpty ? nil : features
            idea.monetization = monetization.isEmpty ? nil : monetization
            idea.challenges = challenges.isEmpty ? nil : challenges
        }
        
        dismiss()
    }
}

#Preview {
    NavigationStack {
        EditIdeaView(ideaId: UUID())
            .environment(IdeasViewModel())
    }
}
