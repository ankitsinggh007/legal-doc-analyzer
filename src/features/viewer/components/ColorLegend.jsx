import { memo } from "react";

const ColorLegend = memo(function ColorLegend() {
  return (
    <div className="flex flex-col gap-1 mb-3 text-sm">
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-sm bg-red-200 dark:bg-red-900" />
        Termination
      </div>
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-sm bg-amber-200 dark:bg-amber-900" />
        Penalty
      </div>
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-sm bg-blue-200 dark:bg-blue-900" />
        Confidentiality
      </div>
    </div>
  );
});
export default ColorLegend;
