# 철퇴 내려찍기(smash) 적중 -> 30초 동안 내려찍기 봉인
advancement revoke @s only pvp_essential:mace/smash
scoreboard players set @s pvpe.mace 600
item modify entity @s weapon.mainhand pvp_essential:mace_disable
execute at @s run playsound minecraft:block_anvil_land master @s ~ ~ ~ 0.4 1.8
