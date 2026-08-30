scoreboard players remove @s pvpe.combat 1
# 전투 중 겉날개 사용 금지
item modify entity @s armor.chest pvp_essential:elytra_disable
# 전투 중 급류(Riptide) 삼지창 사용 금지
item modify entity @s weapon.mainhand pvp_essential:trident_disable
item modify entity @s weapon.offhand pvp_essential:trident_disable
execute if score @s pvpe.combat matches ..0 run function pvp_essential:combat/end
