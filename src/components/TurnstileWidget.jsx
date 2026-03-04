import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

function loadTurnstileScript() {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (window.__turnstileLoading) return window.__turnstileLoading;

  window.__turnstileLoading = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.turnstile);
    script.onerror = () =>
      reject(new Error("Failed to load Turnstile script."));
    document.head.appendChild(script);
  });

  return window.__turnstileLoading;
}

const TurnstileWidget = forwardRef(function TurnstileWidget(
  { onVerify, onExpire, onError },
  ref
) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;

  useImperativeHandle(ref, () => ({
    reset: () => {
      if (window.turnstile && widgetIdRef.current !== null) {
        window.turnstile.reset(widgetIdRef.current);
      }
    },
  }));

  useEffect(() => {
    if (!siteKey || !containerRef.current) return undefined;
    let cancelled = false;

    loadTurnstileScript()
      .then((turnstile) => {
        if (cancelled || !turnstile || !containerRef.current) return;
        widgetIdRef.current = turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token) => onVerify?.(token),
          "expired-callback": () => onExpire?.(),
          "error-callback": () => onError?.(),
          theme: "auto",
        });
      })
      .catch(() => onError?.());

    return () => {
      cancelled = true;
      if (window.turnstile && widgetIdRef.current !== null) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, onVerify, onExpire, onError]);

  if (!siteKey) {
    return (
      <div className="text-sm text-rose-600">
        Turnstile site key missing. Set `VITE_TURNSTILE_SITE_KEY` in `.env`.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      aria-label="Turnstile verification"
      className="flex justify-center"
    />
  );
});

export { TurnstileWidget };
