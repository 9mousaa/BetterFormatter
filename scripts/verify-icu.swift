#!/usr/bin/env swift

import Foundation

let root = CommandLine.arguments.dropFirst().first ?? "exports/fusion"
let rootURL = URL(fileURLWithPath: root, isDirectory: true)
let manager = FileManager.default
guard let enumerator = manager.enumerator(at: rootURL, includingPropertiesForKeys: nil) else {
    fputs("Unable to enumerate \(root)\n", stderr)
    exit(1)
}

var files = 0
var patterns = 0
var failures: [String] = []

for case let fileURL as URL in enumerator where fileURL.pathExtension == "json" {
    files += 1
    do {
        let data = try Data(contentsOf: fileURL)
        guard
            let object = try JSONSerialization.jsonObject(with: data) as? [String: Any],
            let filters = object["filters"] as? [[String: Any]]
        else {
            failures.append("\(fileURL.path): invalid Fusion schema")
            continue
        }
        for filter in filters {
            guard let id = filter["id"] as? String, let pattern = filter["pattern"] as? String else {
                failures.append("\(fileURL.path): filter missing id or pattern")
                continue
            }
            patterns += 1
            do {
                _ = try NSRegularExpression(pattern: pattern)
            } catch {
                failures.append("\(fileURL.lastPathComponent) \(id): \(error)")
            }
        }
    } catch {
        failures.append("\(fileURL.path): \(error)")
    }
}

if failures.isEmpty {
    print("Compiled \(patterns) ICU patterns across \(files) Fusion exports.")
} else {
    failures.forEach { fputs("\($0)\n", stderr) }
    exit(1)
}
