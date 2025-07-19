import { useEffect, useRef, useState } from "react";

export type Action = {
  label: string;
  action: () => void;
  type?: "separator";
};

export function ActionSelector({
  actions,
  on_outside_click,
}: {
  actions: Action[];
  on_outside_click: () => void;
}) {
  const [query, set_query] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        on_outside_click();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [on_outside_click]);

  const filtered = actions.filter((a) =>
    a.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="action-selector" ref={ref}>
      <div className="search">
        <input
          type="text"
          placeholder="Select action."
          value={query}
          onChange={(e) => set_query(e.target.value)}
        />
      </div>
      <div className="actions">
        {filtered.map((action, idx) =>
          action.type === "separator" ? (
            <div key={idx} className="separator" />
          ) : (
            <div key={idx} className="action" onClick={action.action}>
              {action.label}
            </div>
          )
        )}
        {filtered.length === 0 && (
          <div className="action disabled">No results</div>
        )}
      </div>
    </div>
  );
}
