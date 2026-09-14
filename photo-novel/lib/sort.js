/* sort.js - 파일 이름을 사람이 기대하는 순서(1, 2, 10 …)로 정렬한다. */

const collator = new Intl.Collator('ko', { sensitivity: 'base' });
const CHUNK = /\d+|\D+/g;

/* '2.jpg' 를 ['2', '.jpg'] 처럼 숫자/비숫자 덩어리로 자른다. */
function chunks(s) {
  return String(s).match(CHUNK) || [];
}

function compareNumeric(x, y) {
  // Number() 로 바꾸면 아주 긴 숫자에서 정밀도가 깨지므로 문자열로 비교한다.
  const sx = x.replace(/^0+(?=\d)/, '');
  const sy = y.replace(/^0+(?=\d)/, '');
  if (sx.length !== sy.length) return sx.length - sy.length;
  if (sx !== sy) return sx < sy ? -1 : 1;
  return x.length - y.length;            // 값이 같으면 0 이 적은 쪽(2 < 002)이 앞
}

/* 한 조각(디렉터리 이름 또는 파일 이름)끼리 비교 */
export function naturalCompare(a, b) {
  const ac = chunks(a);
  const bc = chunks(b);
  const n = Math.min(ac.length, bc.length);
  for (let i = 0; i < n; i++) {
    const x = ac[i];
    const y = bc[i];
    const xd = x.charCodeAt(0) >= 48 && x.charCodeAt(0) <= 57;
    const yd = y.charCodeAt(0) >= 48 && y.charCodeAt(0) <= 57;
    if (xd && yd) {
      const d = compareNumeric(x, y);
      if (d) return d < 0 ? -1 : 1;
    } else if (xd !== yd) {
      return xd ? -1 : 1;                // 숫자가 글자보다 앞
    } else {
      const d = collator.compare(x, y);
      if (d) return d;
      if (x !== y) return x < y ? -1 : 1; // 로케일이 같다고 본 경우의 안정적인 tie-break
    }
  }
  if (ac.length !== bc.length) return ac.length - bc.length;
  return 0;
}

/* zip 안의 'a/b/2.jpg' 같은 경로는 폴더 단위로 끊어서 비교한다. */
export function naturalPathCompare(a, b) {
  const as = String(a).split('/');
  const bs = String(b).split('/');
  const n = Math.min(as.length, bs.length);
  for (let i = 0; i < n; i++) {
    const d = naturalCompare(as[i], bs[i]);
    if (d) return d;
  }
  return as.length - bs.length;          // 얕은 경로가 먼저
}

/* items: { name } 배열. 원본을 건드리지 않고 정렬된 새 배열을 준다. */
export function sortByName(items, key = 'name') {
  return items.slice().sort((p, q) => naturalPathCompare(p[key], q[key]));
}
