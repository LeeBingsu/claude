scoreboard players remove #cnt pvpe.tmp 2
execute store result storage pvp_essential:limit count int 1 run scoreboard players get #cnt pvpe.tmp
data modify storage pvp_essential:limit item set value "minecraft:totem_of_undying"
function pvp_essential:limit/clear with storage pvp_essential:limit
title @s actionbar [{"text":"불사의 토템은 최대 2개까지만 소지할 수 있습니다","color":"yellow"}]
