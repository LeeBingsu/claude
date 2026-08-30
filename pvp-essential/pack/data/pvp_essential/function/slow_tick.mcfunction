# PvP Essential - 0.25초마다 실행
scoreboard players set #tick pvpe.timer 0

# 점수 초기화 (신규 접속자 포함)
scoreboard players add @a pvpe.combat 0
scoreboard players add @a pvpe.mace 0
scoreboard players add @a pvpe.spear 0
scoreboard players add @a pvpe.pun 0
scoreboard players add @a pvpe.ack 0

# 예전 버전이 걸어 둔 무한 저항이 남아 있으면 제거한다.
# (지금은 폭발원 근처에서만 짧게 저항을 부여한다 - function/blast/tick)
execute as @a if predicate pvp_essential:infinite_resistance run effect clear @s minecraft:resistance

# 최초 1회 설정
execute as @a[tag=!pvpe.init] run function pvp_essential:player/init

# 인벤토리 개수 제한
execute as @a run function pvp_essential:limit/check

# 20초마다 잠긴 아이템 잔여물 정리
scoreboard players add #sweep pvpe.timer 1
execute if score #sweep pvpe.timer matches 80.. run function pvp_essential:sweep
