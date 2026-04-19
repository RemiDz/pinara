"use client";

/**
 * IntentSelector — radial picker around the gland.
 *
 * Six archetypes laid out at equal arc around a hidden circle.
 * Touch / click to choose. The picker is the only menu in v1 and
 * dissolves once a session begins.
 */

import { useId } from "react";
import { INTENTS, type IntentDefinition, type IntentId } from "@/lib/intent";
import { useI18n } from "@/lib/i18n-react";

type Props = {
  selected: IntentId | null;
  onSelect: (intent: IntentDefinition) => void;
  /** Outer radius in pixels — picker inscribes a circle of this radius around 0,0 */
  radius?: number;
};

export function IntentSelector({ selected, onSelect, radius = 168 }: Props) {
  const { t, locale } = useI18n();
  const labelId = useId();

  return (
    <div
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
      role="radiogroup"
      aria-labelledby={labelId}
    >
      <span id={labelId} className="sr-only">
        {t("intent.choose")}
      </span>
      <div className="relative" style={{ width: radius * 2, height: radius * 2 }}>
        {INTENTS.map((intent, i) => {
          const angle = (i / INTENTS.length) * Math.PI * 2 - Math.PI / 2;
          const x = radius * Math.cos(angle) + radius;
          const y = radius * Math.sin(angle) + radius;
          const isSelected = selected === intent.id;
          return (
            <button
              key={intent.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelect(intent)}
              className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 select-text rounded-full px-3 py-1 font-sans text-xs uppercase tracking-[0.2em] text-lunar-silver/85 transition-[opacity,transform,color] duration-breathe ease-breathe hover:text-pineal-gold focus-visible:text-pineal-gold focus-visible:outline-none data-[selected=true]:text-pineal-gold"
              data-selected={isSelected}
              style={{ left: x, top: y, color: isSelected ? intent.palette.rim : undefined }}
            >
              {intent.label[locale]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
