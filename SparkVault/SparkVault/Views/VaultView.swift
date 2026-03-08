//
//  VaultView.swift
//  SparkVault
//

import SwiftUI

struct VaultView: View {
    @Environment(IdeasViewModel.self) private var viewModel
    @State private var showFilters = false
    @State private var showCreate = false
    @State private var ideaToDelete: Idea?
    
    private let accentColor = Color(red: 0.96, green: 0.62, blue: 0.04)
    
    var body: some View {
        NavigationStack {
            Group {
                if viewModel.isLoading {
                    ProgressView("Loading...")
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if viewModel.filteredIdeas.isEmpty {
                    emptyState
                } else {
                    ideaList
                }
            }
            .navigationTitle("SparkVault")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button {
                        showCreate = true
                    } label: {
                        Image(systemName: "plus.circle.fill")
                            .font(.title)
                            .foregroundStyle(accentColor)
                    }
                }
            }
            .searchable(text: Binding(
                get: { viewModel.searchQuery },
                set: { viewModel.searchQuery = $0 }
            ), prompt: "Search ideas...")
            .sheet(isPresented: $showCreate) {
                CreateIdeaView()
            }
            .alert("Delete Idea", isPresented: .init(
                get: { ideaToDelete != nil },
                set: { if !$0 { ideaToDelete = nil } }
            )) {
                Button("Cancel", role: .cancel) { ideaToDelete = nil }
                Button("Delete", role: .destructive) {
                    if let idea = ideaToDelete {
                        viewModel.deleteIdea(idea.id)
                        ideaToDelete = nil
                    }
                }
            } message: {
                if let idea = ideaToDelete {
                    Text("Are you sure you want to delete \"\(idea.title)\"?")
                }
            }
        }
    }
    
    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "lightbulb.fill")
                .font(.system(size: 64))
                .foregroundStyle(.secondary)
            Text("No ideas yet")
                .font(.title2.bold())
            Text("Tap the + button to capture your first idea.")
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding()
    }
    
    private var ideaList: some View {
        List {
            filterSection
            sortSection
            
            ForEach(viewModel.filteredIdeas) { idea in
                NavigationLink(value: idea) {
                    IdeaCardView(idea: idea, accentColor: accentColor)
                }
                .contextMenu {
                    Button(role: .destructive) {
                        ideaToDelete = idea
                    } label: {
                        Label("Delete", systemImage: "trash")
                    }
                }
            }
        }
        .listStyle(.plain)
        .navigationDestination(for: Idea.self) { idea in
            IdeaDetailView(ideaId: idea.id)
        }
    }
    
    @ViewBuilder
    private var filterSection: some View {
        Section {
            DisclosureGroup("Filters") {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Category").font(.subheadline.bold())
                    FlowLayout(spacing: 8) {
                        FilterChip(title: "All", isSelected: viewModel.filterCategory == nil) {
                            viewModel.filterCategory = nil
                        }
                        ForEach(viewModel.allCategories, id: \.self) { cat in
                            FilterChip(title: cat, isSelected: viewModel.filterCategory == cat) {
                                viewModel.filterCategory = cat
                            }
                        }
                    }
                    
                    Text("Status").font(.subheadline.bold())
                    FlowLayout(spacing: 8) {
                        FilterChip(title: "All", isSelected: viewModel.filterStatus == nil) {
                            viewModel.filterStatus = nil
                        }
                        ForEach(IdeaStatus.allCases, id: \.self) { status in
                            FilterChip(title: status.label, isSelected: viewModel.filterStatus == status) {
                                viewModel.filterStatus = status
                            }
                        }
                    }
                }
            }
        }
    }
    
    private var sortSection: some View {
        Section {
            Picker("Sort by", selection: Binding(
                get: { viewModel.sortBy },
                set: { viewModel.sortBy = $0 }
            )) {
                ForEach(SortOption.allCases, id: \.self) { opt in
                    Text(opt.rawValue).tag(opt)
                }
            }
            .pickerStyle(.segmented)
        }
    }
}

struct IdeaCardView: View {
    let idea: Idea
    let accentColor: Color
    
    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            if let firstImage = idea.images.first {
                Image(uiImage: UIImage(contentsOfFile: firstImage) ?? UIImage())
                    .resizable()
                    .scaledToFill()
                    .frame(width: 56, height: 56)
                    .clipped()
                    .cornerRadius(8)
            } else {
                RoundedRectangle(cornerRadius: 8)
                    .fill(Color.secondary.opacity(0.2))
                    .frame(width: 56, height: 56)
                    .overlay {
                        Image(systemName: "lightbulb.fill")
                            .foregroundStyle(.secondary)
                    }
            }
            
            VStack(alignment: .leading, spacing: 4) {
                Text(idea.title)
                    .font(.headline)
                    .lineLimit(1)
                Text(idea.description.isEmpty ? "No description" : idea.description)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .lineLimit(2)
                HStack(spacing: 6) {
                    Text(idea.category)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Image(systemName: idea.status.iconName)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Text(idea.status.label)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            
            Spacer()
            
            if idea.isFavorite {
                Image(systemName: "star.fill")
                    .foregroundStyle(accentColor)
            }
        }
        .padding(.vertical, 4)
    }
}

struct FilterChip: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.caption)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(isSelected ? Color.accentColor : Color.clear)
                .foregroundStyle(isSelected ? .white : .primary)
                .cornerRadius(8)
        }
    }
}

struct FlowLayout: Layout {
    var spacing: CGFloat = 8
    
    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let result = arrange(proposal: proposal, subviews: subviews)
        return result.size
    }
    
    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let result = arrange(proposal: proposal, subviews: subviews)
        for (index, subview) in subviews.enumerated() {
            subview.place(at: CGPoint(x: bounds.minX + result.positions[index].x, y: bounds.minY + result.positions[index].y), proposal: .unspecified)
        }
    }
    
    private func arrange(proposal: ProposedViewSize, subviews: Subviews) -> (size: CGSize, positions: [CGPoint]) {
        let maxWidth = proposal.width ?? .infinity
        var positions: [CGPoint] = []
        var x: CGFloat = 0
        var y: CGFloat = 0
        var rowHeight: CGFloat = 0
        
        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if x + size.width > maxWidth && x > 0 {
                x = 0
                y += rowHeight + spacing
                rowHeight = 0
            }
            positions.append(CGPoint(x: x, y: y))
            rowHeight = max(rowHeight, size.height)
            x += size.width + spacing
        }
        
        return (CGSize(width: maxWidth, height: y + rowHeight), positions)
    }
}

#Preview {
    VaultView()
        .environment(IdeasViewModel())
}
