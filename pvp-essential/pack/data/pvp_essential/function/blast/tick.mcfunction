# 엔더 크리스탈 주변
execute as @e[type=end_crystal] at @s run function pvp_essential:blast/protect

# 충전된 리스폰 정박기 위치에 놓아둔 마커: 정박기가 사라지면 마커도 제거
execute as @e[type=marker,tag=pvpe.anchor] at @s unless block ~ ~ ~ minecraft:respawn_anchor run kill @s
execute as @e[type=marker,tag=pvpe.anchor] at @s run function pvp_essential:blast/protect
