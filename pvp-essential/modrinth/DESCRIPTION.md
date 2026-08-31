# PvP Essential

**A balanced multiplayer PvP ruleset in a single vanilla datapack — no mods, no plugins.**

PvP Essential rebalances the parts of vanilla combat that tend to break multiplayer fights: infinite pearl/totem stacking, oppressive mace and spear spam, crystal/anchor one-shots, and combat logging. Drop it into your server's world and it just works.

- ✅ **100% vanilla datapack** — server-side only, clients need nothing
- ✅ **1.21.11 → 26.2** and built to keep working on future versions
- ✅ Tested on real **1.21.11 / 26.1 / 26.1.2 / 26.2** servers

---

## Features

| Rule | What it does |
|------|--------------|
| **Ender Pearl cap** | Inventory limited to **16** ender pearls; extras are removed automatically |
| **Totem cap** | Inventory limited to **2** Totems of Undying |
| **Mace cooldown** | After a successful smash attack, the mace goes on a **30s** cooldown (normal melee still works) |
| **Spear Lunge cooldown** | After a Lunge, the enchantment is disabled for **10s** (the spear itself stays usable) |
| **Crystal & anchor safety** | End Crystal and Respawn Anchor explosion damage is reduced to **0** for players (knockback preserved) — TNT and creepers are **unaffected** |
| **No elytra in combat** | Gliding is blocked while in combat; if you're already gliding, it stops |
| **No riptide in combat** | The Riptide enchantment is temporarily removed while in combat |
| **Combat logging = death** | Disconnecting while in combat kills you the moment you log back in |
| **Bulk golden apples** | 8 Gold Blocks + 1 Golden Apple → **32 Golden Apples** |
| **PvP gear chest** | 9 Diamond Blocks → a chest with a full enchanted diamond kit |
| **Random armor chest** | 1 Diamond Block + 8 Diamonds → a chest of 4 random-enchanted diamond pieces |

### What counts as "in combat"

You enter combat for **10 seconds** whenever you deal or take damage from another player. The attacker is tagged too, so hit-and-run with an elytra — or a quick logout — won't save anyone. Mob, fall, lava and other non-PvP damage never triggers combat. A small action-bar timer shows your remaining combat time and any weapon cooldowns.

---

## Installation

1. Download `pvp_essential.zip`.
2. Put it in your world's datapack folder:
   ```
   server/
     world/
       datapacks/
         pvp_essential.zip
   ```
3. Restart the server or run `/reload`.
4. Run `/datapack list` — you should see `file/pvp_essential`.

> For a whole-server (all-worlds) setup, place the pack in each world's `datapacks` folder.

---

## Good to know

- **Crystal/anchor nullification is proximity-based.** Because crystals share the `minecraft:explosion` damage type with TNT and creepers, players are protected only near a crystal or a charged respawn anchor. A side effect is that **Resistance potions / beacon Resistance no longer reduce non-explosion damage**, and TNT detonated right next to a crystal is also absorbed.
- **Spear Lunge cooldown** starts when a Lunge jab **hits** a target (vanilla only exposes an on-hit signal).
- Ender pearls and totems stored in an ender chest are not counted toward the caps.

## Version compatibility

`pack.mcmeta` ships both the legacy `pack_format` / `supported_formats` and the newer `min_format` / `max_format` fields, and the 26.2 predicate changes live in a format-gated overlay, so a single download loads cleanly across every supported version and is designed to keep loading on future ones.
