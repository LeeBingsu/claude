scoreboard players remove #ray pvpe.tmp 1
execute if block ~ ~ ~ minecraft:respawn_anchor run function pvp_essential:blast/anchor_found
execute unless block ~ ~ ~ minecraft:respawn_anchor if score #ray pvpe.tmp matches 1.. positioned ^ ^ ^0.2 run function pvp_essential:blast/ray
