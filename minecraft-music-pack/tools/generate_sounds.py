"""Generate assets/minecraft/sounds.json for the Metal Scar Radio music pack.

Every vanilla background-music event (as shipped in 1.21.11 and 26.2) is replaced
with a hand-picked subset of the 15 tracks. Per-track volume is derived from the
measured integrated loudness (EBU R128, `ffmpeg -af ebur128`) so that loud masters
do not drown out the quiet ones in game.
"""
import json
import os

NAMESPACE_DIR = "music/metal_scar_radio"
TARGET_LUFS = -19.5

# slug -> (display title, measured integrated loudness in LUFS)
TRACKS = {
    "blossoms_bring_an_old_friend": ("Blossoms Bring an Old Friend", -10.0),
    "charged_by_verdant_tubes": ("Charged by Verdant Tubes", -15.9),
    "cosmic_observer": ("Cosmic Observer", -11.4),
    "echoes_in_ore": ("Echoes in Ore", -15.7),
    "faiths_imprint": ("Faith's Imprint", -15.5),
    "fangxing": ("Fangxing", -12.3),
    "jingyu_at_daybreak": ("Jingyu at Daybreak", -17.1),
    "journey_to_the_vein": ("Journey to the Vein", -20.3),
    "misty_grove": ("Misty Grove", -12.5),
    "outpost_shaping_i": ("Outpost Shaping I", -12.8),
    "protocol_flow": ("Protocol Flow", -11.4),
    "soils_of_life": ("Soils of Life", -12.8),
    "to_walk_to_cross": ("To Walk, To Cross", -15.8),
    "when_the_spring_rite_arrives": ("When the Spring Rite Arrives", -12.1),
    "wisdom_of_the_landscape": ("Wisdom of the Landscape", -22.1),
}

EVENTS = {
    # menu / generic
    "music.menu": [
        "jingyu_at_daybreak", "wisdom_of_the_landscape", "misty_grove",
        "blossoms_bring_an_old_friend", "when_the_spring_rite_arrives",
    ],
    "music.game": [
        "jingyu_at_daybreak", "wisdom_of_the_landscape", "soils_of_life",
        "to_walk_to_cross", "misty_grove", "blossoms_bring_an_old_friend",
        "when_the_spring_rite_arrives", "outpost_shaping_i",
        "charged_by_verdant_tubes", "fangxing",
    ],
    "music.creative": [
        "protocol_flow", "outpost_shaping_i", "cosmic_observer",
        "wisdom_of_the_landscape", "soils_of_life",
    ],
    "music.credits": ["to_walk_to_cross"],
    "music.end": ["cosmic_observer", "protocol_flow"],
    "music.dragon": ["faiths_imprint"],
    "music.under_water": ["charged_by_verdant_tubes", "misty_grove", "fangxing"],
    # nether
    "music.nether.nether_wastes": ["faiths_imprint", "journey_to_the_vein", "echoes_in_ore"],
    "music.nether.crimson_forest": ["fangxing", "faiths_imprint", "journey_to_the_vein"],
    "music.nether.warped_forest": ["cosmic_observer", "charged_by_verdant_tubes", "protocol_flow"],
    "music.nether.soul_sand_valley": ["cosmic_observer", "faiths_imprint", "echoes_in_ore"],
    "music.nether.basalt_deltas": ["protocol_flow", "journey_to_the_vein", "echoes_in_ore"],
    # overworld biomes
    "music.overworld.badlands": ["wisdom_of_the_landscape", "to_walk_to_cross", "echoes_in_ore"],
    "music.overworld.bamboo_jungle": ["charged_by_verdant_tubes", "fangxing", "misty_grove"],
    "music.overworld.cherry_grove": [
        "blossoms_bring_an_old_friend", "when_the_spring_rite_arrives", "jingyu_at_daybreak",
    ],
    "music.overworld.deep_dark": ["echoes_in_ore", "cosmic_observer", "journey_to_the_vein"],
    "music.overworld.desert": ["wisdom_of_the_landscape", "to_walk_to_cross", "fangxing"],
    "music.overworld.dripstone_caves": ["journey_to_the_vein", "echoes_in_ore", "protocol_flow"],
    "music.overworld.sulfur_caves": ["journey_to_the_vein", "protocol_flow", "faiths_imprint"],
    "music.overworld.flower_forest": [
        "blossoms_bring_an_old_friend", "when_the_spring_rite_arrives", "soils_of_life",
    ],
    "music.overworld.forest": [
        "misty_grove", "soils_of_life", "jingyu_at_daybreak", "wisdom_of_the_landscape",
    ],
    "music.overworld.frozen_peaks": ["cosmic_observer", "faiths_imprint", "to_walk_to_cross"],
    "music.overworld.grove": ["jingyu_at_daybreak", "misty_grove", "soils_of_life"],
    "music.overworld.jagged_peaks": ["faiths_imprint", "to_walk_to_cross", "cosmic_observer"],
    "music.overworld.jungle": ["charged_by_verdant_tubes", "fangxing", "soils_of_life"],
    "music.overworld.lush_caves": [
        "charged_by_verdant_tubes", "soils_of_life", "blossoms_bring_an_old_friend",
    ],
    "music.overworld.meadow": [
        "jingyu_at_daybreak", "when_the_spring_rite_arrives", "wisdom_of_the_landscape",
    ],
    "music.overworld.old_growth_taiga": ["misty_grove", "soils_of_life", "to_walk_to_cross"],
    "music.overworld.snowy_slopes": ["cosmic_observer", "jingyu_at_daybreak", "faiths_imprint"],
    "music.overworld.sparse_jungle": [
        "charged_by_verdant_tubes", "misty_grove", "wisdom_of_the_landscape",
    ],
    "music.overworld.stony_peaks": ["to_walk_to_cross", "faiths_imprint", "outpost_shaping_i"],
    "music.overworld.swamp": ["misty_grove", "soils_of_life", "echoes_in_ore"],
}


def volume_for(slug):
    """Amplitude factor that brings the track down to TARGET_LUFS, clamped to 0.1..1.0."""
    lufs = TRACKS[slug][1]
    return round(min(1.0, max(0.1, 10 ** ((TARGET_LUFS - lufs) / 20))), 2)


def build():
    out = {}
    for event, slugs in EVENTS.items():
        unknown = [s for s in slugs if s not in TRACKS]
        if unknown:
            raise SystemExit(f"{event}: unknown track(s) {unknown}")
        out[event] = {
            "replace": True,
            "sounds": [
                {
                    "name": f"{NAMESPACE_DIR}/{slug}",
                    "stream": True,
                    "volume": volume_for(slug),
                }
                for slug in slugs
            ],
        }
    return out


if __name__ == "__main__":
    root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "pack")
    path = os.path.normpath(os.path.join(root, "assets", "minecraft", "sounds.json"))
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(build(), f, indent=2, ensure_ascii=False)
        f.write("\n")
    print(f"wrote {path} ({len(EVENTS)} music events)")
