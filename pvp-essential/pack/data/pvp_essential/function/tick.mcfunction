# PvP Essential - 매 틱 실행
execute if score #grace pvpe.timer matches 1.. run scoreboard players remove #grace pvpe.timer 1

# 재접속 감지 (leave_game 통계가 증가했는데 아직 확인하지 않은 플레이어)
execute as @a unless score @s pvpe.leave = @s pvpe.ack run function pvp_essential:player/rejoin

# 전투 중 로그아웃 처벌 (접속 2초 뒤 실행)
execute as @a[scores={pvpe.pun=1..}] run function pvp_essential:combat/punish_tick

# 타이머
execute as @a[scores={pvpe.combat=1..}] run function pvp_essential:combat/tick
execute as @a[scores={pvpe.mace=1..}] run function pvp_essential:mace/tick
execute as @a[scores={pvpe.spear=1..}] run function pvp_essential:spear/tick

# 액션바 표시
execute as @a[scores={pvpe.combat=1..}] run function pvp_essential:hud
execute as @a[scores={pvpe.combat=..0,pvpe.mace=1..}] run function pvp_essential:hud
execute as @a[scores={pvpe.combat=..0,pvpe.mace=..0,pvpe.spear=1..}] run function pvp_essential:hud

# 5틱마다 실행되는 처리
scoreboard players add #tick pvpe.timer 1
execute if score #tick pvpe.timer matches 5.. run function pvp_essential:slow_tick
