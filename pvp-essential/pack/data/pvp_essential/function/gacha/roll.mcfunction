# 랜덤 갑옷 상자 표식을 실제 랜덤 상자로 교체
advancement revoke @s only pvp_essential:gacha/armor
execute store result score #gacha pvpe.tmp run clear @s minecraft:chest[minecraft:custom_data~{pvpe_gacha:1b}]
execute if score #gacha pvpe.tmp matches 1.. run function pvp_essential:gacha/give
