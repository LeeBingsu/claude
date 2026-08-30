# 엔더 진주 16개 / 불사의 토템 2개 초과분 제거
execute store result score #cnt pvpe.tmp run clear @s minecraft:ender_pearl 0
execute if score #cnt pvpe.tmp matches 17.. run function pvp_essential:limit/pearl
execute store result score #cnt pvpe.tmp run clear @s minecraft:totem_of_undying 0
execute if score #cnt pvpe.tmp matches 3.. run function pvp_essential:limit/totem
