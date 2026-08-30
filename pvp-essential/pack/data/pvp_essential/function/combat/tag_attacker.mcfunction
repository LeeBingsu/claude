# 다른 플레이어를 공격한 쪽도 동일하게 전투 상태로 묶는다.
advancement revoke @s only pvp_essential:combat/hit_player
execute unless score @s pvpe.combat matches 1.. run function pvp_essential:combat/start
scoreboard players set @s pvpe.combat 200
