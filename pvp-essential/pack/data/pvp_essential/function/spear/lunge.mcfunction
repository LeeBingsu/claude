# 창의 lunge(찌르기 돌진) 사용 -> 10초 동안 lunge 인챈트를 임시로 제거
advancement revoke @s only pvp_essential:spear/lunge
scoreboard players set @s pvpe.spear 200
item modify entity @s weapon.mainhand pvp_essential:lunge_disable
