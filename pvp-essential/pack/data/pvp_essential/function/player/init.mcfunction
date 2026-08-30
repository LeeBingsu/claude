# 서버에서 처음 만난 플레이어에게 1회 실행
tag @s add pvpe.init
scoreboard players set @s pvpe.combat 0
scoreboard players set @s pvpe.mace 0
scoreboard players set @s pvpe.spear 0
scoreboard players set @s pvpe.pun 0
scoreboard players operation @s pvpe.ack = @s pvpe.leave
recipe give @s pvp_essential:golden_apple_bulk
recipe give @s pvp_essential:kit_chest
tellraw @s [{"text":"[PvP Essential] ","color":"red","bold":true},{"text":"전투 중 로그아웃 시 사망합니다. /trigger 없이 자동 적용됩니다.","color":"gray","bold":false}]
