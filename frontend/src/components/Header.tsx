import { Settings, HelpCircle } from "lucide-react";
import { Button } from "./ui/button";

export const Header = () => {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-border/50">
      <div>
        <img
          src="src/assets/logo3.png"
          alt="Logo da empresa"
          className="w-28"
        />
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          <HelpCircle className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
};
