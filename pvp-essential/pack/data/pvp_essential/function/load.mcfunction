# PvP Essential - 부팅/리로드 시 1회 실행
scoreboard objectives add pvpe.combat dummy
scoreboard objectives add pvpe.mace dummy
scoreboard objectives add pvpe.spear dummy
scoreboard objectives add pvpe.pun dummy
scoreboard objectives add pvpe.timer dummy
scoreboard objectives add pvpe.tmp dummy
scoreboard objectives add pvpe.d1 dummy
scoreboard objectives add pvpe.d2 dummy
scoreboard objectives add pvpe.d3 dummy
scoreboard objectives add pvpe.ack dummy
scoreboard objectives add pvpe.leave minecraft.custom:minecraft.leave_game

scoreboard players set #20 pvpe.timer 20
scoreboard players set #tick pvpe.timer 0
scoreboard players set #sweep pvpe.timer 0

# 서버가 막 켜졌다면(접속자 0명) 60초 동안은 전투 로그아웃 처벌을 하지 않는다.
# (서버 재시작/크래시로 튕긴 사람이 억울하게 죽는 것을 방지)
scoreboard players set #grace pvpe.timer 0
execute unless entity @a run scoreboard players set #grace pvpe.timer 1200

# 예전 버전이 걸어 둔 무한 저항 제거
execute as @a if predicate pvp_essential:infinite_resistance run effect clear @s minecraft:resistance

# /reload 시점에 접속 중인 인원은 전투 상태를 해제하고 잠긴 아이템을 되돌린다.
scoreboard players set @a pvpe.combat 0
scoreboard players set @a pvpe.mace 0
scoreboard players set @a pvpe.spear 0
execute as @a run function pvp_essential:player/restore_all

tellraw @a [{"text":"[PvP Essential] ","color":"red","bold":true},{"text":"데이터팩이 적용되었습니다.","color":"gray","bold":false}]
