scoreboard players set #ray pvpe.tmp 0
execute align xyz positioned ~0.5 ~0.5 ~0.5 unless entity @e[type=marker,tag=pvpe.anchor,distance=..0.6] run summon minecraft:marker ~ ~ ~ {Tags:["pvpe.anchor"]}
function pvp_essential:blast/protect
