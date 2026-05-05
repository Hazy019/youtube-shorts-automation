import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import os
from google_auth_oauthlib.flow import InstalledAppFlow


SCOPES = [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/youtube.force-ssl',
    'https://www.googleapis.com/auth/yt-analytics.readonly'
]

def force_refresh_tokens():
    print("="*40)
    print("GOOGLE TOKEN REFRESH PROTOCOL (V6)")
    print("="*40)
    
    if not os.path.exists('client_secrets.json'):
        print("ERROR: client_secrets.json missing. Download it from Google Cloud Console first!")
        return

    print("\nWHICH CHANNEL ARE YOU AUTHENTICATING?")
    print("1. Hazy Insight (Primary)")
    print("2. New US Channel (Secondary)")
    print("3. Both (Sequential)")
    
    choice = input("\nEnter choice (1/2/3): ").strip()
    
    targets = []
    if choice == '1':
        targets = [('token_drive.json', 'token_youtube_hazy.json')]
    elif choice == '2':
        targets = [('token_drive.json', 'token_youtube_us.json')]
    else:
        targets = [
            ('token_drive.json', 'token_youtube_hazy.json'),
            ('token_drive.json', 'token_youtube_us.json')
        ]

    for drive_file, yt_file in targets:
        print(f"\n--- AUTHENTICATING FOR: {yt_file} ---")
        
        # We delete specifically to force a new browser login if needed
        if os.path.exists(yt_file):
            os.remove(yt_file)
            print(f"Deleted old {yt_file}")

        print("\nOpening browser for authentication...")
        print(f"Select the CORRECT Google account for {yt_file}!")
        
        flow = InstalledAppFlow.from_client_secrets_file('client_secrets.json', SCOPES)
        creds = flow.run_local_server(port=0)

        # Drive token is shared or unique? Usually shared Drive, but let's update it anyway
        with open(drive_file, 'w') as f:
            f.write(creds.to_json())
        with open(yt_file, 'w') as f:
            f.write(creds.to_json())
        
        # For legacy compatibility, also copy the first one to token_youtube.json
        if not os.path.exists('token_youtube.json'):
            with open('token_youtube.json', 'w') as f:
                f.write(creds.to_json())

    print("\n" + "="*40)
    print("SUCCESS! AUTHENTICATION COMPLETE.")
    print("="*40)
    print("1. Tokens generated for your selected channels.")
    print("2. Copy their contents to GitHub Secrets (YOUTUBE_TOKEN_HAZY, YOUTUBE_TOKEN_US, etc.).")
    print("="*40)

if __name__ == "__main__":
    force_refresh_tokens()
