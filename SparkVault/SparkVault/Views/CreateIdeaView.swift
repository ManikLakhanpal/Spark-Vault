//
//  CreateIdeaView.swift
//  SparkVault
//

import SwiftUI
import PhotosUI

struct CreateIdeaView: View {
    @Environment(IdeasViewModel.self) private var viewModel
    @Environment(\.dismiss) private var dismiss
    
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
    @State private var pendingImages: [UIImage] = []
    @State private var pendingLinks: [(url: String, label: String?)] = []
    @State private var newLinkURL = ""
    @State private var newLinkLabel = ""
    @State private var showImagePicker = false
    @State private var selectedPhotoItem: PhotosPickerItem?
    
    var body: some View {
        NavigationStack {
            Form {
                basicSection
                attachmentsSection
                expansionSection
            }
            .navigationTitle("New Idea")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") { save() }
                }
            }
        }
    }
    
    private var basicSection: some View {
        Section("Basic") {
            TextField("Title", text: $title)
            TextField("Description", text: $description, axis: .vertical)
                .lineLimit(3...6)
            
            Picker("Category", selection: $category) {
                Text("Select").tag("")
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
    
    private var photoPickerBinding: Binding<PhotosPickerItem?> {
        Binding<PhotosPickerItem?>(
            get: { selectedPhotoItem },
            set: { newValue in
                selectedPhotoItem = newValue
                guard let newValue else { return }

                Task {
                    if let data = try? await newValue.loadTransferable(type: Data.self),
                       let image = UIImage(data: data) {

                        await MainActor.run {
                            pendingImages.append(image)
                            selectedPhotoItem = nil
                        }

                    } else {
                        await MainActor.run {
                            selectedPhotoItem = nil
                        }
                    }
                }
            }
        )
    }
    
    private var attachmentsSection: some View {
        Section("Images & Links") {
            PhotosPicker(
                selection: photoPickerBinding,
                matching: .images
            ) {
                Label("Add Image", systemImage: "photo.fill")
            }
            
            if !pendingImages.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(Array(pendingImages.enumerated()), id: \.offset) { index, img in
                            Image(uiImage: img)
                                .resizable()
                                .scaledToFill()
                                .frame(width: 80, height: 80)
                                .clipped()
                                .cornerRadius(8)
                                .overlay(alignment: .topTrailing) {
                                    Button {
                                        pendingImages.remove(at: index)
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
                    pendingLinks.append((url: url, label: newLinkLabel.isEmpty ? nil : newLinkLabel))
                    newLinkURL = ""
                    newLinkLabel = ""
                }
            }
            
            ForEach(Array(pendingLinks.enumerated()), id: \.offset) { index, link in
                HStack {
                    Text(link.label ?? link.url)
                        .lineLimit(1)
                    Spacer()
                    Button(role: .destructive) {
                        pendingLinks.remove(at: index)
                    } label: {
                        Image(systemName: "trash")
                    }
                }
            }
        }
    }
    
    private var expansionSection: some View {
        Section("Expansion (optional)") {
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
        
        let categoryValue = category.trimmingCharacters(in: .whitespaces)
        let tags = tagsStr.split(separator: ",").map { $0.trimmingCharacters(in: .whitespaces) }.filter { !$0.isEmpty }
        
        _ = viewModel.addIdea(
            title: trimmedTitle,
            description: description.trimmingCharacters(in: .whitespaces),
            category: categoryValue.isEmpty ? "Other" : categoryValue,
            tags: tags,
            status: status,
            problem: problem.isEmpty ? nil : problem,
            targetUsers: targetUsers.isEmpty ? nil : targetUsers,
            features: features.isEmpty ? nil : features,
            monetization: monetization.isEmpty ? nil : monetization,
            challenges: challenges.isEmpty ? nil : challenges,
            pendingImages: pendingImages,
            pendingLinks: pendingLinks
        )
        
        dismiss()
    }
}

#Preview {
    CreateIdeaView()
        .environment(IdeasViewModel())
}
