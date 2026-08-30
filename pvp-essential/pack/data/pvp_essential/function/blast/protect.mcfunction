# 현재 위치(엔더 크리스탈 / 리스폰 정박기) 주변 플레이어에게만
# 폭발 피해 무효화용 저항을 짧게 부여한다.
# bypasses_resistance 태그 덕분에 이 저항은 폭발 계열 피해에만 작용한다.
execute as @a[distance=..16] unless predicate pvp_essential:resistance_fresh run effect give @s minecraft:resistance 3 4 true
