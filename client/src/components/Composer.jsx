import { useEffect, useRef, useState } from "react";

const LIMIT = 4000;

export default function Composer({ t, loading, onSend }) {
  const [value, setValue] = useState("");
  const ref = useRef(null);

  // Grow with the text, up to a cap.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);

  // Return focus to the box when a reply arrives.
  useEffect(() => {
    if (!loading) ref.current?.focus();
  }, [loading]);

  function submit(event) {
    event?.preventDefault();
    if (onSend(value)) setValue("");
  }

  function onKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
  }

  return (
    <form className="composer" onSubmit={submit}>
      <textarea
        ref={ref}
        rows={1}
        value={value}
        maxLength={LIMIT}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={t.placeholder}
        aria-label={t.placeholder}
        disabled={loading}
      />
      <button type="submit" className="send" disabled={loading || !value.trim()}>
        {t.send}
      </button>
      {value.length > LIMIT - 300 && (
        <span className="counter">
          {value.length}/{LIMIT}
        </span>
      )}
    </form>
  );
}
