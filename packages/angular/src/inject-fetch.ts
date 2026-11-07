// Internal: the Signals API's shared shape. Starts the fetch now, aborts it
// when the injection context is destroyed.
import { inject, DestroyRef, signal } from "@angular/core";
import type { Signal } from "@angular/core";

export interface FetchSignals<T> {
  value: Signal<T | null>;
  loading: Signal<boolean>;
  error: Signal<Error | null>;
}

export function injectFetch<T>(run: (signal: AbortSignal) => Promise<T>): FetchSignals<T> {
  const value = signal<T | null>(null);
  const loading = signal(true);
  const error = signal<Error | null>(null);

  const destroyRef = inject(DestroyRef);
  const controller = new AbortController();

  run(controller.signal)
    .then((data) => {
      value.set(data);
      loading.set(false);
    })
    .catch((err: unknown) => {
      if (err instanceof Error && err.name === "AbortError") return;
      error.set(err instanceof Error ? err : new Error(String(err)));
      loading.set(false);
    });

  destroyRef.onDestroy(() => controller.abort());

  return { value: value.asReadonly(), loading: loading.asReadonly(), error: error.asReadonly() };
}
