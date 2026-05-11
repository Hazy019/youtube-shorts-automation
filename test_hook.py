from src.ai.brain import generate_viral_package

print("Generating script...")
topic, package, was_queued = generate_viral_package("general", [])
print("\n=== SCRIPT PREVIEW ===")
print(f"Topic: {topic}")
print(f"Hook:  {package['segments'][0]['voiceover']}")
print(f"Line2: {package['segments'][1]['voiceover']}")
