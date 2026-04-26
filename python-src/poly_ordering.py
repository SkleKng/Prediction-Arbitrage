import subprocess
import requests
import time
import os
from dotenv import load_dotenv

from py_clob_client.clob_types import OrderType, MarketOrderArgs, PartialCreateOrderOptions
from py_clob_client.order_builder.constants import BUY
from py_clob_client.client import ClobClient

load_dotenv()

# ── VPN Config ────────────────────────────────────────────────────────────────
OPENVPN_PATH = "/opt/homebrew/opt/openvpn/sbin/openvpn"
BASE_DIR    = os.path.dirname(os.path.abspath(__file__))
CONFIG_FILE = os.path.join(BASE_DIR, "vpn-test", "mx-free-2.protonvpn.udp.ovpn")
CREDS_FILE  = os.path.join(BASE_DIR, "vpn-test", "credentials.txt")

# ── Polymarket Config ─────────────────────────────────────────────────────────
HOST          = "https://clob.polymarket.com"
CHAIN_ID      = 137
PRIVATE_KEY   = os.getenv("POLY_PRIVATE_KEY")
WALLET_ADDRESS = os.getenv("WALLET_ADDRESS")

# ── VPN Helpers ───────────────────────────────────────────────────────────────
def connect_vpn() -> subprocess.Popen:
    print("🚀 Initializing VPN tunnel...")
    command = [
        "sudo", OPENVPN_PATH,
        "--config", CONFIG_FILE,
        "--auth-user-pass", CREDS_FILE,
        "--script-security", "2",
    ]
    proc = subprocess.Popen(command)
    print("⏳ Waiting 10s for tunnel to stabilise...")
    time.sleep(10)
    return proc


def check_geoblock() -> bool:
    """Returns True if Polymarket is accessible (not geoblocked)."""
    try:
        res = requests.get("https://polymarket.com/api/geoblock", timeout=10).json()
        print(f"📍 Geoblock status: {res}")
        return not res.get("blocked", True)
    except Exception as e:
        print(f"❌ Geoblock check failed: {e}")
        return False


def kill_vpn():
    print("\n🛑 Closing VPN tunnel...")
    subprocess.run(["sudo", "killall", "openvpn"])


# ── Polymarket Helpers ────────────────────────────────────────────────────────
def build_client() -> ClobClient:
    temp_client = ClobClient(HOST, key=PRIVATE_KEY, chain_id=CHAIN_ID)
    api_creds   = temp_client.create_or_derive_api_creds()
    return ClobClient(
        HOST,
        key=PRIVATE_KEY,
        chain_id=CHAIN_ID,
        creds=api_creds,
        signature_type=2,
        funder=WALLET_ADDRESS,
    )


def buy_market_order(client: ClobClient, token_id: str, amount: float, max_price: float):
    tick_size = client.get_tick_size(token_id)
    neg_risk  = client.get_neg_risk(token_id)

    order = client.create_market_order(
        MarketOrderArgs(
            token_id=token_id,
            side=BUY,
            amount=amount,
            price=max_price,
        ),
        PartialCreateOrderOptions(
            tick_size=tick_size,
            neg_risk=neg_risk,
        ),
    )
    return client.post_order(order, OrderType.FAK)


# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    vpn_proc = connect_vpn()

    try:
        if not check_geoblock():
            print("🚫 Still geoblocked after VPN — aborting.")
            return

        client   = build_client()
        response = buy_market_order(
            client,
            token_id="8501497159083948713316135768103773293754490207922884688769443031624417212426",
            amount=1,
            max_price=0.99,
        )
        print("✅ Order response:", response)

    except Exception as e:
        print(f"💥 Error during order: {e}")
        raise

    finally:
        kill_vpn()


if __name__ == "__main__":
    main()