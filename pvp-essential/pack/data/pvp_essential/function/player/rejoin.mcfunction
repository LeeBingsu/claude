# 재접속한 플레이어 처리
scoreboard players operation @s pvpe.ack = @s pvpe.leave
recipe give @s pvp_essential:golden_apple_bulk
recipe give @s pvp_essential:kit_chest
function pvp_essential:player/restore_all

# 서버 재시작 직후(유예 시간)에는 처벌하지 않는다.
execute if score #grace pvpe.timer matches 1.. run scoreboard players set @s pvpe.combat 0

# 서버 재시작 유예 시간에는 예약된 처벌도 취소한다.
execute if score #grace pvpe.timer matches 1.. run scoreboard players set @s pvpe.pun 0

# 전투 중 접속을 종료했다면 사망을 예약한다.
# (접속 직후 같은 틱에 kill 을 실행하면 적용되지 않으므로 2초 뒤에 처리)
execute if score @s pvpe.combat matches 1.. run scoreboard players set @s pvpe.pun 40
# 처벌을 피하려고 다시 나갔다 들어와도 예약은 유지된다.
execute if score @s pvpe.pun matches 1.. run scoreboard players set @s pvpe.pun 40

scoreboard players set @s pvpe.combat 0
scoreboard players set @s pvpe.mace 0
scoreboard players set @s pvpe.spear 0
