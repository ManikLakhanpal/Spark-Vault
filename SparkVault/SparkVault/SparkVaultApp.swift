//
//  SparkVaultApp.swift
//  SparkVault
//
//  Created by Manik Lakhanpal on 08/03/2026.
//

import SwiftUI

@main
struct SparkVaultApp: App {
    @State private var viewModel = IdeasViewModel()
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(viewModel)
        }
    }
}
