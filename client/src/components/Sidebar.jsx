export default function Sidebar({
  t,
  language,
  onLanguage,
  status,
  hasMessages,
  loading,
  onClear,
  onDownload,
}) {
  const statusText = {
    checking: t.checking,
    online: t.online,
    "no-key": t.noKey,
    offline: t.offline,
  }[status];

  return (
    <aside className="sidebar">
      <div>
        <h1 className="brand">{t.title}</h1>
        <p className={`status status-${status}`} role="status">
          <span className="dot" aria-hidden="true" />
          {statusText}
        </p>
      </div>

      <div className="side-group">
        <p className="side-label" id="lang-label">
          {t.language}
        </p>
        <div className="segmented" role="group" aria-labelledby="lang-label">
          <button
            type="button"
            aria-pressed={language === "en"}
            onClick={() => onLanguage("en")}
          >
            English
          </button>
          <button
            type="button"
            aria-pressed={language === "te"}
            onClick={() => onLanguage("te")}
            lang="te"
          >
            తెలుగు
          </button>
        </div>
      </div>

      <div className="side-actions">
        <button type="button" onClick={onDownload} disabled={!hasMessages}>
          {t.download}
        </button>
        <button type="button" onClick={onClear} disabled={!hasMessages || loading}>
          {t.clear}
        </button>
      </div>

      <p className="notice">{t.notice}</p>
    </aside>
  );
}
