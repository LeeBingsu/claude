# 전투/쿨타임 상태가 아닌 플레이어의 인벤토리에 잠긴 아이템이 남아 있으면 되돌린다.
# (전투 중 다른 플레이어에게 건네주거나 떨어뜨린 아이템 대비)
scoreboard players set #sweep pvpe.timer 0
execute as @a[scores={pvpe.combat=..0,pvpe.mace=..0,pvpe.spear=..0}] run function pvp_essential:player/restore_all
