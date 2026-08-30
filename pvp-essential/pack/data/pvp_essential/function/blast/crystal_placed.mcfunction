# 엔더 크리스탈을 놓은 즉시(같은 틱에 터뜨리는 경우 대비) 주변을 보호한다.
advancement revoke @s only pvp_essential:blast/crystal
execute at @s run function pvp_essential:blast/protect
