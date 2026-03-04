import { memo } from "react";
import { getClauseColor } from "@/utils/clauseStyles";

const ColorLegend = memo(function ColorLegend({ types }) {
  if (!types?.length) return null;
  return (
    <div className="flex flex-col gap-1 mb-3 text-sm">
      {types.map((type) => {
        const colors = getClauseColor(type);
        return (
          <div className="flex items-center gap-2" key={type}>
            <span
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: colors.bg }}
            />
            {type}
          </div>
        );
      })}
    </div>
  );
});
export default ColorLegend;
