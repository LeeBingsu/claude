# 다른 플레이어에게 공격당한 시점부터 10초 동안 전투 상태
advancement revoke @s only pvp_essential:combat/hurt_by_player
execute unless score @s pvpe.combat matches 1.. run function pvp_essential:combat/start
scoreboard players set @s pvpe.combat 200
