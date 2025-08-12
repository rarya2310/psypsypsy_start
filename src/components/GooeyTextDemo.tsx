import * as React from "react";
import { GooeyText } from "@/components/ui/gooey-text-morphing";

function GooeyTextDemo() {
  return (
    <div className="h-[200px] flex items-center justify-center">
      <GooeyText
        texts={["PSYPSYPSY", "It's a Vice.", "Made in INDIA", "COMING SOON."]}
        morphTime={3}
        cooldownTime={1.25}
        className="font-bold"
      />
    </div>
  );
}

export { GooeyTextDemo };
