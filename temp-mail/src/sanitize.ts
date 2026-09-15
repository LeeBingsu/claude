/**
 * 메일 HTML 살균기.
 *
 * 신뢰할 수 없는 HTML 을 다루는 방어선은 두 겹이다.
 *  1) 여기: 저장 직전에 HTMLRewriter 로 허용 목록 기반 재작성
 *  2) 프론트엔드: script 를 허용하지 않는 sandbox iframe + CSP
 * 어느 한쪽만으로도 스크립트 실행은 막히지만, 둘 다 두는 편이 안전하다.
 */

/** 태그와 그 안의 내용까지 통째로 버린다. */
const DROP_WITH_CONTENT = new Set([
  "script", "noscript", "iframe", "frame", "frameset", "object", "embed",
  "applet", "base", "link", "meta", "title", "form", "input", "button",
  "select", "textarea", "option", "optgroup", "fieldset", "legend", "label",
  "svg", "math", "template", "audio", "video", "source", "track", "canvas",
  "map", "area", "dialog", "portal", "slot", "xml",
]);

/** 태그만 벗기고 안의 내용은 남긴다. (html/body 같은 문서 골격) */
const UNWRAP = new Set(["html", "head", "body"]);

const ALLOWED_TAGS = new Set([
  "a", "abbr", "address", "article", "aside", "b", "big", "blockquote", "br",
  "caption", "center", "cite", "code", "col", "colgroup", "dd", "del", "dfn",
  "div", "dl", "dt", "em", "figcaption", "figure", "font", "footer", "h1",
  "h2", "h3", "h4", "h5", "h6", "header", "hr", "i", "img", "ins", "kbd",
  "li", "main", "mark", "nav", "ol", "p", "pre", "q", "s", "samp", "section",
  "small", "span", "strike", "strong", "style", "sub", "sup", "table",
  "tbody", "td", "tfoot", "th", "thead", "time", "tr", "tt", "u", "ul",
  "var", "wbr",
]);

const ALLOWED_ATTRIBUTES = new Set([
  "align", "alt", "bgcolor", "border", "cellpadding", "cellspacing", "char",
  "charoff", "class", "color", "colspan", "dir", "face", "headers", "height",
  "href", "hspace", "id", "lang", "nowrap", "rowspan", "scope", "size",
  "span", "src", "start", "style", "summary", "title", "type", "valign",
  "value", "vspace", "width",
]);

const SAFE_URL_SCHEMES = new Set(["http:", "https:", "mailto:", "tel:"]);

/** CSS 에서 코드 실행이나 외부 로딩으로 이어질 수 있는 패턴. */
const DANGEROUS_CSS_RE =
  /(expression\s*\(|javascript\s*:|vbscript\s*:|-moz-binding|behaviou?r\s*:|@import)/gi;

/** `java\tscript:` 처럼 스킴 사이에 끼워 넣는 제어문자와 제로폭 문자. */
const URL_NOISE_RE =
  /[\u0000-\u0020\u007f-\u00a0\u200b-\u200f\u2028\u2029\u202a-\u202e\ufeff]/g;

export interface SanitizeOptions {
  /**
   * `cid:` 로 참조된 인라인 이미지를 실제 다운로드 URL 로 바꾸기 위한 표.
   * key 는 꺾쇠를 벗긴 Content-ID.
   */
  cidMap?: Map<string, string>;
}

/**
 * 링크/이미지 URL 이 안전한 스킴인지 본다.
 * 기준 URL 이 없으므로 상대 경로는 전부 버린다.
 */
export function isSafeUrl(raw: string): boolean {
  const cleaned = raw.replace(URL_NOISE_RE, "");
  if (cleaned === "") return false;

  try {
    const url = new URL(cleaned);
    return SAFE_URL_SCHEMES.has(url.protocol.toLowerCase());
  } catch {
    return false;
  }
}

function sanitizeStyleAttribute(value: string): string {
  return value.replace(DANGEROUS_CSS_RE, "");
}

function stripCid(value: string): string {
  return value.trim().replace(/^cid:/i, "").replace(/^<|>$/g, "");
}

/**
 * 메일 HTML 을 허용 목록 기준으로 재작성한다.
 *
 * 원격 이미지는 지우지 않고 `src` 를 `data-blocked-src` 로 옮겨 둔다.
 * 사용자가 "이미지 표시"를 누를 때만 프론트엔드가 되돌리므로, 메일을 열었다는
 * 사실이 발신자에게 자동으로 새어 나가지 않는다.
 */
export async function sanitizeHtml(html: string, options: SanitizeOptions = {}): Promise<string> {
  const cidMap = options.cidMap ?? new Map<string, string>();

  const rewriter = new HTMLRewriter()
    .on("*", {
      element(element) {
        const tag = element.tagName.toLowerCase();

        if (DROP_WITH_CONTENT.has(tag)) {
          element.remove();
          return;
        }

        if (UNWRAP.has(tag) || !ALLOWED_TAGS.has(tag)) {
          element.removeAndKeepContent();
          return;
        }

        // 허용된 태그라도 속성은 다시 허용 목록으로 거른다.
        // (on* 이벤트 핸들러는 목록에 없으므로 여기서 전부 떨어져 나간다.)
        // 재작성 중에 목록이 바뀌므로 먼저 배열로 복사해 둔다.
        const attributes = [...element.attributes] as Array<[string, string]>;

        for (const [name, value] of attributes) {
          const attr = name.toLowerCase();

          if (!ALLOWED_ATTRIBUTES.has(attr)) {
            element.removeAttribute(name);
            continue;
          }

          if (attr === "style") {
            element.setAttribute(name, sanitizeStyleAttribute(value));
            continue;
          }

          if (attr === "href") {
            if (isSafeUrl(value)) {
              element.setAttribute(name, value.trim());
            } else {
              element.removeAttribute(name);
            }
            continue;
          }

          if (attr === "src") {
            const inlineUrl = /^\s*cid:/i.test(value) ? cidMap.get(stripCid(value)) : undefined;
            if (inlineUrl) {
              // 인라인 첨부는 우리 서버에서 오므로 바로 보여준다.
              element.setAttribute(name, inlineUrl);
            } else if (isSafeUrl(value)) {
              element.removeAttribute(name);
              element.setAttribute("data-blocked-src", value.trim());
            } else {
              element.removeAttribute(name);
            }
          }
        }

        if (tag === "a") {
          // 새 탭으로 열되 원본 창 참조와 리퍼러는 넘기지 않는다.
          element.setAttribute("target", "_blank");
          element.setAttribute("rel", "noopener noreferrer nofollow");
        }
      },
    })
    .on("style", {
      text(chunk) {
        const cleaned = chunk.text.replace(DANGEROUS_CSS_RE, "");
        if (cleaned !== chunk.text) chunk.replace(cleaned, { html: true });
      },
    });

  return await rewriter.transform(new Response(html)).text();
}

/** 목록에 보여줄 한 줄 미리보기. */
export function makePreview(text: string | null | undefined, limit = 200): string {
  if (!text) return "";
  const collapsed = text.replace(/\s+/g, " ").trim();
  return collapsed.length > limit ? `${collapsed.slice(0, limit)}…` : collapsed;
}

/** 신뢰할 수 없는 문자열을 HTML 본문에 넣을 때 쓰는 최소 이스케이프. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
