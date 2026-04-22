import math

def test_chunking(duration_seconds):
    total_frames = math.ceil(duration_seconds * 30) + 15
    frames_per_lambda = min(total_frames, 450)
    chunk_count = math.ceil(total_frames / frames_per_lambda)
    
    print(f"Duration: {duration_seconds}s")
    print(f"Total Frames: {total_frames}")
    print(f"Frames per Lambda: {frames_per_lambda}")
    print(f"Chunk Count: {chunk_count}")
    if chunk_count >= 8:
        print("WARNING: High chunk count!")
    print("-" * 20)

test_chunking(15)  # Short
test_chunking(30)  # Medium
test_chunking(60)  # Long (Shorts limit)
test_chunking(90)  # Very long
test_chunking(120) # 2 mins
test_chunking(180) # 3 mins (Warning territory)
