/* 임시 메일함 프론트엔드. 프레임워크 없이 동작하며, CSP 상 인라인 스크립트는 쓰지 않는다. */
(() => {
  "use strict";

  const STORAGE_KEY = "tempmail.inbox";
  const THEME_KEY = "tempmail.theme";
  const POLL_INTERVAL_MS = 5000;
  const MAX_POLL_INTERVAL_MS = 60000;

  /** @type {{address: string, token: string, expiresAt: number} | null} */
  let inbox = null;
  /** @type {Array<object>} */
  let messages = [];
  /** @type {object | null} */
  let openMessage = null;
  let showImages = false;
  let pollTimer = null;
  let pollDelay = POLL_INTERVAL_MS;
  let countdownTimer = null;
  let toastTimer = null;

  const $ = (id) => document.getElementById(id);

  const el = {
    setup: $("setup"),
    app: $("app"),
    createForm: $("create-form"),
    createBtn: $("create-btn"),
    localPart: $("local-part"),
    domain: $("domain"),
    restoreForm: $("restore-form"),
    restoreAddress: $("restore-address"),
    restoreToken: $("restore-token"),
    address: $("address"),
    expiry: $("expiry"),
    extendBtn: $("extend-btn"),
    newBtn: $("new-btn"),
    destroyBtn: $("destroy-btn"),
    shareBtn: $("share-btn"),
    themeBtn: $("theme-btn"),
    refreshBtn: $("refresh-btn"),
    listCount: $("list-count"),
    pollState: $("poll-state"),
    list: $("message-list"),
    empty: $("empty"),
    readerPlaceholder: $("reader-placeholder"),
    readerContent: $("reader-content"),
    readerSubject: $("reader-subject"),
    readerSender: $("reader-sender"),
    readerDate: $("reader-date"),
    readerAuth: $("reader-auth"),
    readerFrame: $("reader-frame"),
    readerText: $("reader-text"),
    imagesBtn: $("images-btn"),
    rawBtn: $("raw-btn"),
    deleteMsgBtn: $("delete-msg-btn"),
    attachments: $("attachments"),
    toast: $("toast"),
  };

  /* ── 저장소 ────────────────────────────────────────────────────────── */

  function loadInbox() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && parsed.address && parsed.token ? parsed : null;
    } catch {
      return null;
    }
  }

  function saveInbox(value) {
    inbox = value;
    try {
      if (value) localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* 프라이빗 모드 등으로 저장이 막혀 있어도 이번 세션은 그대로 쓴다. */
    }
  }

  /* ── HTTP ──────────────────────────────────────────────────────────── */

  class ApiError extends Error {
    constructor(status, code, message) {
      super(message);
      this.status = status;
      this.code = code;
    }
  }

  async function api(path, options = {}) {
    const headers = new Headers(options.headers || {});
    if (inbox && options.auth !== false) {
      headers.set("authorization", `Bearer ${inbox.token}`);
    }
    if (options.body !== undefined) {
      headers.set("content-type", "application/json");
    }

    const response = await fetch(path, {
      method: options.method || "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });

    const text = await response.text();
    const payload = text ? JSON.parse(text) : {};

    if (!response.ok) {
      const info = payload.error || {};
      throw new ApiError(response.status, info.code || "error", info.message || "요청에 실패했습니다.");
    }
    return payload;
  }

  /* ── 표시용 헬퍼 ───────────────────────────────────────────────────── */

  function toast(message, isError = false) {
    el.toast.textContent = message;
    el.toast.classList.toggle("error", isError);
    el.toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.toast.hidden = true;
    }, 3200);
  }

  function formatSize(bytes) {
    if (!bytes) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    const index = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
    const value = bytes / 1024 ** index;
    return `${index === 0 ? value : value.toFixed(1)} ${units[index]}`;
  }

  function formatReceivedAt(timestamp) {
    const date = new Date(timestamp);
    const elapsed = Date.now() - timestamp;

    if (elapsed < 60000) return "방금";
    if (elapsed < 3600000) return `${Math.floor(elapsed / 60000)}분 전`;

    const today = new Date();
    const sameDay =
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate();

    return sameDay
      ? date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
      : date.toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" });
  }

  function formatRemaining(ms) {
    if (ms <= 0) return "만료됨";
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) return `${hours}시간 ${String(minutes).padStart(2, "0")}분 남음`;
    return `${minutes}:${String(seconds).padStart(2, "0")} 남음`;
  }

  function senderLabel(from) {
    if (!from) return "(알 수 없음)";
    return from.name ? `${from.name} <${from.address}>` : from.address;
  }

  /* ── 화면 전환 ─────────────────────────────────────────────────────── */

  function showSetup() {
    stopPolling();
    stopCountdown();
    el.setup.hidden = false;
    el.app.hidden = true;
    document.title = "임시 메일함";
  }

  function showApp() {
    el.setup.hidden = true;
    el.app.hidden = false;
    el.address.textContent = inbox.address;
    renderList();
    startCountdown();
    startPolling();
    refresh({ immediate: true });
  }

  /* ── 주소 만들기 / 복구 ────────────────────────────────────────────── */

  async function loadConfig() {
    try {
      const config = await api("/api/config", { auth: false });
      el.domain.replaceChildren(
        ...config.domains.map((domain) => {
          const option = document.createElement("option");
          option.value = domain;
          option.textContent = domain;
          return option;
        }),
      );
    } catch {
      toast("서버 설정을 불러오지 못했습니다.", true);
    }
  }

  async function createNewInbox(localPart) {
    el.createBtn.disabled = true;
    try {
      const created = await api("/api/inboxes", {
        method: "POST",
        auth: false,
        body: { localPart: localPart || undefined, domain: el.domain.value || undefined },
      });

      saveInbox({ address: created.address, token: created.token, expiresAt: created.expiresAt });
      messages = [];
      clearReader();
      showApp();
      toast(`${created.address} 주소를 만들었습니다.`);
    } catch (error) {
      toast(error.message, true);
    } finally {
      el.createBtn.disabled = false;
    }
  }

  async function adoptInbox(address, token) {
    const candidate = { address, token, expiresAt: 0 };
    const previous = inbox;
    inbox = candidate;

    try {
      const info = await api(`/api/inboxes/${encodeURIComponent(address)}`);
      saveInbox({ address: info.address, token, expiresAt: info.expiresAt });
      messages = [];
      clearReader();
      showApp();
      return true;
    } catch (error) {
      inbox = previous;
      toast(error.status === 401 ? "주소나 토큰이 맞지 않습니다." : error.message, true);
      return false;
    }
  }

  /* ── 목록 ──────────────────────────────────────────────────────────── */

  async function refresh({ immediate = false } = {}) {
    if (!inbox) return;
    if (!immediate) el.pollState.classList.add("active");

    try {
      const data = await api(`/api/inboxes/${encodeURIComponent(inbox.address)}/messages`);
      const previousIds = new Set(messages.map((m) => m.id));
      const arrived = data.messages.filter((m) => !previousIds.has(m.id));

      messages = data.messages;
      if (data.expiresAt) saveInbox({ ...inbox, expiresAt: data.expiresAt });

      renderList();
      el.pollState.classList.remove("error");
      pollDelay = POLL_INTERVAL_MS;

      // 열어 둔 메일이 서버에서 사라졌으면 읽기 창도 비운다.
      if (openMessage && !messages.some((m) => m.id === openMessage.id)) clearReader();

      if (arrived.length > 0 && previousIds.size > 0) {
        toast(`새 메일 ${arrived.length}통이 도착했습니다.`);
      }
    } catch (error) {
      el.pollState.classList.add("error");

      if (error.status === 401) {
        // 만료되었거나 서버에서 지워진 주소다. 처음 화면으로 되돌린다.
        saveInbox(null);
        showSetup();
        toast("주소가 만료되어 메일함을 닫았습니다.", true);
        return;
      }

      // 서버가 흔들릴 때 요청을 몰아치지 않도록 간격을 늘린다.
      pollDelay = Math.min(MAX_POLL_INTERVAL_MS, pollDelay * 2);
      restartPolling();
    } finally {
      setTimeout(() => el.pollState.classList.remove("active"), 250);
    }
  }

  function renderList() {
    const unread = messages.filter((m) => !m.isRead).length;
    el.listCount.textContent = messages.length === 0
      ? ""
      : `${messages.length}통${unread > 0 ? ` · 안 읽음 ${unread}` : ""}`;
    document.title = unread > 0 ? `(${unread}) 임시 메일함` : "임시 메일함";

    el.empty.hidden = messages.length > 0;
    el.list.replaceChildren(...messages.map(renderListItem));
  }

  function renderListItem(message) {
    const item = document.createElement("li");
    item.className = "message-item";
    item.dataset.id = message.id;
    item.tabIndex = 0;
    item.setAttribute("role", "button");
    if (!message.isRead) item.classList.add("unread");
    if (openMessage && openMessage.id === message.id) item.classList.add("selected");

    const sender = document.createElement("span");
    sender.className = "msg-sender";
    sender.textContent = message.from.name || message.from.address;
    sender.title = senderLabel(message.from);

    const time = document.createElement("span");
    time.className = "msg-time";
    time.textContent = formatReceivedAt(message.receivedAt);
    time.title = new Date(message.receivedAt).toLocaleString("ko-KR");

    const subject = document.createElement("span");
    subject.className = "msg-subject";
    subject.textContent = message.subject || "(제목 없음)";

    const preview = document.createElement("span");
    preview.className = "msg-preview";
    preview.textContent = message.preview || "";

    item.append(sender, time, subject, preview);

    if (message.attachmentCount > 0) {
      const clip = document.createElement("span");
      clip.className = "msg-clip";
      clip.textContent = `📎 ${message.attachmentCount}`;
      item.append(clip);
    }

    const open = () => selectMessage(message.id);
    item.addEventListener("click", open);
    item.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        open();
      }
    });

    return item;
  }

  /* ── 읽기 창 ───────────────────────────────────────────────────────── */

  function clearReader() {
    openMessage = null;
    el.readerContent.hidden = true;
    el.readerPlaceholder.hidden = false;
    el.readerFrame.removeAttribute("srcdoc");
  }

  async function selectMessage(id) {
    try {
      const message = await api(`/api/messages/${encodeURIComponent(id)}`);
      openMessage = message;
      showImages = false;

      const listed = messages.find((m) => m.id === id);
      if (listed) listed.isRead = true;
      renderList();
      renderMessage();
    } catch (error) {
      toast(error.message, true);
    }
  }

  function renderMessage() {
    const message = openMessage;
    el.readerPlaceholder.hidden = true;
    el.readerContent.hidden = false;

    el.readerSubject.textContent = message.subject || "(제목 없음)";
    el.readerSender.textContent = senderLabel(message.from);
    el.readerDate.textContent = new Date(message.receivedAt).toLocaleString("ko-KR");
    el.readerDate.dateTime = new Date(message.receivedAt).toISOString();

    renderAuthBadges(message.auth);
    renderAttachments(message.attachments);
    renderBody(message);
  }

  function renderAuthBadges(auth) {
    const badges = ["spf", "dkim", "dmarc"]
      .filter((key) => auth && auth[key])
      .map((key) => {
        const badge = document.createElement("span");
        const result = auth[key];
        badge.className = `badge ${result === "pass" ? "pass" : result === "fail" ? "fail" : ""}`;
        badge.textContent = `${key} ${result}`;
        badge.title = `${key.toUpperCase()} 검사 결과: ${result}`;
        return badge;
      });

    el.readerAuth.replaceChildren(...badges);
  }

  function renderAttachments(attachments) {
    const items = (attachments || []).map((attachment) => {
      const item = document.createElement("li");
      const link = document.createElement("a");
      link.className = "attachment";

      const name = document.createElement("span");
      name.className = "name";
      name.textContent = `📎 ${attachment.filename}`;

      const size = document.createElement("span");
      size.className = "size";
      size.textContent = formatSize(attachment.size);

      link.append(name, size);

      if (attachment.downloadable) {
        link.href = `${attachment.url}?download=1`;
        link.download = attachment.filename;
        link.title = "내려받기";
      } else {
        link.classList.add("disabled");
        link.title = "크기 제한을 넘어 본문을 보관하지 않았습니다.";
      }

      item.append(link);
      return item;
    });

    el.attachments.replaceChildren(...items);
  }

  /**
   * 본문을 sandbox iframe 에 넣는다. HTML 은 서버에서 이미 살균되었고,
   * 여기서는 원격 이미지를 사용자가 켜기 전까지 되살리지 않는 일만 한다.
   */
  function renderBody(message) {
    const rawHtml = message.html;
    el.rawBtn.hidden = !rawHtml || !message.text;

    if (!rawHtml) {
      el.readerFrame.hidden = true;
      el.readerText.hidden = false;
      el.readerText.textContent = message.text || "(본문이 없습니다.)";
      el.imagesBtn.hidden = true;
      return;
    }

    const doc = new DOMParser().parseFromString(rawHtml, "text/html");
    const blocked = doc.querySelectorAll("img[data-blocked-src]");

    if (showImages) {
      for (const img of blocked) {
        img.setAttribute("src", img.getAttribute("data-blocked-src"));
        img.removeAttribute("data-blocked-src");
      }
    }

    el.imagesBtn.hidden = blocked.length === 0;
    el.imagesBtn.textContent = showImages
      ? "이미지 숨기기"
      : `이미지 표시 (${blocked.length})`;

    el.readerText.hidden = true;
    el.readerFrame.hidden = false;
    el.readerFrame.srcdoc = wrapEmailDocument(doc.body.innerHTML);
  }

  /** iframe 안에서만 쓰는 문서 껍데기. 여기 CSP 는 부모 CSP 위에 한 겹 더 얹는 용도다. */
  function wrapEmailDocument(bodyHtml) {
    return `<!doctype html><html><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src * data:; style-src 'unsafe-inline'; font-src data:; frame-src 'none'; script-src 'none'">
<base target="_blank">
<style>
  html { color-scheme: light; }
  body {
    margin: 0; padding: 18px; background: #fff; color: #1a1c20;
    font: 15px/1.55 -apple-system, BlinkMacSystemFont, "Segoe UI",
      "Apple SD Gothic Neo", "Noto Sans KR", sans-serif;
    overflow-wrap: anywhere;
  }
  img, table { max-width: 100%; }
  img { height: auto; }
  /* 아직 켜지 않은 원격 이미지는 자리만 잡아 둔다. */
  img[data-blocked-src] {
    min-width: 24px; min-height: 24px;
    background: repeating-linear-gradient(45deg, #eceef2, #eceef2 6px, #f6f7f9 6px, #f6f7f9 12px);
    border: 1px dashed #c8ccd4;
  }
  /* 살균 과정에서 src 를 잃은 이미지는 깨진 아이콘만 남으므로 감춘다. */
  img:not([src]):not([data-blocked-src]) { display: none; }
  a { color: #2f6df6; }
  /* href 가 제거된 링크는 눌리지 않으므로 링크처럼 보이지 않게 한다. */
  a:not([href]) { color: inherit; text-decoration: none; }
</style></head><body>${bodyHtml}</body></html>`;
  }

  /* ── 폴링 / 카운트다운 ─────────────────────────────────────────────── */

  function startPolling() {
    stopPolling();
    pollTimer = setInterval(() => {
      // 탭이 숨겨져 있는 동안에는 굳이 요청하지 않는다.
      if (!document.hidden) refresh();
    }, pollDelay);
  }

  function restartPolling() {
    if (pollTimer) startPolling();
  }

  function stopPolling() {
    clearInterval(pollTimer);
    pollTimer = null;
  }

  function startCountdown() {
    stopCountdown();
    const tick = () => {
      if (!inbox) return;
      const remaining = inbox.expiresAt - Date.now();
      el.expiry.textContent = formatRemaining(remaining);
      el.expiry.classList.toggle("urgent", remaining > 0 && remaining < 5 * 60 * 1000);

      if (remaining <= 0) {
        stopCountdown();
        stopPolling();
        saveInbox(null);
        showSetup();
        toast("주소가 만료되었습니다.", true);
      }
    };
    tick();
    countdownTimer = setInterval(tick, 1000);
  }

  function stopCountdown() {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }

  /* ── 클립보드 ──────────────────────────────────────────────────────── */

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // 보안 컨텍스트가 아니거나 권한이 없을 때를 위한 대비책.
      const field = document.createElement("textarea");
      field.value = text;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.append(field);
      field.select();
      const ok = document.execCommand("copy");
      field.remove();
      return ok;
    }
  }

  /* ── 테마 ──────────────────────────────────────────────────────────── */

  function applyTheme(theme) {
    if (theme === "light" || theme === "dark") {
      document.documentElement.dataset.theme = theme;
    } else {
      delete document.documentElement.dataset.theme;
    }
  }

  function toggleTheme() {
    const current = document.documentElement.dataset.theme;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const next = current ? (current === "dark" ? "light" : "") : prefersDark ? "light" : "dark";

    applyTheme(next);
    try {
      if (next) localStorage.setItem(THEME_KEY, next);
      else localStorage.removeItem(THEME_KEY);
    } catch {
      /* 저장 실패는 무시한다. */
    }
  }

  /* ── 이벤트 ────────────────────────────────────────────────────────── */

  el.createForm.addEventListener("submit", (event) => {
    event.preventDefault();
    createNewInbox(el.localPart.value.trim().toLowerCase());
  });

  el.restoreForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const address = el.restoreAddress.value.trim().toLowerCase();
    const token = el.restoreToken.value.trim();
    if (!address || !token) {
      toast("주소와 토큰을 모두 입력하세요.", true);
      return;
    }
    if (await adoptInbox(address, token)) toast("메일함을 불러왔습니다.");
  });

  el.address.addEventListener("click", async () => {
    if (await copyText(inbox.address)) toast("주소를 복사했습니다.");
    else toast("복사에 실패했습니다. 직접 선택해 주세요.", true);
  });

  el.shareBtn.addEventListener("click", async () => {
    if (!inbox) {
      toast("먼저 주소를 만드세요.", true);
      return;
    }
    // 토큰을 프래그먼트에 담으면 서버 로그에 남지 않는다.
    const link = `${location.origin}/#${encodeURIComponent(inbox.address)}:${inbox.token}`;
    if (await copyText(link)) toast("공유 링크를 복사했습니다. 이 링크를 아는 사람은 메일을 읽을 수 있습니다.");
    else toast("복사에 실패했습니다.", true);
  });

  el.refreshBtn.addEventListener("click", () => refresh({ immediate: true }));

  el.extendBtn.addEventListener("click", async () => {
    try {
      const result = await api(`/api/inboxes/${encodeURIComponent(inbox.address)}/extend`, {
        method: "POST",
      });
      saveInbox({ ...inbox, expiresAt: result.expiresAt });
      toast("사용 시간을 연장했습니다.");
    } catch (error) {
      toast(error.message, true);
    }
  });

  el.newBtn.addEventListener("click", () => {
    if (!confirm("새 주소를 만들면 지금 주소와 받은 메일이 모두 사라집니다. 계속할까요?")) return;
    destroyInbox({ thenSetup: true });
  });

  el.destroyBtn.addEventListener("click", () => {
    if (!confirm("이 주소와 받은 메일을 모두 지웁니다. 계속할까요?")) return;
    destroyInbox({ thenSetup: true });
  });

  async function destroyInbox({ thenSetup }) {
    try {
      await api(`/api/inboxes/${encodeURIComponent(inbox.address)}`, { method: "DELETE" });
    } catch {
      /* 이미 만료되어 사라졌을 수 있다. 로컬 상태만 정리하면 된다. */
    }
    saveInbox(null);
    messages = [];
    clearReader();
    if (thenSetup) {
      showSetup();
      el.localPart.value = "";
    }
  }

  el.imagesBtn.addEventListener("click", () => {
    showImages = !showImages;
    renderBody(openMessage);
  });

  el.rawBtn.addEventListener("click", () => {
    const showingText = !el.readerText.hidden;
    if (showingText) {
      renderBody(openMessage);
    } else {
      el.readerFrame.hidden = true;
      el.readerText.hidden = false;
      el.readerText.textContent = openMessage.text || "(텍스트 본문이 없습니다.)";
      el.imagesBtn.hidden = true;
    }
    el.rawBtn.textContent = showingText ? "원문 보기" : "서식 보기";
  });

  el.deleteMsgBtn.addEventListener("click", async () => {
    if (!openMessage) return;
    try {
      await api(`/api/messages/${encodeURIComponent(openMessage.id)}`, { method: "DELETE" });
      messages = messages.filter((m) => m.id !== openMessage.id);
      clearReader();
      renderList();
      toast("메일을 삭제했습니다.");
    } catch (error) {
      toast(error.message, true);
    }
  });

  el.themeBtn.addEventListener("click", toggleTheme);

  document.addEventListener("visibilitychange", () => {
    // 탭으로 돌아오면 밀린 메일을 바로 확인한다.
    if (!document.hidden && inbox) refresh({ immediate: true });
  });

  /* ── 시작 ──────────────────────────────────────────────────────────── */

  /**
   * 공유 링크(#주소:토큰)를 읽어 메일함을 연다.
   * 토큰이 주소창에 남지 않도록 처리 후 해시를 지운다.
   */
  async function adoptFromHash() {
    const hash = location.hash.slice(1);
    const separator = hash.indexOf(":");
    if (separator <= 0) return false;

    const address = decodeURIComponent(hash.slice(0, separator));
    const token = hash.slice(separator + 1);
    history.replaceState(null, "", location.pathname);

    if (!(await adoptInbox(address, token))) return false;
    toast("공유 링크로 메일함을 열었습니다.");
    return true;
  }

  // 이미 열려 있는 탭에 공유 링크를 붙여 넣어도 그 메일함으로 갈아탄다.
  window.addEventListener("hashchange", () => {
    void adoptFromHash();
  });

  async function init() {
    try {
      applyTheme(localStorage.getItem(THEME_KEY));
    } catch {
      /* 무시 */
    }

    await loadConfig();

    if (await adoptFromHash()) return;

    const stored = loadInbox();
    if (stored) {
      inbox = stored;
      if (await adoptInbox(stored.address, stored.token)) return;
      saveInbox(null);
    }

    showSetup();
  }

  init();
})();
