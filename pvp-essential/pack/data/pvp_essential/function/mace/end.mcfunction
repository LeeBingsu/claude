scoreboard players set @s pvpe.mace 0
function pvp_essential:player/restore_all
title @s actionbar [{"text":"철퇴를 다시 사용할 수 있습니다","color":"green"}]
execute at @s run playsound minecraft:block_note_block_bell master @s ~ ~ ~ 0.5 1.6
