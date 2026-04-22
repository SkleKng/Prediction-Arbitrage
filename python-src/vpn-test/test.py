import subprocess
import requests
import time
import sys

# Detect Homebrew path based on architecture
OPENVPN_PATH = "/opt/homebrew/sbin/openvpn"
CONFIG_FILE = "/Users/vimalvenkat/dev/Repos/Prediction-Arbitrage/python-src/vpn-test/mx-free-2.protonvpn.udp.ovpn"
CREDS_FILE = "/Users/vimalvenkat/dev/Repos/Prediction-Arbitrage/python-src/vpn-test/credentials.txt"

def connect_vpn():
    print("🚀 Initializing Canada Tunnel...")
    
    # On macOS, OpenVPN often needs the full path to the binary
    command = [
        "sudo", OPENVPN_PATH,
        "--config", CONFIG_FILE,
        "--auth-user-pass", CREDS_FILE,
        "--script-security", "2"
    ]
    
    try:
        # Popen starts it in the background
        subprocess.Popen(command)
        print("Waiting 10s for tunnel stable...")
        time.sleep(10) 
    except Exception as e:
        print(f"Failed to start VPN: {e}")

def get_status():
    try:
        # Check current IP and Country
        res = requests.get('https://polymarket.com/api/geoblock', timeout=5).json()
        print(f"📍 Connected! res:\n {res}")
    except:
        print("❌ Tunnel failed or request timed out.")

def kill_vpn():
    print("\n🛑 Closing tunnel...")
    subprocess.run(["sudo", "killall", "openvpn"])

if __name__ == "__main__":
    try:
        connect_vpn()
        get_status()
        # Your scraping/request code goes here!
    finally:
        kill_vpn()