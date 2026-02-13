import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";
import { ArrowUp, ArrowDown, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

const MIN_SUBMISSIONS = 4;
const FINE_PER_SHORTAGE = 5000;

interface WeeklyFineData {
  week: string;
  startDate: Date;
  endDate: Date;
  totalFine: number;
  participantFines: Record<string, number>;
}

export default function FineHistory() {
  const [, setLocation] = useLocation();
  const [showDetailedTable, setShowDetailedTable] = useState(false);
  const [showParticipantTrends, setShowParticipantTrends] = useState(false);
  const participants = trpc.participants.list.useQuery();

  // Generate last 12 weeks of data
  const weeksData = useMemo(() => {
    const weeks: WeeklyFineData[] = [];
    const today = new Date();

    for (let i = 11; i >= 0; i--) {
      const endDate = new Date(today);
      endDate.setDate(today.getDate() - i * 7);

      const startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - 6);

      const weekNumber = Math.ceil((endDate.getDate() - startDate.getDate() + 1) / 7);
      const weekStr = `${(endDate.getMonth() + 1).toString().padStart(2, "0")}.${endDate.getDate().toString().padStart(2, "0")}`;

      weeks.push({
        week: weekStr,
        startDate,
        endDate,
        totalFine: 0,
        participantFines: {},
      });
    }

    return weeks;
  }, []);

  // Fetch submissions for all weeks
  const allSubmissions = trpc.tilSubmissions.getByDateRange.useQuery({
    startDate: new Date(weeksData[0].startDate),
    endDate: new Date(weeksData[weeksData.length - 1].endDate),
  });

  // Calculate fines for each week
  const fineHistory = useMemo(() => {
    if (!participants.data || !allSubmissions.data) return [];

    return weeksData.map((week) => {
      const submissionCounts: Record<number, number> = {};
      participants.data.forEach((p) => {
        submissionCounts[p.id] = 0;
      });

      allSubmissions.data.forEach((sub) => {
        const subDate = new Date(sub.submissionDate);
        if (subDate >= week.startDate && subDate <= week.endDate) {
          submissionCounts[sub.participantId] = (submissionCounts[sub.participantId] || 0) + 1;
        }
      });

      let totalFine = 0;
      const participantFines: Record<string, { name: string; count: number; fine: number }> = {};

      participants.data.forEach((p) => {
        const count = submissionCounts[p.id] || 0;
        const shortage = Math.max(0, MIN_SUBMISSIONS - count);
        const fine = shortage * FINE_PER_SHORTAGE;
        totalFine += fine;
        participantFines[p.id] = {
          name: p.name,
          count,
          fine,
        };
      });

      return {
        week: week.week,
        totalFine,
        participantFines,
      };
    });
  }, [weeksData, participants.data, allSubmissions.data]);

  // Prepare chart data
  const chartData = useMemo(() => {
    return fineHistory.map((item) => ({
      week: item.week,
      totalFine: item.totalFine,
    }));
  }, [fineHistory]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalFines = fineHistory.reduce((sum, week) => sum + week.totalFine, 0);
    const averageFine = Math.round(totalFines / fineHistory.length);
    const maxWeek = fineHistory.reduce((max, week) =>
      week.totalFine > max.totalFine ? week : max
    );
    const minWeek = fineHistory.reduce((min, week) =>
      week.totalFine < min.totalFine ? week : min
    );

    return {
      totalFines,
      averageFine,
      maxWeek,
      minWeek,
    };
  }, [fineHistory]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50 shadow-sm">
        <div className="container py-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-accent to-accent/70 bg-clip-text text-transparent">
              벌금 히스토리
            </h1>
            <p className="text-sm text-muted-foreground mt-1">주차별 벌금 부과 내역 및 추이</p>
          </div>
          <Button
            variant="outline"
            onClick={() => setLocation("/")}
          >
            돌아가기
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8 space-y-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">총 벌금</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent">
                {stats.totalFines.toLocaleString()}원
              </div>
              <p className="text-xs text-muted-foreground mt-1">지난 12주</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">평균 벌금</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent">
                {stats.averageFine.toLocaleString()}원
              </div>
              <p className="text-xs text-muted-foreground mt-1">주당 평균</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">최고 벌금</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">
                {stats.maxWeek.totalFine.toLocaleString()}원
              </div>
              <p className="text-xs text-muted-foreground mt-1">{stats.maxWeek.week}주</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">최저 벌금</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {stats.minWeek.totalFine.toLocaleString()}원
              </div>
              <p className="text-xs text-muted-foreground mt-1">{stats.minWeek.week}주</p>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">벌금 추이</CardTitle>
            <CardDescription>지난 12주간의 주차별 총 벌금</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="week" stroke="var(--muted-foreground)" />
                <YAxis stroke="var(--muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius)",
                  }}
                  formatter={(value) => `${(value as number).toLocaleString()}원`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="totalFine"
                  stroke="var(--accent)"
                  strokeWidth={3}
                  dot={{ fill: "var(--accent)", r: 5 }}
                  activeDot={{ r: 7 }}
                  name="총 벌금"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Detailed Table */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="cursor-pointer" onClick={() => setShowDetailedTable(!showDetailedTable)}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl">주차별 상세 내역</CardTitle>
                <CardDescription>각 주차별 참여자별 벌금 현황</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="ml-2"
              >
                {showDetailedTable ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </Button>
            </div>
          </CardHeader>
          {showDetailedTable && (
            <CardContent className="animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-border">
                      <th className="text-left py-3 px-4 font-semibold text-foreground">주차</th>
                      <th className="text-right py-3 px-4 font-semibold text-foreground">총 벌금</th>
                      <th className="text-center py-3 px-4 font-semibold text-foreground">참여자별 내역</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fineHistory.map((week, idx) => (
                      <tr key={idx} className="border-b border-border hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4 font-medium text-foreground">{week.week}</td>
                        <td className="text-right py-3 px-4 font-bold text-accent">
                          {week.totalFine.toLocaleString()}원
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(week.participantFines).map(([id, data]) => (
                              <div
                                key={id}
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  data.fine > 0
                                    ? "bg-destructive/10 text-destructive"
                                    : "bg-green-600/10 text-green-600"
                                }`}
                              >
                                {data.name}: {data.count}/{MIN_SUBMISSIONS}
                                {data.fine > 0 && ` (-${data.fine.toLocaleString()}원)`}
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Participant Fine Trends */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="cursor-pointer" onClick={() => setShowParticipantTrends(!showParticipantTrends)}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl">참여자별 벌금 추이</CardTitle>
                <CardDescription>각 참여자의 벌금 변화 패턴</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="ml-2"
              >
                {showParticipantTrends ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </Button>
            </div>
          </CardHeader>
          {showParticipantTrends && (
            <CardContent className="animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="space-y-4">
                {participants.data?.map((participant) => {
                  const participantTrend = fineHistory.map((week) => ({
                    week: week.week,
                    fine: week.participantFines[participant.id]?.fine || 0,
                  }));

                  const totalParticipantFine = participantTrend.reduce((sum, w) => sum + w.fine, 0);

                  return (
                    <div key={participant.id} className="p-4 bg-card border border-border rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-foreground">{participant.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            총 벌금: {totalParticipantFine.toLocaleString()}원
                          </p>
                        </div>
                        {totalParticipantFine > 0 && (
                          <TrendingUp className="w-5 h-5 text-destructive" />
                        )}
                      </div>
                      <ResponsiveContainer width="100%" height={150}>
                        <BarChart data={participantTrend}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                          <XAxis dataKey="week" stroke="var(--muted-foreground)" />
                          <YAxis stroke="var(--muted-foreground)" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "var(--card)",
                              border: "1px solid var(--border)",
                              borderRadius: "var(--radius)",
                            }}
                            formatter={(value) => `${(value as number).toLocaleString()}원`}
                          />
                          <Bar dataKey="fine" fill="var(--accent)" name="벌금" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          )}
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-muted/20 mt-16">
        <div className="container py-8 text-center text-sm text-muted-foreground">
          <p>TIL Tracker 벌금 히스토리 - 팀의 성장을 함께합니다</p>
        </div>
      </footer>
    </div>
  );
}
