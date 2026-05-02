import subprocess
import sys

def install(package):
    subprocess.check_call([sys.executable, "-m", "pip", "install", "--upgrade", package])

if __name__ == "__main__":
    print("Resolving dependency conflicts...")
    # websockets < 16 for realtime
    install("websockets>=13.0,<16.0")
    # google-genai requirements
    install("anyio>=4.8.0")
    install("google-auth>=2.48.1")
    install("tenacity>=8.2.3")
    print("Done!")
