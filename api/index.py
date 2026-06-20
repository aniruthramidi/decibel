import sys
from pathlib import Path

# Add the server directory to python path so it can import successfully
server_dir = Path(__file__).parent.parent / "decibel-web" / "server"
sys.path.append(str(server_dir))

from main import app
