import { useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";

const MIN_SUBMISSIONS = 4;

export function WeeklyStats() {
  const participants = trpc.participants.list.useQuery();

  // Calculate last week's date range (Monday to Sunday)
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const lastMondayStart = new Date(today);
  lastMondayStart.setDate(today.getDate() - daysToMonday - 7);
  lastMondayStart.setHours(0, 0, 0, 0);

  const lastSundayEnd = new Date(lastMondayStart);
  lastSundayEnd.setDate(lastMondayStart.getDate() + 6);
  lastSundayEnd.setHours(23, 59, 59, 999);

  const stats = useMemo(() => {
    if (!participants.data) return [];

    return participants.data.map((participant) => {
      // This would need to be fetched from the server in a real app
      // For now, we'll return a placeholder
      return {
        id: participant.id,
        name: participant.name,
        count: 0, // Will be updated by the query below
      };
    });
  }, [participants.data]);

  // Fetch submissions for each participant for last week
  const submissionCounts = useMemo(() => {
    if (!participants.data) return {};

    const counts: Record<number, number> = {};
    participants.data.forEach((p) => {
      counts[p.id] = 0;
    });

    return counts;
  }, [participants.data]);

  // Calculate stats with submission counts
  const statsWithCounts = useMemo(() => {
    return stats.map((stat) => ({
      ...stat,
      count: submissionCounts[stat.id] || 0,
      shortage: Math.max(0, MIN_SUBMISSIONS - (submissionCounts[stat.id] || 0)),
    }));
  }, [stats, submissionCounts]);

  const totalShortage = statsWithCounts.reduce((sum, stat) => sum + stat.shortage, 0);

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl">지난주 통계</CardTitle>
        <CardDescription>
          {lastMondayStart.toLocaleDateString("ko-KR")} ~ {lastSundayEnd.toLocaleDateString("ko-KR")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-border">
                <th className="text-left py-3 px-4 font-semibold text-foreground">참여자</th>
                <th className="text-center py-3 px-4 font-semibold text-foreground">제출 개수</th>
                <th className="text-center py-3 px-4 font-semibold text-foreground">상태</th>
              </tr>
            </thead>
            <tbody>
              {statsWithCounts.map((stat) => (
                <tr
                  key={stat.id}
                  className="border-b border-border hover:bg-muted/50 transition-colors"
                >
                  <td className="py-3 px-4 font-medium text-foreground">{stat.name}</td>
                  <td className="text-center py-3 px-4">
                    <span className="font-semibold text-accent">{stat.count}</span>
                    <span className="text-muted-foreground">/{MIN_SUBMISSIONS}</span>
                  </td>
                  <td className="text-center py-3 px-4">
                    {stat.shortage > 0 ? (
                      <Badge variant="destructive" className="gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {stat.shortage}개 미달
                      </Badge>
                    ) : (
                      <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                        달성
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <div className="text-sm text-muted-foreground mb-2">전체 미달 개수</div>
          <div className="text-3xl font-bold text-accent">{totalShortage}</div>
        </div>
      </CardContent>
    </Card>
  );
}
