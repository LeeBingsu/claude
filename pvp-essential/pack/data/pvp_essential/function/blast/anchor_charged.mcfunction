# 글로우스톤으로 리스폰 정박기를 충전한 순간 실행된다.
# 바라보고 있는 방향으로 레이캐스트해서 정박기 블록 위치를 찾고 마커를 남긴다.
advancement revoke @s only pvp_essential:blast/anchor
scoreboard players set #ray pvpe.tmp 30
execute at @s anchored eyes positioned ^ ^ ^0 run function pvp_essential:blast/ray
