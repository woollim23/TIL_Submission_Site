import { TILSubmitForm } from "@/components/TILSubmitForm";
import { CalendarView } from "@/components/CalendarView";
import { WeeklyStats } from "@/components/WeeklyStats";
import { FineStatus } from "@/components/FineStatus";
import { ParticipantManager } from "@/components/ParticipantManager";
import { LatestUpdates } from "@/components/LatestUpdates";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Settings, Moon, Sun } from "lucide-react";
import { useLocation } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";

export default function Home() {
  const [, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [showParticipantManager, setShowParticipantManager] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50 shadow-sm">
        <div className="container py-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-accent to-accent/70 bg-clip-text text-transparent">
              TIL Tracker
            </h1>
            <p className="text-sm text-muted-foreground mt-1">팀의 학습을 함께 추적합니다</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/leaderboard")}
              className="gap-2"
            >
              리더보드
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleTheme?.()}
              className="gap-2"
              title="테마 전환"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowParticipantManager(!showParticipantManager)}
              className="gap-2"
            >
              <Settings className="w-4 h-4" />
              {showParticipantManager ? "닫기" : "참여자 관리"}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8 space-y-8">
        {/* Participant Manager Section */}
        {showParticipantManager && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-300">
            <ParticipantManager />
          </div>
        )}

        {/* TIL Submit & Latest Updates Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="lg:col-span-1">
            <TILSubmitForm />
          </div>
          <div className="lg:col-span-1">
            <LatestUpdates />
          </div>
        </div>

        {/* Calendar Section */}
        <CalendarView />

        {/* Fine Status Section */}
        <FineStatus />
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-muted/20 mt-16">
        <div className="container py-8 text-center text-sm text-muted-foreground">
          <p>TIL Tracker 2026 - 팀의 성장을 함께합니다</p>
        </div>
      </footer>
    </div>
  );
}
