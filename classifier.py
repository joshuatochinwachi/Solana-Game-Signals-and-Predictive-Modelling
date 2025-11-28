import requests
import base64

RPC_URL = "https://api.mainnet-beta.solana.com"

ADDRESSES = [
    "AURYydfxJib1ZkTir1Jn1J9ECYUtjb6rKQVmtYaixWPP",
    "FysGks3izhgVhrUkub9QQWCTEVAdhkZKYSNK2F25maGD",
    "8xcrYR3BbaP6kB6ULThfU1RQdhNStJWa12g43oRC264K",
    "prt1sxymaSoH5R6ZFyAnmMrqp9XbuyDXbBWnHg3XuLJ",
    "PRTLSwfLzpVGSAQiUfXEenJkq1cwTsEcsn1hPL9zwwg",
    "7BTwdrCXtHhWHcAVm8mSzrkvaqLLbdr4MbtEprap1iVK",
    "52Rh8epudA3qvLmyP1YCavRWrNV8As1JcW5xMU7mJEj9",
    "axso1MBZ8Hz3RdBGeyDcvc3xP5R3YNfLYqREHRvwY2t",
    "9EAJcobaecvUtVMje7fPYB5XtRpz9twBm3Sf96E5vE3N",
    "AeoKB9KY81tpyVY9NxPUr5hKmHzjMC9AccnUZ64HrCwY",
    "9LPAkJxA7FUKw5MYmYnwwr1w3bSGCWfi7QQpD69jX3ur",
    "H53UGEyBrB9easo9ego8yYk7o4Zq1G5cCtkxD3E3hZav",
    "jUpa2aDCzvdR9EF4fqDXmuyMUkonPTohphABLmRkRFj",
    "CREWiq8qbxvo4SKkAFpVnc6t7CRQC4tAAscsNAENXgrJ",
    "traderDnaR5w6Tcoi3NFm53i48FTDNbGjBSZwWXDRrg",
    "SAGE2HAwep459SNq61LHvjxPk4pLPEJLoMETef7f7EE",
    "CRAFT2RPXPJWCEix4WpJST3E7NLf79GTqZUL75wngXo5",
    "Cargo2VNTPPTi9c1vq1Jw5d3BWUNr18MjRtSupAghKEk",
    "SRSLY1fq9TJqCk1gNSE7VZL2bztvTn9wm4VR8u8jMKT",
    "pprofELXjL5Kck7Jn5hCpwAL82DpTkSYBENzahVtbc9",
    "pv1ttom8tbyh83C1AVh6QH2naGRdVQUVt3HY1Yst5sv",
    "pFACSRuobDmvfMKq1bAzwj27t6d2GJhSCHb1VcfnRmq",
    "Point2iBvz7j5TMVef8nEgpmz4pDr7tU7v3RjAfkQbM",
    "PsToRxhEPScGt1Bxpm7zNDRzaMk31t8Aox7fyewoVse",
    "APR1MEny25pKupwn72oVqMH4qpDouArsX8zX4VwwfoXD",
    "STAKEr4Bh8sbBMoAVmTDBRqouPzgdocVrvtjmhJhd65",
    "FLEET1qqzpexyaDpqb2DGsSzE2sDCizewCg9WjrA6DBW",
    "TESTWCwvEv2idx6eZVQrFFdvEJqGHfVA1soApk2NFKQ",
    "gateVwTnKyFrE8nxUUgfzoZTPKgJQZUbLsEidpG4Dp2",
    "ATLocKpzDbTokxgvnLew3d7drZkEzLzDpzwgrgWKDbmc",
    "Lock7kBijGCQLEFAmXcengzXKA88iDNQPriQ7TbgeyG",
    "snapNQkxsiqDWdbNfz8KVB7e3NPzLwtHHA6WV8kKgUc",
    "FACTNmq2FhA2QNTnGM2aWJH3i7zT3cND5CgvjYTjyVYe",
    "SAGEqqFewepDHH6hMDcmWy7yjHPpyKLDnRXKb3Ki8e6",
    "Cargo8a1e6NkGyrjy4BQEW4ASGKs9KSyDyUrXMfpJoiH",
    "Craftf1EGzEoPFJ1rpaTSQG1F6hhRRBAf4gRo9hdSZjR",
    "GAMEzqJehF8yAnKiTARUuhZMvLvkZVAsCVri5vSfemLr",
    "GameYNgVLn9kd8BQcbHm8jNMqJHWhcZ1YTNy6Pn3FXo5",
    "WATErpZ2ZBjgAxyttoEjckuTuCe9pEckSabCeENLTYq",
    "FireKR7LgjyzjsLnxaNZwa7dnJncDSidD4cXGhTGz2eU",
    "woodN5KSiHEAhaCrZVh3vScGta7u6r5Vp3UbqDFuD4e",
    "Meta1cQ29N8S4cSwJScHZYtXV6J5Cy55oEA8vRVhh8K",
    "EaRtHRxHp1ftdfnJFds9UrCDNaSGxhdnRUucevNr1DzA",
    "seeD1wGXYWjio2dcok5DyYKDoVfeVgMASoi7azfyrr4",
    "seEd25X22orRqPEhkM7c7PUYu11D8VPPYWQgVsM2K7v",
    "seeD3ySNdK1kM9phjJrvYQ2csmUwCxYwV7n1z6U5rwz",
    "SEED4sAHMmLKwiwndkPPCyGcY53i9RMoPagzXbHtpyK",
    "SeEd5UUxqXqNEzdtbris3KojzrzKWVrVXFgLPq1rwB1",
    "SEED686AzjeJvEB1eB9J8tEUzDX7WyixcraeDznDJiV",
    "GENEtH5amGSi8kHAtQoezp1XEXwZJ8vcuePYnXdKrMYz",
    "GkpbHQu2zYmJxyp93p9wTX3uHjsFt8ZGeomVwZkGwXLH",
    "kiGenopAScF8VF31Zbtx2Hg8qA5ArGqvnVtXb83sotc",
    "kiTkNc7nYAu8dLKjQFYPx3BqdzwagZGBUrcb7d4nbN5",
    "3dgCCb15HMQSA4Pn3Tfii5vRk7aRqTH95LJjxzsG2Mug",
    "HbSgCfKD1WyS19gUBbn13oAWFvXtZ8CnfGbr35VVTvB5",
    "Aszem3qCJHPNrhrXyyV8iiC3b8nPiFVL5vDAKxsDpump",
    "NYANpAp9Cr7YarBNrby7Xx4xU6No6JKTBuohNA3yscP",
    "Dooar9JkhdZ7J3LHN3A7YCuoGRUggXhQaG4kijfLGU2j",
    "AFbX8oGjGpmVFywbVouvhQSRmiW2aR1mohfahi4Y2AdB",
    "7i5KKsX2weiTkry7jA4ZwSuXGhs5eJBEjY8vVxR4pfRx"
]


