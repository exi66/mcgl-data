export const FORUM_URL = "https://forum.minecraft-galaxy.ru/"

/**
 * CORS-прокси для запросов тултипов (/object/<id>/<type>), см.
 * mcgl-data-api/forum-proxy. Без него тултипы игроков и предметов отключены.
 */
const FORUM_PROXY_URL = (
  (import.meta.env.VITE_FORUM_PROXY_URL as string | undefined) ?? ""
).replace(/\/+$/, "")

export const FRAME_SIZE_MESSAGE = "mcgl-post-size"

export interface FrameSizeMessage {
  type: typeof FRAME_SIZE_MESSAGE
  /** Высота содержимого поста */
  height: number
  /** Нижняя граница видимого тултипа; 0, если тултипов нет */
  overlay: number
}

const STYLES = [
  "style.css?v=10",
  "red.css?v=5",
  "adaptive.css?v=3",
  "map/map.css",
  "js/jquery-ui.css",
]

// script.js содержит обработчики из разметки постов: спойлеры (switchTable),
// подсказки (showtip/hidetip), превью (show_preview), карту (show_map)
const SCRIPTS = [
  "js/jquery.min.js",
  "js/jquery-ui.min.js",
  "script.js?v=9",
  "map/script.js",
  "js/highlight.pack.js",
]

// Сбрасываем фон и высоту страницы форума, чтобы iframe подстраивался под пост
const RESET_CSS = `
html, body { height: auto; min-height: 0; margin: 0; padding: 0; background: transparent; }
/* Свёрнутый пост показывается iframe меньшей высоты: без прокрутки внутри */
html { overflow: hidden; }
#mcgl-root { padding: 1px 0; }
#mcgl-root .posts { margin: 0; }
img { max-width: 100%; height: auto; }
.tooltip { z-index: 10; }
`

// В sandbox без allow-same-origin обращение к document.cookie бросает
// SecurityError, а скрипты форума (карта и др.) читают и пишут куки.
// Подменяем их хранилищем в памяти документа.
const COOKIE_SHIM = `
(function () {
  var jar = {};
  try {
    Object.defineProperty(document, "cookie", {
      configurable: true,
      get: function () {
        return Object.keys(jar).map(function (k) { return k + "=" + jar[k]; }).join("; ");
      },
      set: function (value) {
        var parts = String(value).split(";");
        var pair = parts[0];
        var eq = pair.indexOf("=");
        if (eq <= 0) return;
        var key = pair.slice(0, eq).trim();
        var expired = /;\\s*(max-age=0|expires=[^;]*1970)/i.test(value);
        if (expired) delete jar[key];
        else jar[key] = pair.slice(eq + 1);
      }
    });
  } catch (e) {}
})();
`

// Сообщает родителю размеры: из sandbox без allow-same-origin родитель
// не может прочитать их сам. overlay — низ видимого тултипа (position: fixed),
// чтобы на время показа растянуть iframe поверх следующих карточек.
const SIZE_REPORTER = `
(function () {
  var root = document.getElementById("mcgl-root");
  var scheduled = false;

  function overlayBottom() {
    var bottom = 0;
    var tips = document.querySelectorAll(".tooltip");
    for (var i = 0; i < tips.length; i++) {
      var tip = tips[i];
      if (getComputedStyle(tip).display === "none") continue;
      var rect = tip.getBoundingClientRect();
      // Не даём тултипу уйти за правый край iframe
      if (rect.right > window.innerWidth) {
        tip.style.left = Math.max(0, window.innerWidth - rect.width - 4) + "px";
      }
      bottom = Math.max(bottom, rect.bottom + 4);
    }
    return Math.ceil(bottom);
  }

  function send() {
    scheduled = false;
    parent.postMessage({
      type: "${FRAME_SIZE_MESSAGE}",
      height: Math.ceil(root.getBoundingClientRect().height),
      overlay: overlayBottom()
    }, "*");
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(send);
  }

  if (window.ResizeObserver) new ResizeObserver(schedule).observe(root);
  // Тултипы добавляются в body и показываются/скрываются через style
  new MutationObserver(schedule).observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["style", "class"],
    characterData: true
  });
  window.addEventListener("load", schedule);
  send();
})();
`

// Форум не отдаёт CORS-заголовки, поэтому XHR тултипов идут через прокси
const PATCH_SCRIPTS = `
(function () {
  var proxy = ${JSON.stringify(FORUM_PROXY_URL)};
  if (typeof window.ajax_get_request !== "function") return;
  if (!proxy) {
    window.showtip = function () {};
    return;
  }
  var original = window.ajax_get_request;
  window.ajax_get_request = function (url, proc) {
    if (typeof url === "string" && url.indexOf("/object/") === 0) {
      url = proxy + url;
    }
    return original(url, proc);
  };
})();
try { if (window.hljs) hljs.initHighlighting(); } catch (e) {}
`

export function buildForumDocument(html: string): string {
  const styles = STYLES.map(
    (href) => `<link rel="stylesheet" href="${href}" />`
  ).join("")
  const scripts = SCRIPTS.map((src) => `<script src="${src}"></script>`).join(
    ""
  )

  return `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<base href="${FORUM_URL}" target="_blank" />
<script>${COOKIE_SHIM}</script>
${styles}
<style>${RESET_CSS}</style>
</head>
<body>
<div id="mcgl-root">${html}</div>
<script>${SIZE_REPORTER}</script>
${scripts}
<script>${PATCH_SCRIPTS}</script>
</body>
</html>`
}
