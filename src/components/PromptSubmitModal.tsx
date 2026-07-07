import { useEffect, useRef, useState } from "react";
import { apiJson } from "../lib/api";
import { Button, Modal } from "./ui";

declare global {
  interface Window {
    grecaptcha?: {
      render: (
        element: HTMLElement,
        options: { callback: (token: string) => void; sitekey: string },
      ) => number;
      reset: (widgetId?: number) => void;
    };
  }
}

type PromptConfig = {
  balance: number;
  maxPerDay: number;
  promptCost: number;
  recaptchaSiteKey: string;
  remainingToday: number;
};

const RECAPTCHA_SCRIPT_ID = "smotu-recaptcha-script";

function loadRecaptchaScript(): void {
  if (document.getElementById(RECAPTCHA_SCRIPT_ID)) {
    return;
  }

  const script = document.createElement("script");
  script.id = RECAPTCHA_SCRIPT_ID;
  script.async = true;
  script.defer = true;
  script.src = "https://www.google.com/recaptcha/api.js?render=explicit";
  document.head.appendChild(script);
}

export function PromptSubmitModal({
  onClose,
  open,
  signedIn,
  onSignIn,
}: {
  onClose: () => void;
  onSignIn: () => void | Promise<void>;
  open: boolean;
  signedIn: boolean;
}) {
  const [config, setConfig] = useState<PromptConfig | null>(null);
  const [prompt, setPrompt] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const widgetContainerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open || !signedIn) {
      return;
    }

    setError("");
    setSuccess("");
    void apiJson<PromptConfig>("/api/prompt-submissions/config")
      .then(setConfig)
      .catch((reason) => {
        setError(
          reason instanceof Error
            ? reason.message
            : "Configuration du formulaire impossible.",
        );
      });
  }, [open, signedIn]);

  useEffect(() => {
    if (!open || !config?.recaptchaSiteKey) {
      return;
    }

    loadRecaptchaScript();
    let cancelled = false;
    const timer = window.setInterval(() => {
      if (
        cancelled ||
        widgetIdRef.current !== null ||
        !widgetContainerRef.current ||
        !window.grecaptcha
      ) {
        return;
      }

      widgetIdRef.current = window.grecaptcha.render(widgetContainerRef.current, {
        sitekey: config.recaptchaSiteKey,
        callback: setCaptchaToken,
      });
      window.clearInterval(timer);
    }, 100);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      if (widgetIdRef.current !== null && window.grecaptcha) {
        window.grecaptcha.reset(widgetIdRef.current);
        widgetIdRef.current = null;
      }
      setCaptchaToken("");
    };
  }, [config?.recaptchaSiteKey, open]);

  async function submitPrompt() {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await apiJson<{
        balance: number;
        promptCost: number;
        remainingToday: number;
      }>("/api/prompt-submissions", {
        method: "POST",
        body: JSON.stringify({ prompt, captchaToken }),
      });
      setPrompt("");
      setCaptchaToken("");
      setConfig((current) =>
        current
          ? {
              ...current,
              balance: response.balance,
              promptCost: response.promptCost,
              remainingToday: response.remainingToday,
            }
          : current,
      );
      window.dispatchEvent(new CustomEvent("smotu:score", { detail: { score: 0 } }));
      setSuccess("Prompt envoyé sur Discord. Les smotucoins ont été débités.");
      if (widgetIdRef.current !== null && window.grecaptcha) {
        window.grecaptcha.reset(widgetIdRef.current);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Envoi impossible.");
      if (widgetIdRef.current !== null && window.grecaptcha) {
        window.grecaptcha.reset(widgetIdRef.current);
      }
      setCaptchaToken("");
    } finally {
      setLoading(false);
    }
  }

  const remaining = config?.remainingToday ?? 0;
  const balance = config?.balance ?? 0;
  const promptCost = config?.promptCost ?? 25;
  const canAfford = balance >= promptCost;
  const canSubmit = Boolean(
    prompt.trim() && captchaToken && remaining > 0 && canAfford && !loading,
  );

  return (
    <Modal
      onClose={onClose}
      open={open}
      title="Proposer un prompt Codex / Claude Code"
    >
      {!signedIn ? (
        <div className="space-y-4">
          <p className="leading-6 text-muted-foreground">
            Connecte-toi pour proposer un prompt. Ça permet de limiter le spam à 3
            prompts par jour et par utilisateur.
          </p>
          <Button type="button" onClick={onSignIn}>
            Se connecter
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="leading-6 text-muted-foreground">
            Décris précisément ce que Codex ou Claude Code devrait changer dans le
            site. Chaque envoi coûte {promptCost} smotucoins et partira dans
            Discord via le webhook configuré côté worker Cloudflare.
          </p>
          <div className="grid gap-2 rounded-lg border border-border bg-background p-3 text-sm text-muted-foreground sm:grid-cols-3">
            <span>
              Prix : <strong className="text-foreground">{promptCost}</strong>
            </span>
            <span>
              Solde : <strong className="text-foreground">{balance}</strong>
            </span>
            <span>
              Restants : <strong className="text-foreground">{remaining}</strong>/
              {config?.maxPerDay ?? 3}
            </span>
          </div>
          <label className="block space-y-2">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-muted-strong">
              Prompt
            </span>
            <textarea
              className="min-h-40 w-full rounded-md border border-input bg-background px-4 py-3 text-sm leading-6 text-foreground outline-none placeholder:text-muted-strong focus:border-ring"
              maxLength={2000}
              placeholder="Ex: Ajoute un mode sombre plus contrasté et adapte les boutons du header..."
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
            />
          </label>
          <div className="flex flex-col gap-3 rounded-lg border border-border bg-background p-3">
            {config?.recaptchaSiteKey ? (
              <div ref={widgetContainerRef} />
            ) : (
              <p className="text-sm font-bold text-warning">
                Clé site Google reCAPTCHA à configurer dans le worker.
              </p>
            )}
            {!canAfford ? (
              <p className="text-xs font-bold text-destructive">
                Solde insuffisant : il faut {promptCost} smotucoins pour envoyer
                un prompt.
              </p>
            ) : null}
          </div>
          {error ? (
            <p className="text-sm font-bold text-destructive">{error}</p>
          ) : null}
          {success ? (
            <p className="text-sm font-bold text-success">{success}</p>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <Button disabled={!canSubmit} type="button" onClick={submitPrompt}>
              {loading ? "Envoi..." : `Envoyer (${promptCost} smotucoins)`}
            </Button>
            <Button type="button" variant="ghost" onClick={onClose}>
              Fermer
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
