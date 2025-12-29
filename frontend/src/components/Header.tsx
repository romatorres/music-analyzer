import { Waves, Settings, HelpCircle } from "lucide-react";
import { Button } from "./ui/button";

export const Header = () => {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-border/50">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Waves className="h-8 w-8 text-primary" />
          <div className="absolute inset-0 blur-lg bg-primary/30" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">
            Audio<span className="text-primary">Lab</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Análise Musical Profissional
          </p>
        </div>
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
