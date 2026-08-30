# 남은 시간을 초 단위(올림)로 변환
scoreboard players operation @s pvpe.d1 = @s pvpe.combat
scoreboard players add @s pvpe.d1 19
scoreboard players operation @s pvpe.d1 /= #20 pvpe.timer
scoreboard players operation @s pvpe.d2 = @s pvpe.mace
scoreboard players add @s pvpe.d2 19
scoreboard players operation @s pvpe.d2 /= #20 pvpe.timer
scoreboard players operation @s pvpe.d3 = @s pvpe.spear
scoreboard players add @s pvpe.d3 19
scoreboard players operation @s pvpe.d3 /= #20 pvpe.timer

execute if score @s pvpe.combat matches 1.. if score @s pvpe.mace matches 1.. run title @s actionbar [{"text":"⚔ 전투 중 ","color":"red"},{"score":{"name":"@s","objective":"pvpe.d1"},"color":"red"},{"text":"초  |  철퇴 ","color":"gray"},{"score":{"name":"@s","objective":"pvpe.d2"},"color":"yellow"},{"text":"초","color":"gray"}]
execute if score @s pvpe.combat matches 1.. if score @s pvpe.mace matches ..0 if score @s pvpe.spear matches 1.. run title @s actionbar [{"text":"⚔ 전투 중 ","color":"red"},{"score":{"name":"@s","objective":"pvpe.d1"},"color":"red"},{"text":"초  |  창 ","color":"gray"},{"score":{"name":"@s","objective":"pvpe.d3"},"color":"yellow"},{"text":"초","color":"gray"}]
execute if score @s pvpe.combat matches 1.. if score @s pvpe.mace matches ..0 if score @s pvpe.spear matches ..0 run title @s actionbar [{"text":"⚔ 전투 중 ","color":"red"},{"score":{"name":"@s","objective":"pvpe.d1"},"color":"red"},{"text":"초","color":"red"}]
execute if score @s pvpe.combat matches ..0 if score @s pvpe.mace matches 1.. run title @s actionbar [{"text":"철퇴 재사용 대기 ","color":"gray"},{"score":{"name":"@s","objective":"pvpe.d2"},"color":"yellow"},{"text":"초","color":"gray"}]
execute if score @s pvpe.combat matches ..0 if score @s pvpe.mace matches ..0 if score @s pvpe.spear matches 1.. run title @s actionbar [{"text":"창 lunge 재사용 대기 ","color":"gray"},{"score":{"name":"@s","objective":"pvpe.d3"},"color":"yellow"},{"text":"초","color":"gray"}]