def rpc(method, params):
    """Send an RPC request."""
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": method,
        "params": params
    }
    r = requests.post(RPC_URL, json=payload)
    return r.json()


def get_account_info(address):
    """Get low-level account info."""
    resp = rpc("getAccountInfo", [address, {"encoding": "jsonParsed"}])
    return resp.get("result", {}).get("value", None)


def is_program(account_info):
    return account_info.get("executable", False)


def is_token_mint(account_info):
    data = account_info.get("data", {})
    return isinstance(data, dict) and data.get("parsed", {}).get("type") == "mint"


def is_token_account(account_info):
    data = account_info.get("data", {})
    return isinstance(data, dict) and data.get("parsed", {}).get("type") == "account"


def get_detailed_mint_info(account_info):
    """Extract detailed mint information including supply, decimals, and authorities."""
    data = account_info.get("data", {})
    parsed = data.get("parsed", {})
    info = parsed.get("info", {})
    
    supply = int(info.get("supply", 0))
    decimals = info.get("decimals", 0)
    mint_authority = info.get("mintAuthority")
    freeze_authority = info.get("freezeAuthority")
    
    return {
        "supply": supply,
        "decimals": decimals,
        "mint_authority": mint_authority,
        "freeze_authority": freeze_authority
    }


def classify_token_type(mint_info):
    """Classify token into NFT, Fungible Token, or Semi-Fungible Token."""
    supply = mint_info["supply"]
    decimals = mint_info["decimals"]
    mint_authority = mint_info["mint_authority"]
    
    # NFT: Supply of 1, 0 decimals, no mint authority (can't mint more)
    if supply == 1 and decimals == 0 and mint_authority is None:
        return "NFT (Non-Fungible Token)"
    
    # Master Edition NFT or Print Edition: Supply of 1, 0 decimals, but has mint authority
    elif supply == 1 and decimals == 0 and mint_authority is not None:
        return "NFT Master/Print Edition"
    
    # Semi-Fungible Token: Supply > 1, 0 decimals
    elif supply > 1 and decimals == 0:
        return f"Semi-Fungible Token (Supply: {supply:,})"
    
    # Fungible Token with no more minting possible
    elif decimals > 0 and mint_authority is None:
        actual_supply = supply / (10 ** decimals)
        return f"Fungible Token - Fixed Supply ({actual_supply:,.{decimals}f})"
    
    # Fungible Token with minting still possible
    elif decimals > 0 and mint_authority is not None:
        actual_supply = supply / (10 ** decimals)
        return f"Fungible Token - Mintable ({actual_supply:,.{decimals}f})"
    
    # Edge case: 0 supply
    elif supply == 0:
        return "Empty Token (0 supply)"
    
    else:
        return f"Unknown Token Type (Supply: {supply}, Decimals: {decimals})"


