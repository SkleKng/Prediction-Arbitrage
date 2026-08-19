from web3 import Web3
import os
from dotenv import load_dotenv
load_dotenv()

# USDC on Polygon
USDC_ADDRESS = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"
SPENDER      = "0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E"  # CTF Exchange
RPC_URL      = os.getenv("POLYGON_RPC_URL") or "https://polygon-rpc.com"  # public fallback; set POLYGON_RPC_URL in .env for Alchemy/Infura

USDC_ABI = [
    {
        "name": "approve",
        "type": "function",
        "inputs": [
            {"name": "spender", "type": "address"},
            {"name": "amount",  "type": "uint256"},
        ],
        "outputs": [{"name": "", "type": "bool"}],
    }
]

w3           = Web3(Web3.HTTPProvider(RPC_URL))
private_key  = os.getenv("POLY_PRIVATE_KEY")
wallet       = os.getenv("WALLET_ADDRESS")

usdc = w3.eth.contract(address=Web3.to_checksum_address(USDC_ADDRESS), abi=USDC_ABI)

tx = usdc.functions.approve(
    Web3.to_checksum_address(SPENDER),
    2**256 - 1,  # max approval
).build_transaction({
    "from":     wallet,
    "nonce":    w3.eth.get_transaction_count(wallet),
    "gas":      100_000,
    "gasPrice": w3.eth.gas_price,
})

signed = w3.eth.account.sign_transaction(tx, private_key)
tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
print("Approval tx:", tx_hash.hex())

receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
print("Status:", "✅ Success" if receipt.status == 1 else "❌ Failed")