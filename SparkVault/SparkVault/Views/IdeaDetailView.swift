//
//  IdeaDetailView.swift
//  SparkVault
//

import SwiftUI
import PhotosUI

struct IdeaDetailView: View {
    @Environment(IdeasViewModel.self) private var viewModel
    @Environment(\.dismiss) private var dismiss
    
    let ideaId: UUID
    
    @State private var newTaskTitle = ""
    @State private var showDeleteAlert = false
    @State private var selectedPhotoItem: PhotosPickerItem?
    
    private var idea: Idea? { viewModel.getIdea(by: ideaId) }
    private let accentColor = Color(red: 0.96, green: 0.62, blue: 0.04)
    
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
                detailContent(idea: idea)
            } else {
                ContentUnavailableView("Idea not found", systemImage: "questionmark.circle")
            }
        }
        .navigationTitle(idea?.title ?? "Idea")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                if let idea = idea {
                    Button {
                        viewModel.toggleFavorite(idea.id)
                    } label: {
                        Image(systemName: idea.isFavorite ? "star.fill" : "star")
                            .foregroundStyle(idea.isFavorite ? accentColor : .primary)
                    }
                }
            }
            ToolbarItem(placement: .secondaryAction) {
                if idea != nil {
                    NavigationLink {
                        EditIdeaView(ideaId: ideaId)
                    } label: {
                        Label("Edit", systemImage: "pencil")
                    }
                }
            }
        }
        .alert("Delete Idea", isPresented: $showDeleteAlert) {
            Button("Cancel", role: .cancel) {}
            Button("Delete", role: .destructive) {
                viewModel.deleteIdea(ideaId)
                dismiss()
            }
        } message: {
            if let idea = idea {
                Text("Are you sure you want to delete \"\(idea.title)\"?")
            }
        }
    }
    
    @ViewBuilder
    private func detailContent(idea: Idea) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                metaSection(idea: idea)
                if !idea.description.isEmpty { descriptionSection(idea: idea) }
                if !idea.tags.isEmpty { tagsSection(idea: idea) }
                if !idea.images.isEmpty { imagesSection(idea: idea) }
                if !idea.links.isEmpty { linksSection(idea: idea) }
                if hasExpansion(idea: idea) { expansionSection(idea: idea) }
                tasksSection(idea: idea)
                deleteButton
            }
            .padding()
        }
    }
    
    private func metaSection(idea: Idea) -> some View {
        HStack {
            Text(idea.category)
                .font(.subheadline)
                .foregroundStyle(.secondary)
            Image(systemName: idea.status.iconName)
                .font(.subheadline)
                .foregroundStyle(.secondary)
            Text(idea.status.label)
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
    }
    
    private func descriptionSection(idea: Idea) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Description")
                .font(.headline)
            Text(idea.description)
        }
    }
    
    private func tagsSection(idea: Idea) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Tags")
                .font(.headline)
            FlowLayout(spacing: 8) {
                ForEach(idea.tags, id: \.self) { tag in
                    Text(tag)
                        .font(.caption)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(Color.secondary.opacity(0.2))
                        .cornerRadius(8)
                }
            }
        }
    }
    
    private func imagesSection(idea: Idea) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("Images")
                    .font(.headline)
                Spacer()
                PhotosPicker(selection: photoPickerBinding, matching: .images) {
                    Label("Add", systemImage: "plus")
                }
            }
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    ForEach(idea.images, id: \.self) { path in
                        ZStack(alignment: .topTrailing) {
                            if let uiImage = UIImage(contentsOfFile: path) {
                                Image(uiImage: uiImage)
                                    .resizable()
                                    .scaledToFill()
                                    .frame(width: 100, height: 100)
                                    .clipped()
                                    .cornerRadius(8)
                            }
                            Button {
                                viewModel.removeImage(from: ideaId, path: path)
                            } label: {
                                Image(systemName: "xmark.circle.fill")
                                    .foregroundStyle(.white)
                                    .background(Circle().fill(.red))
                            }
                            .offset(x: 8, y: -8)
                        }
                    }
                }
            }
        }
    }
    
    private func linksSection(idea: Idea) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Links")
                .font(.headline)
            ForEach(idea.links) { link in
                Link(destination: URL(string: link.url) ?? URL(string: "https://")!) {
                    HStack {
                        Image(systemName: "link")
                            .foregroundStyle(accentColor)
                        Text(link.label ?? link.url)
                            .lineLimit(1)
                            .foregroundStyle(accentColor)
                    }
                    .padding(.vertical, 8)
                }
                .contextMenu {
                    Button(role: .destructive) {
                        viewModel.removeLink(from: ideaId, linkId: link.id)
                    } label: {
                        Label("Remove", systemImage: "trash")
                    }
                }
            }
        }
    }
    
    private func hasExpansion(idea: Idea) -> Bool {
        [idea.problem, idea.targetUsers, idea.features, idea.monetization, idea.challenges]
            .contains { $0 != nil && !($0 ?? "").isEmpty }
    }
    
    private func expansionSection(idea: Idea) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Expansion")
                .font(.headline)
            
            if let problem = idea.problem, !problem.isEmpty {
                expansionField("Problem it solves", value: problem)
            }
            if let targetUsers = idea.targetUsers, !targetUsers.isEmpty {
                expansionField("Target users", value: targetUsers)
            }
            if let features = idea.features, !features.isEmpty {
                expansionField("Possible features", value: features)
            }
            if let monetization = idea.monetization, !monetization.isEmpty {
                expansionField("Monetization", value: monetization)
            }
            if let challenges = idea.challenges, !challenges.isEmpty {
                expansionField("Challenges", value: challenges)
            }
        }
    }
    
    private func expansionField(_ label: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label)
                .font(.subheadline.bold())
            Text(value)
        }
    }
    
    private func tasksSection(idea: Idea) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Tasks")
                .font(.headline)
            
            HStack {
                TextField("Add a task...", text: $newTaskTitle)
                    .onSubmit { addTask() }
                Button("Add") { addTask() }
            }
            
            ForEach(idea.tasks) { task in
                HStack {
                    Button {
                        viewModel.toggleTask(ideaId: ideaId, taskId: task.id)
                    } label: {
                        HStack(spacing: 8) {
                            Image(systemName: task.completed ? "checkmark.circle.fill" : "circle")
                                .foregroundStyle(task.completed ? .green : .secondary)
                            Text(task.title)
                                .strikethrough(task.completed)
                                .foregroundStyle(task.completed ? .secondary : .primary)
                        }
                    }
                    Spacer()
                    Button(role: .destructive) {
                        viewModel.deleteTask(ideaId: ideaId, taskId: task.id)
                    } label: {
                        Image(systemName: "trash")
                            .font(.caption)
                    }
                }
                .padding(.vertical, 4)
            }
        }
    }
    
    private var deleteButton: some View {
        Button(role: .destructive) {
            showDeleteAlert = true
        } label: {
            HStack {
                Image(systemName: "trash.fill")
                Text("Delete Idea")
            }
            .frame(maxWidth: .infinity)
            .padding()
        }
    }
    
    private func addTask() {
        let title = newTaskTitle.trimmingCharacters(in: .whitespaces)
        guard !title.isEmpty else { return }
        viewModel.addTask(to: ideaId, title: title)
        newTaskTitle = ""
    }
}

#Preview {
    NavigationStack {
        IdeaDetailView(ideaId: UUID())
            .environment(IdeasViewModel())
    }
}
