export function Loading({ message = "Loading guide data…" }: { message?: string }) {
  return <div className="app-loading" role="status">{message}</div>;
}

export function ErrorState({ message }: { message: string }) {
  return <div className="app-loading app-error" role="alert">{message}</div>;
}
