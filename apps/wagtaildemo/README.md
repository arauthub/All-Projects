# 🎁 Wagtail Demo: Modular Django Extension & Cryptographic Utilities

> Specialized Django and Wagtail extension modules demonstrating secure development token generation, HMAC verification, and custom service components.

[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![Django](https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=white)](https://djangoproject.com)
[![Cryptography](https://img.shields.io/badge/Security-HMAC--SHA256-orange?style=for-the-badge)](https://en.wikipedia.org/wiki/HMAC)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](../../LICENSE)

---

## 🌟 Overview & Components

### 1. Cryptographically Secure Dev Token Generator (`giftcard.py`)
* Produces prefixed test tokens (`TEST-XXXX...`) that cannot be mistaken for production financial artifacts.
* Implements **HMAC-SHA256** one-way hashing for secure PIN verification without storing plain text in database tables.
* Uses Python's standard `secrets` module for cryptographically sound pseudorandom number generation.

---

## 🚀 Running the Utility

```bash
cd apps/wagtaildemo
python3 giftcard.py
```

### Example Output:
```json
{
  "token": "TEST-a3f89e21b0cd",
  "pin_plain_for_dev_only": "849201",
  "pin_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "created_at": 1790435800.12
}
```

---

## 👤 Author & Monorepo
* **Engineer**: Abhijeet Raut ([@arauthub](https://github.com/arauthub))
* **Repository**: [`All-Projects/apps/wagtaildemo`](https://github.com/arauthub/All-Projects/tree/main/apps/wagtaildemo)
