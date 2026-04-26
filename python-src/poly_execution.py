from py_clob_client.clob_types import OrderType
from py_clob_client.order_builder.constants import BUY
from py_clob_client.client import ClobClient
import os
from dotenv import load_dotenv
load_dotenv()
from py_clob_client.clob_types import MarketOrderArgs, OrderType, PartialCreateOrderOptions
from py_clob_client.order_builder.constants import BUY

def buy_market_order(client, token_id: str, amount: float, max_price: float):
    tick_size = client.get_tick_size(token_id)
    neg_risk = client.get_neg_risk(token_id)

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

host = "https://clob.polymarket.com"
chain_id = 137  # Polygon mainnet
private_key = os.getenv("POLY_PRIVATE_KEY")  # your wallet's private key
wallet_address = os.getenv("WALLET_ADDRESS")  # your wallet's private key

# Derives API credentials from your wallet (creates them if they don't exist)
temp_client = ClobClient(host, key=private_key, chain_id=chain_id)
api_creds = temp_client.create_or_derive_api_creds()

# Full trading client
client = ClobClient(
    host,
    key=private_key,
    chain_id=chain_id,
    creds=api_creds,
    signature_type=2,       # 0 = EOA (regular wallet)
    funder=wallet_address
)

# testing
response = buy_market_order(client, token_id="8501497159083948713316135768103773293754490207922884688769443031624417212426", amount=1, max_price=0.99)
print(response)
