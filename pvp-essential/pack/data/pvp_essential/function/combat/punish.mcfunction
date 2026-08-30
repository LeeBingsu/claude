scoreboard players set @s pvpe.pun 0
tellraw @a [{"selector":"@s","color":"red"},{"text":" 님이 전투 중 접속을 종료하여 사망했습니다.","color":"red"}]
title @s title {"text":"전투 로그아웃","color":"dark_red"}
title @s subtitle {"text":"전투 중 접속을 종료했습니다","color":"red"}
kill @s
