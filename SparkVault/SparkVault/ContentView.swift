//
//  ContentView.swift
//  SparkVault
//
//  Created by Manik Lakhanpal on 08/03/2026.
//

import SwiftUI

struct ContentView: View {
    var body: some View {
        TabView {
            VaultView()
                .tabItem {
                    Label("Vault", systemImage: "house.fill")
                }
            SettingsView()
                .tabItem {
                    Label("Settings", systemImage: "gearshape.fill")
                }
        }
    }
}

#Preview {
    ContentView()
        .environment(IdeasViewModel())
}
