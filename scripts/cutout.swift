// Lifts the foreground subject (person, chair, laptop) out of video frames with Apple Vision —
// the same on-device model as "Copy Subject" in Photos. Output keeps the full frame size with a
// transparent background, so each cutout lines up pixel-for-pixel with its source frame.
//
// Usage: swift scripts/cutout.swift <inDir with 001.png…> <outDir> <count>
import CoreImage
import Foundation
import Vision

let args = CommandLine.arguments
guard args.count == 4, let count = Int(args[3]) else {
    print("usage: swift cutout.swift <inDir> <outDir> <count>")
    exit(1)
}
let inDir = URL(fileURLWithPath: args[1])
let outDir = URL(fileURLWithPath: args[2])
try FileManager.default.createDirectory(at: outDir, withIntermediateDirectories: true)

let context = CIContext()
let srgb = CGColorSpace(name: CGColorSpace.sRGB)!

for i in 0..<count {
    let source = inDir.appendingPathComponent(String(format: "%03d.png", i + 1))
    let handler = VNImageRequestHandler(url: source)
    let request = VNGenerateForegroundInstanceMaskRequest()
    try handler.perform([request])
    guard let observation = request.results?.first else {
        print("no subject found in \(source.lastPathComponent)")
        exit(2)
    }
    let masked = try observation.generateMaskedImage(
        ofInstances: observation.allInstances, from: handler, croppedToInstancesExtent: false)
    let target = outDir.appendingPathComponent(String(format: "%03d.png", i))
    try context.writePNGRepresentation(
        of: CIImage(cvPixelBuffer: masked), to: target, format: .RGBA8, colorSpace: srgb)
}
print("cutouts: \(count)")
