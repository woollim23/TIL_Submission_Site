import { TILSubmitForm } from "@/components/TILSubmitForm";
import { CalendarView } from "@/components/CalendarView";
import { WeeklyStats } from "@/components/WeeklyStats";
import { FineStatus } from "@/components/FineStatus";
import { ParticipantManager } from "@/components/ParticipantManager";
import { LatestUpdates } from "@/components/LatestUpdates";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Settings, Moon, Sun, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";

function LeaderboardBlock() {
  const [, navigate] = useLocation();
  const participants = trpc.participants.list.useQuery();
  const today = new Date();
  const thisWeekStart = (() => {
    const x = new Date(today);
    const day = x.getDay();
    const daysSinceMonday = day === 0 ? 6 : day - 1;
    x.setDate(x.getDate() - daysSinceMonday);
    x.setHours(0, 0, 0, 0);
    return x;
  })();
  const thisWeekEnd = (() => {
    const x = new Date(thisWeekStart);
    x.setDate(x.getDate() + 6);
    x.setHours(23, 59, 59, 999);
    return x;
  })();

  const submissions = trpc.tilSubmissions.getByDateRange.useQuery({
    startDate: thisWeekStart,
    endDate: thisWeekEnd,
  });

  const MIN_SUBMISSIONS = 4;
  const FINE_PER_SHORTAGE = 5000;

  const leaderboardData = useMemo(() => {
    if (!participants.data || !submissions.data) return [];

    const submissionCounts: Record<number, number> = {};
    participants.data.forEach((p) => (submissionCounts[p.id] = 0));

    submissions.data.forEach((sub) => {
      submissionCounts[sub.participantId] = (submissionCounts[sub.participantId] || 0) + 1;
    });

    return participants.data
      .map((participant) => {
        const count = submissionCounts[participant.id] || 0;
        const shortage = Math.max(0, MIN_SUBMISSIONS - count);
        const fine = shortage * FINE_PER_SHORTAGE;

        return {
          id: participant.id,
          name: participant.name,
          emoji: participant.emoji,
          count,
          shortage,
          fine,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // 상위 5명만 표시
  }, [participants.data, submissions.data]);

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl">이번주 리더보드</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/leaderboard")}
            className="gap-2"
          >
            전체보기
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-300 dark:border-slate-600">
                <th className="text-left py-3 px-4 font-semibold">순위</th>
                <th className="text-left py-3 px-4 font-semibold">참여자</th>
                <th className="text-center py-3 px-4 font-semibold">제출</th>
                <th className="text-center py-3 px-4 font-semibold">미달</th>
                <th className="text-center py-3 px-4 font-semibold">벌금</th>
              </tr>
            </thead>
            <tbody>
              {leaderboardData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-muted-foreground">
                    아직 제출 데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                leaderboardData.map((person, index) => (
                  <tr
                    key={person.id}
                    className={`border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer transition ${
                      person.fine > 0 ? "bg-red-50 dark:bg-red-950" : ""
                    }`}
                    onClick={() => navigate(`/participant/${person.id}`)}
                  >
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center justify-center w-7 h-7 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full font-bold text-sm">
                        {index + 1}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium">
                      <span className="mr-2">{person.emoji}</span>
                      {person.name}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full font-semibold text-sm">
                        {person.count}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-semibold text-sm ${
                          person.shortage > 0
                            ? "bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300"
                            : "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                        }`}
                      >
                        {person.shortage}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-semibold text-red-600 dark:text-red-400">
                      {person.fine.toLocaleString()}원
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

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

        {/* Leaderboard Section */}
        <LeaderboardBlock />
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
