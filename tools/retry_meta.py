import os
import sys

# Add parent dir to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.utils.meta_healer import perform_meta_recovery

if __name__ == "__main__":
    perform_meta_recovery()
