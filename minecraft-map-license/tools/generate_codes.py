#!/usr/bin/env python3
"""Mint activation codes for the map-license mod.

Produces two files:

  * a plaintext list of codes - the batch you hand out to buyers, and the only
    place these codes will ever exist. Keep it, back it up, never ship it.
  * codes.json - salted SHA-256 digests only, which is what goes in the jar.

Re-running against an existing codes.json keeps its salt and appends to its
digest list, so a second batch does not invalidate the first.

Pool codes - redeemable by any account:

    python3 tools/generate_codes.py --count 200 \
        --out-codes tools/codes-batch1.txt \
        --out-hashes src/main/resources/map-license/codes.json

Account-bound codes - redeemable only by the account they were minted for,
so a leaked code is useless to anyone else:

    python3 tools/generate_codes.py --count 1 --for-player Notch \
        --out-codes tools/codes-notch.txt \
        --out-hashes src/main/resources/map-license/codes.json
"""

import argparse
import base64
import hashlib
import json
import os
import re
import secrets
import sys
import urllib.error
import urllib.request

# Crockford base32: no I, L, O or U, so nothing in a code can be misread as
# something else when a buyer types it off a receipt.
ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"


def make_code(length: int, group: int) -> str:
    body = "".join(secrets.choice(ALPHABET) for _ in range(length))
    if group <= 0:
        return body
    return "-".join(body[i:i + group] for i in range(0, len(body), group))


def normalize(code: str) -> str:
    """Must match LicenseCodes.normalize on the Java side, character for character."""
    folded = {"I": "1", "L": "1", "O": "0", "U": "V"}
    out = []
    for char in code.upper():
        char = folded.get(char, char)
        if char in ALPHABET:
            out.append(char)
    return "".join(out)


def digest(salt: bytes, code: str, owner: str | None = None) -> str:
    """Must match LicenseCodes.digest on the Java side, byte for byte."""
    sha = hashlib.sha256()
    sha.update(salt)
    sha.update(normalize(code).encode("utf-8"))
    if owner is not None:
        sha.update(owner.encode("utf-8"))
    return base64.b64encode(sha.digest()).decode("ascii")


UUID_PATTERN = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$")


def dash_uuid(undashed: str) -> str:
    """Mojang returns UUIDs unhyphenated; Java's UUID.toString has hyphens."""
    return "-".join([undashed[:8], undashed[8:12], undashed[12:16], undashed[16:20], undashed[20:]])


def lookup_uuid(username: str) -> str:
    """Resolves a Minecraft username to the account UUID the mod will see."""
    url = f"https://api.mojang.com/users/profiles/minecraft/{username}"
    try:
        with urllib.request.urlopen(url, timeout=15) as response:
            profile = json.load(response)
    except urllib.error.HTTPError as error:
        if error.code in (204, 404):
            raise SystemExit(f"No Minecraft account named '{username}'. Check the spelling with the buyer.")
        raise SystemExit(f"Could not reach Mojang ({error}). Retry, or pass --for-uuid if you know the UUID.")
    except urllib.error.URLError as error:
        raise SystemExit(f"Could not reach Mojang ({error.reason}). "
                         "Retry, or pass --for-uuid if you know the UUID.")

    if "id" not in profile:
        raise SystemExit(f"Mojang returned no id for '{username}'.")

    uuid = dash_uuid(profile["id"].lower())
    print(f"{profile.get('name', username)} -> {uuid}")
    return uuid


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate activation codes for map-license.")
    parser.add_argument("--count", type=int, default=100, help="how many codes to mint")
    parser.add_argument("--length", type=int, default=16, help="characters per code (16 = 80 bits)")
    parser.add_argument("--group", type=int, default=4, help="hyphen group size, 0 for none")
    parser.add_argument("--out-codes", default="tools/codes.txt", help="plaintext list to keep private")
    parser.add_argument("--out-hashes", default="src/main/resources/map-license/codes.json",
                        help="digest list to embed in the jar")
    parser.add_argument("--for-player", metavar="USERNAME",
                        help="bind these codes to one Minecraft account (looked up via Mojang)")
    parser.add_argument("--for-uuid", metavar="UUID",
                        help="bind these codes to an account UUID directly, skipping the lookup")
    args = parser.parse_args()

    if args.count < 1:
        parser.error("--count must be at least 1")
    if args.length < 12:
        parser.error("--length below 12 leaves codes guessable; use 16 or more")
    if args.for_player and args.for_uuid:
        parser.error("pass either --for-player or --for-uuid, not both")

    owner = None
    if args.for_uuid:
        owner = args.for_uuid.strip().lower()
        if not UUID_PATTERN.match(owner):
            parser.error("--for-uuid must look like 069a79f4-44e9-4726-a5be-fca90e38aaf5")
    elif args.for_player:
        owner = lookup_uuid(args.for_player.strip())

    salt = secrets.token_bytes(16)
    existing = []
    existing_bound = []

    if os.path.exists(args.out_hashes):
        with open(args.out_hashes, encoding="utf-8") as handle:
            previous = json.load(handle)
        stored_salt = base64.b64decode(previous.get("salt", ""))
        existing = previous.get("hashes", [])
        existing_bound = previous.get("boundHashes", [])
        # An all-zero salt is the placeholder shipped in the repo; anything else
        # is a real batch whose digests must stay verifiable.
        if stored_salt and any(stored_salt):
            salt = stored_salt
            print(f"Reusing salt from {args.out_hashes} "
                  f"({len(existing)} pool + {len(existing_bound)} bound code(s) already embedded)")
        else:
            existing = []
            existing_bound = []

    codes = []
    seen = set()
    while len(codes) < args.count:
        code = make_code(args.length, args.group)
        if code in seen:
            continue
        seen.add(code)
        codes.append(code)

    minted = [digest(salt, code, owner) for code in codes]

    if owner is None:
        hashes = list(dict.fromkeys(existing + minted))
        bound_hashes = existing_bound
    else:
        hashes = existing
        bound_hashes = list(dict.fromkeys(existing_bound + minted))

    os.makedirs(os.path.dirname(os.path.abspath(args.out_codes)), exist_ok=True)
    with open(args.out_codes, "w", encoding="utf-8") as handle:
        if owner is not None:
            # The binding is invisible in the code itself, so record who each
            # batch belongs to. Give the wrong code to the wrong buyer and it
            # simply reads as invalid, with nothing to explain why.
            handle.write(f"# bound to account {owner}\n")
        handle.write("\n".join(codes) + "\n")

    os.makedirs(os.path.dirname(os.path.abspath(args.out_hashes)), exist_ok=True)
    with open(args.out_hashes, "w", encoding="utf-8") as handle:
        json.dump({
            "_comment": "Salted SHA-256 digests of every code this build accepts. "
                        "'hashes' are redeemable by any account; 'boundHashes' only by the "
                        "account they were minted for. Generated by tools/generate_codes.py - "
                        "do not hand-edit.",
            "salt": base64.b64encode(salt).decode("ascii"),
            "hashes": hashes,
            "boundHashes": bound_hashes,
        }, handle, indent="\t")
        handle.write("\n")

    kind = f"account-bound ({owner})" if owner else "pool"
    print(f"Wrote {len(codes)} new {kind} code(s) to {args.out_codes}")
    print(f"{args.out_hashes} now holds {len(hashes)} pool + {len(bound_hashes)} bound digest(s)")
    print("Rebuild the mod so the new digests end up in the jar.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