def classify_address(address):
    info = get_account_info(address)

    if not info:
        return address, "Unknown (No account found)"

    # Program?
    if is_program(info):
        return address, "Program"

    # Token Mint?
    if is_token_mint(info):
        mint_info = get_detailed_mint_info(info)
        token_type = classify_token_type(mint_info)
        return address, token_type

    # Token Account?
    if is_token_account(info):
        return address, "Token Account"

    # PDA / Data account
    owner = info.get("owner")
    raw_data = info.get("data")

    # Determine size depending on data format
    if isinstance(raw_data, dict):
        data_size = raw_data.get("size")
    elif isinstance(raw_data, list):
        try:
            decoded = base64.b64decode(raw_data[0])
            data_size = len(decoded)
        except:
            data_size = None
    else:
        data_size = None

    return address, f"PDA / Data Account (Owner = {owner}, Size = {data_size})"


# ----------------------------
# RUN CLASSIFICATION
# ----------------------------
print("Starting classification...\n")
results = []
for i, addr in enumerate(ADDRESSES, 1):
    print(f"Processing {i}/{len(ADDRESSES)}: {addr[:8]}...")
    results.append(classify_address(addr))

# Print output
print("\n" + "="*100)
print("CLASSIFICATION RESULTS")
print("="*100 + "\n")

for addr, ctype in results:
    print(f"{addr}: {ctype}")

# Print summary statistics
print("\n" + "="*100)
print("SUMMARY")
print("="*100 + "\n")

type_counts = {}
for _, ctype in results:
    # Simplify type for counting
    if "NFT" in ctype:
        key = "NFTs"
    elif "Fungible Token" in ctype:
        key = "Fungible Tokens"
    elif "Semi-Fungible" in ctype:
        key = "Semi-Fungible Tokens"
    elif "Program" in ctype:
        key = "Programs"
    elif "Token Account" in ctype:
        key = "Token Accounts"
    elif "PDA" in ctype:
        key = "PDA/Data Accounts"
    else:
        key = "Other"
    
    type_counts[key] = type_counts.get(key, 0) + 1

for type_name, count in sorted(type_counts.items()):
    print(f"{type_name}: {count}")

print(f"\nTotal addresses analyzed: {len(ADDRESSES)}")