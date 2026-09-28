/* settings-file.js - 지시사항·모델·옵션(원하면 API 키까지)을 JSON 파일 하나로 주고받는다. */

export const SETTINGS_KIND = 'photo-novel-settings';

export function buildSettingsFile({ settings, theme, proseScale, apiKey } = {}) {
  const out = {
    kind: SETTINGS_KIND,
    version: 1,
    savedAt: new Date().toISOString(),
    settings: { ...(settings || {}) }
  };
  if (theme) out.theme = theme;
  if (proseScale) out.proseScale = proseScale;
  if (apiKey) out.apiKey = apiKey;
  return JSON.stringify(out, null, 2);
}

/*
  파일 내용을 읽어 { settings, theme, proseScale, apiKey } 로 돌려준다.
  전체 내보내기 zip 안의 photo-novel.json 처럼 settings 칸만 있는 파일도 받는다.
*/
export function readSettingsFile(text) {
  let data;
  try { data = JSON.parse(String(text).replace(/^﻿/, '')); } catch { throw new Error('JSON 파일이 아닙니다.'); }
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('설정 파일 모양이 아닙니다.');
  const settings = data.settings && typeof data.settings === 'object' ? data.settings : null;
  if (!settings) throw new Error('설정이 들어 있지 않은 파일입니다.');
  const clean = {};
  for (const [k, v] of Object.entries(settings)) {
    if (['string', 'number', 'boolean'].includes(typeof v)) clean[k] = v;   // 값만 받는다
  }
  return {
    settings: clean,
    theme: data.theme === 'dark' || data.theme === 'light' ? data.theme : '',
    proseScale: Number(data.proseScale) || 0,
    apiKey: typeof data.apiKey === 'string' ? data.apiKey.trim() : ''
  };
}
