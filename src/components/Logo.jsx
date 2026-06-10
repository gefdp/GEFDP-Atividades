import React, { useState } from "react";

export default function Logo({ className = "w-6 h-6", fallback: Fallback }) {
  const [imgError, setImgError] = useState(false);

  if (imgError) {
    return Fallback ? <Fallback className={className} aria-hidden="true" /> : null;
  }

  return (
    <img
      src={`${import.meta.env.BASE_URL}logo/logo.png`}
      alt="GEFDP"
      className={`${className} object-contain`}
      onError={() => setImgError(true)}
    />
  );
}
