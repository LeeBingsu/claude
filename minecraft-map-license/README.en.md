# Map License

Lock one Minecraft world behind a **one-time activation code** that binds to the
player's account. No license server: everything needed to verify a code ships
inside the jar, so there is nothing to host and nothing to pay for.

Fabric · Minecraft 1.21.11 · Java 21

```
buy the map  →  get a code  →  install the mod, open the world  →  enter the code
             →  unlocked for that account, permanently
```

## Two kinds of code

| | Pool code | Account-bound code |
| --- | --- | --- |
| Who can redeem it | any account | one account, and only that one |
| Mint in advance | yes, thousands at a time | no — you need the buyer's username first |
| Rebuild needed per sale | no | yes (one button in CI) |
| **If the code leaks** | everyone who has it can use it | **useless to anyone else** |

Both work at the same time. Sell from a pre-minted pool when speed matters, and
bind a code to the buyer's account when leaks matter.

## What it stops, and what it does not

**Stops**

- *"Download the leaked zip and play."* The files alone are not enough.
- *Unpacking the jar to find codes, or to build a keygen.* Only salted digests
  ship in the jar, and no key that could mint new codes. Codes carry 80 bits of
  entropy, so the digest list gives an attacker nothing.
- *A buyer sharing their code around*, if it is account-bound.

**Does not stop**

- *A leaked pool code on another computer.* One-time use is recorded locally, so
  a fresh install has no memory of it. Use bound codes where this matters.
- *Revoking a code you already handed out.* There is no server to tell.
- *A cracked launcher that sets an arbitrary UUID.* Bound codes end code sharing
  between real accounts, not that.
- *Someone editing the jar.* Any check that runs on the player's machine can be
  removed by a determined attacker. This is true of all client-side DRM.

If you need revocation or genuine account verification, you need a license
server. This is the version that costs nothing to run.

**Removing the mod does not unlock the map — if you wire it in.** Each player's
licence state is mirrored into a `maplicense` scoreboard objective:

```mcfunction
execute if score @s maplicense matches 1 run function mymap:chapter1/start
```

Gate your map's progression on that score and a world opened without the mod
never advances. Skip this and the mod is only a speed bump. See STEP 2 of the
author guide.

## Quick start

Prefer no installs? Open [`dist/map_license_colab.ipynb`](dist/map_license_colab.ipynb)
in [Google Colab](https://colab.research.google.com/) and fill in the forms —
it installs Java, mints your codes and hands you the finished jar.

Locally you need JDK 21 and Python 3; Gradle comes from the wrapper.

```bash
# 1. In your finished map, as an operator, run /maplicense fingerprint
#    and copy the world name and seed into
#    src/main/resources/map-license/gate.json

# 2. Mint codes any account can redeem
python3 tools/generate_codes.py --count 200 \
    --out-codes tools/codes-batch1.txt \
    --out-hashes src/main/resources/map-license/codes.json

#    ...or a code only one buyer's account can redeem
python3 tools/generate_codes.py --count 1 --for-player <username> \
    --out-codes tools/codes-<username>.txt \
    --out-hashes src/main/resources/map-license/codes.json

# 3. Build
./gradlew clean build
```

Ship `build/libs/map-license-<highest version>.jar` with your map. It accepts
every code minted before it was built.

To mint from GitHub instead, the repository's *Issue map-license activation
codes* workflow does all of the above in one run and hands you the codes and a
matching jar as artifacts.

## Three things to do before your first release

1. Put your own world's name and seed in `src/main/resources/map-license/gate.json`.
2. Mint your own codes — the shipped `codes.json` is empty.
3. Change `INTEGRITY_KEY` in `src/main/java/net/jihoon/maplicense/LicenseStore.java`
   to any other text, so activation records from another build are not accepted
   by yours.

**Never commit or publish `tools/codes*.txt`.** Those are your real codes, they
cannot be recovered from the jar, and that file is the only copy. It is
gitignored; back it up somewhere else.

## Documentation

| File | For |
| --- | --- |
| [`dist/MAP-AUTHOR-GUIDE.txt`](dist/MAP-AUTHOR-GUIDE.txt) | map authors — the full walkthrough |
| [`dist/READ-ME-FIRST.txt`](dist/READ-ME-FIRST.txt) | your buyers — fill in the placeholders and ship it |
| [`dist/map_license_colab.ipynb`](dist/map_license_colab.ipynb) | doing all of it in a browser |
| [`USAGE.md`](USAGE.md) | players and authors, English and Korean |
| [`README.ko.md`](README.ko.md) | this document's Korean counterpart, in more depth |

## Commands

| Command | Level | Purpose |
| --- | --- | --- |
| `/maplicense activate <code>` | anyone | redeem a code |
| `/maplicense status` | anyone | check your own activation |
| `/maplicense fingerprint` | op 2 | print this world's name and seed |
| `/maplicense revoke <player>` | op 3 | unbind an account, leaving the code spent |

## Licence

MIT — see [LICENSE](LICENSE). Free to use for your own maps, commercial ones
included. The limits described above are real; please be honest with your
buyers about them rather than promising protection this cannot deliver.

Licensing mod by **Hi_Its_I**.
