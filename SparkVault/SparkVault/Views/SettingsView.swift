//
//  SettingsView.swift
//  SparkVault
//

import SwiftUI

struct SettingsView: View {
    @Environment(IdeasViewModel.self) private var viewModel
    
    @State private var newCategoryName = ""
    @State private var categoryToRemove: String?
    
    var body: some View {
        NavigationStack {
            Form {
                remindersSection
                customCategoriesSection
            }
            .navigationTitle("Settings")
            .alert("Remove category", isPresented: .init(
                get: { categoryToRemove != nil },
                set: { if !$0 { categoryToRemove = nil } }
            )) {
                Button("Cancel", role: .cancel) { categoryToRemove = nil }
                Button("Remove", role: .destructive) {
                    if let name = categoryToRemove {
                        viewModel.removeCustomCategory(name)
                        categoryToRemove = nil
                    }
                }
            } message: {
                if let name = categoryToRemove {
                    Text("Remove \"\(name)\"? Ideas using this category will keep it until you edit them.")
                }
            }
        }
    }
    
    private var remindersSection: some View {
        Section("Reminders") {
            Toggle("Enable reminders", isOn: Binding(
                get: { viewModel.settings.remindersEnabled },
                set: { newValue in viewModel.updateSettings { $0.remindersEnabled = newValue } }
            ))
            
            Picker("Remind after (days)", selection: Binding(
                get: { viewModel.settings.reminderDays },
                set: { newValue in viewModel.updateSettings { $0.reminderDays = newValue } }
            )) {
                ForEach([3, 5, 7, 14, 30], id: \.self) { days in
                    Text("\(days)").tag(days)
                }
            }
        }
    }
    
    private var customCategoriesSection: some View {
        Section {
            Text("Add your own categories in addition to: \(predefinedCategories.joined(separator: ", "))")
                .font(.caption)
                .foregroundStyle(.secondary)
            
            HStack {
                TextField("New category name", text: $newCategoryName)
                Button("Add") {
                    addCategory()
                }
            }
            
            ForEach(viewModel.settings.customCategories, id: \.self) { cat in
                HStack {
                    Text(cat)
                    Spacer()
                    Button(role: .destructive) {
                        categoryToRemove = cat
                    } label: {
                        Image(systemName: "trash")
                    }
                }
            }
        } header: {
            Text("Custom categories")
        }
    }
    
    private func addCategory() {
        let trimmed = newCategoryName.trimmingCharacters(in: .whitespaces)
        guard !trimmed.isEmpty else { return }
        guard !predefinedCategories.contains(trimmed) else { return }
        guard !viewModel.settings.customCategories.contains(trimmed) else { return }
        viewModel.addCustomCategory(trimmed)
        newCategoryName = ""
    }
}

#Preview {
    SettingsView()
        .environment(IdeasViewModel())
}
