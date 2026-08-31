loot give @s loot pvp_essential:gacha_armor
scoreboard players remove #gacha pvpe.tmp 1
execute if score #gacha pvpe.tmp matches 1.. run function pvp_essential:gacha/give
