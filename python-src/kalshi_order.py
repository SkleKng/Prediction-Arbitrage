import os
import time
import json
import base64
import uuid
import requests
from urllib.parse import urlparse
from dotenv import load_dotenv
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.asymmetric import padding

load_dotenv()

API_KEY = os.getenv("KALSHI_API_KEY")
API_SECRET = os.getenv("KALSHI_API_SECRET")

def load_private_key(private_key_str: str):
    """Loads the RSA private key from the string in .env"""
    if "-----BEGIN RSA PRIVATE KEY-----" in private_key_str and "\n" not in private_key_str:
        private_key_str = private_key_str.replace("-----BEGIN RSA PRIVATE KEY-----", "-----BEGIN RSA PRIVATE KEY-----\n")
        private_key_str = private_key_str.replace("-----END RSA PRIVATE KEY-----", "\n-----END RSA PRIVATE KEY-----")
        body = private_key_str.split("\n")[1]
        formatted_body = "\n".join(body[i:i+64] for i in range(0, len(body), 64))
        private_key_str = f"-----BEGIN RSA PRIVATE KEY-----\n{formatted_body}\n-----END RSA PRIVATE KEY-----"

    return serialization.load_pem_private_key(
        private_key_str.encode('utf-8'),
        password=None
    )

def sign_request(private_key, timestamp: str, method: str, path: str):
    """Signs the request using RSA-PSS with SHA256"""
    path_without_query = urlparse(path).path
    message = f"{timestamp}{method}{path_without_query}".encode('utf-8')
    signature = private_key.sign(
        message,
        padding.PSS(
            mgf=padding.MGF1(hashes.SHA256()),
            salt_length=padding.PSS.DIGEST_LENGTH
        ),
        hashes.SHA256()
    )
    return base64.b64encode(signature).decode('utf-8')

def get_headers(method: str, path: str):
    """Generates the required Kalshi authentication headers"""
    timestamp = str(int(time.time() * 1000))
    private_key = load_private_key(API_SECRET)
    signature = sign_request(private_key, timestamp, method, path)

    return {
        "Content-Type": "application/json",
        "KALSHI-ACCESS-KEY": API_KEY,
        "KALSHI-ACCESS-SIGNATURE": signature,
        "KALSHI-ACCESS-TIMESTAMP": timestamp,
    }

def place_order(ticker: str, action: str, side: str, count: int, price_cents: int):
    """
    Places an order for the specified count of contracts.
    
    :param ticker: The market ticker (e.g., 'INFLATION-2024-DEC')
    :param action: 'buy' or 'sell'
    :param side: 'yes' or 'no'
    :param count: Number of contracts
    :param price_cents: The limit price in cents (1 to 99)
    """
    path = "/trade-api/v2/portfolio/orders"
    url = "https://api.elections.kalshi.com" + path

    body_dict = {
        "ticker": ticker,
        "action": action,
        "side": side,
        "count": count,
        "type": "limit",
        "client_order_id": str(uuid.uuid4())
    }
    
    if side.lower() == "yes":
        body_dict["yes_price"] = price_cents
    else:
        body_dict["no_price"] = price_cents

    body = json.dumps(body_dict)
    headers = get_headers("POST", path)

    response = requests.post(url, headers=headers, data=body)

    try:
        return response.json()
    except Exception:
        return response.text

if __name__ == "__main__":
    # Example usage:
    print("Placing order...")
    result = place_order(
        ticker="KXPRESNOMD-28-GN",
        action="buy",
        side="yes",
        count=1,
        price_cents=1 # Limit price in cents
    )
    print(json.dumps(result, indent=2))
