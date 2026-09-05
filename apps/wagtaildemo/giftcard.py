# Safe test gift-card generator (for development/testing only)
# Produces tokens prefixed with "TEST-" so they cannot be mistaken for real cards.

import secrets
import hashlib
import hmac
import time

def generate_test_card(token_prefix="TEST-", token_len=12, pin_len=6):
    # token: alphanumeric test token (non-numeric, non-real)
    token = token_prefix + secrets.token_hex(token_len//2)[:token_len]
    # secure numeric PIN for testing (still treat as sensitive)
    pin = ''.join(str(secrets.randbelow(10)) for _ in range(pin_len))
    # store only a hashed PIN (example: HMAC-SHA256 with an application secret)
    app_secret = b'your_app_secret_here'  # keep secret in env/config
    pin_hash = hmac.new(app_secret, pin.encode(), hashlib.sha256).hexdigest()
    # metadata
    created_at = time.time()
    return {"token": token, "pin_plain_for_dev_only": pin, "pin_hash": pin_hash, "created_at": created_at}

# Example usage
for _ in range(3):
    print(generate_test_card())
