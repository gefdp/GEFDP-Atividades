import React, { useState } from "react";
import { Award } from "lucide-react";
import { getToolBadgeUrl } from "@/lib/toolsCatalog";

export default function MiniToolBadge({ tool }) {
  const { name, level, progressPercent, tier } = tool;
  const [imgError, setImgError] = useState(false);

  return (
    <div className="min-w-0">
      <div className="h-16 flex items-center justify-center">
        {!imgError ? (
          <img
            src={getToolBadgeUrl(tool)}
            alt={name}
            className="w-full h-full object-contain"
            onError={() => setImgError(true)}
          />
        ) : (
          <Award className={`w-6 h-6 ${tier.color}`} />
        )}
      </div>
      <p title={name} className={`mt-1 text-[10px] text-center leading-tight font-semibold truncate ${tier.color}`}>
        {name}
      </p>
      <p className="text-[9px] text-center text-muted-foreground leading-tight">Nível {level}</p>
      <div className="mt-1 h-1.5 rounded-full bg-border overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${tier.bar}`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}
