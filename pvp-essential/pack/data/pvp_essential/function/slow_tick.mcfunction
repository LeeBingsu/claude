# PvP Essential - 0.25초마다 실행
scoreboard players set #tick pvpe.timer 0

# 점수 초기화 (신규 접속자 포함)
scoreboard players add @a pvpe.combat 0
scoreboard players add @a pvpe.mace 0
scoreboard players add @a pvpe.spear 0
scoreboard players add @a pvpe.pun 0
scoreboard players add @a pvpe.ack 0

# 엔더 크리스탈 / 리스폰 정박기 폭발 데미지 0 처리의 핵심.
# bypasses_resistance 태그 덕분에 이 저항 효과는 폭발 계열 데미지에만 적용된다.
execute as @a unless predicate pvp_essential:has_resistance run effect give @s minecraft:resistance infinite 4 true

# 최초 1회 설정
execute as @a[tag=!pvpe.init] run function pvp_essential:player/init

# 인벤토리 개수 제한
execute as @a run function pvp_essential:limit/check

# 20초마다 잠긴 아이템 잔여물 정리
scoreboard players add #sweep pvpe.timer 1
execute if score #sweep pvpe.timer matches 80.. run function pvp_essential:sweep
