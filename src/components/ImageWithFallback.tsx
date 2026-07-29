import { useState } from "react";
import { initials } from "../lib/text";

interface Props {
  src?: string;
  alt: string;
  label?: string;
  className?: string;
  fallbackClassName?: string;
  loading?: "eager" | "lazy";
}

export function ImageWithFallback({
  src,
  alt,
  label = alt,
  className = "",
  fallbackClassName = "",
  loading = "lazy",
}: Props) {
  // Track the URL that failed instead of a permanent boolean. When a loadout
  // selection changes `src`, the new image is attempted immediately.
  const [failedSrc, setFailedSrc] = useState<string | undefined>();
  const failed = !src || failedSrc === src;

  if (failed || !src) {
    return (
      <span className={`symbol-fallback ${fallbackClassName}`.trim()} aria-label={alt}>
        {initials(label) || "?"}
      </span>
    );
  }

  return (
    <img
      key={src}
      className={className}
      src={src}
      alt={alt}
      loading={loading}
      onLoad={() => setFailedSrc(undefined)}
      onError={() => setFailedSrc(src)}
    />
  );
}
