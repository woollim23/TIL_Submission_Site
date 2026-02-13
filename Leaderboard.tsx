import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";

const MIN_SUBMISSIONS = 4;
const FINE_PER_SHORTAGE = 5000;

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function startOfWeekMonday(d: Date) {
  const x = startOfDay(d);
  const day = x.getDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  x.setDate(x.getDate() - daysSinceMonday);
  return x;
}

export default function Leaderboard() {
  const [, navigate] = useLocation();
  const participants = trpc.participants.list.useQuery();
  const [selectedWeekOffset, setSelectedWeekOffset] = useState(0);

  const today = new Date();
  const thisWeekStart = startOfWeekMonday(today);

  // 2025-12-29부터 현재까지의 주차만 표시
  const cumulativeStartDate = startOfDay(new Date("2025-12-29"));
  const cumulativeStartWeek = startOfWeekMonday(cumulativeStartDate);

  const selectedWeekStart = (() => {
    const x = new Date(thisWeekStart);
    x.setDate(x.getDate() - 7 * selectedWeekOffset);
    // 선택된 주가 2025-12-29 이전이 되지 않도록 제한
    if (x < cumulativeStartWeek) {
      return new Date(cumulativeStartWeek);
    }
    return x;
  })();

  const selectedWeekEnd = (() => {
    const x = new Date(selectedWeekStart);
    x.setDate(x.getDate() + 6);
    return endOfDay(x);
  })();

  const submissions = trpc.tilSubmissions.getByDateRange.useQuery({
    startDate: selectedWeekStart,
    endDate: selectedWeekEnd,
  });

  const cumulativeStart = startOfDay(new Date("2025-12-29"));
  const allSubmissions = trpc.tilSubmissions.getByDateRange.useQuery({
    startDate: cumulativeStart,
    endDate: selectedWeekEnd,
  });

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
      .sort((a, b) => b.count - a.count);
  }, [participants.data, submissions.data]);

  // 지난주까지만 누적 벌금 계산
  const lastWeekStart = (() => {
    const thisWeekStart = startOfWeekMonday(today);
    const x = new Date(thisWeekStart);
    x.setDate(x.getDate() - 7);
    return x;
  })();
  const lastWeekEnd = (() => {
    const x = new Date(lastWeekStart);
    x.setDate(x.getDate() + 6);
    return endOfDay(x);
  })();

  const cumulativeFineData = useMemo(() => {
    if (!participants.data || !allSubmissions.data) return {};

    const countsByWeek: Record<string, number> = {};

    for (const sub of allSubmissions.data) {
      const subDate = new Date(sub.submissionDate);
      // 누적은 지난주까지만 계산
      if (subDate < cumulativeStart || subDate > lastWeekEnd) continue;

      const wkStart = startOfWeekMonday(subDate);
      const weekKey = wkStart.toISOString().slice(0, 10);
      const key = `${sub.participantId}|${weekKey}`;

      countsByWeek[key] = (countsByWeek[key] || 0) + 1;
    }

    const firstWeekStart = startOfWeekMonday(cumulativeStart);
    const lastWeekStartForLoop = startOfWeekMonday(lastWeekEnd);

    const cumulativeFines: Record<number, number> = {};
    participants.data.forEach((p) => (cumulativeFines[p.id] = 0));

    let wk = new Date(firstWeekStart);
    while (wk <= lastWeekStartForLoop) {
      const weekKey = wk.toISOString().slice(0, 10);

      for (const p of participants.data) {
        const count = countsByWeek[`${p.id}|${weekKey}`] || 0;
        const shortage = Math.max(0, MIN_SUBMISSIONS - count);
        cumulativeFines[p.id] += shortage * FINE_PER_SHORTAGE;
      }

      wk.setDate(wk.getDate() + 7);
    }

    return cumulativeFines;
  }, [participants.data, allSubmissions.data, lastWeekEnd]);

  // 현재 주부터 2025-12-29 주까지의 주차 수 계산
  const weeksFromStart = Math.floor((thisWeekStart.getTime() - cumulativeStartWeek.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
  
  const weekOptions = Array.from({ length: Math.max(0, weeksFromStart) }, (_, i) => ({
    value: i,
    label: (() => {
      const d = new Date(thisWeekStart);
      d.setDate(d.getDate() - 7 * i);
      const startYear = d.getFullYear();
      const startMonth = d.getMonth() + 1;
      const startDay = d.getDate();
      
      const end = new Date(d);
      end.setDate(end.getDate() + 6);
      const endYear = end.getFullYear();
      const endMonth = end.getMonth() + 1;
      const endDay = end.getDate();
      
      // 년도가 같으면 "2025. 12. 29. ~ 1. 4." 형식, 다르면 "2025. 12. 29. ~ 2026. 1. 4." 형식
      if (startYear === endYear) {
        return `${startYear}. ${startMonth}. ${startDay}. ~ ${endMonth}. ${endDay}.`;
      } else {
        return `${startYear}. ${startMonth}. ${startDay}. ~ ${endYear}. ${endMonth}. ${endDay}.`;
      }
    })(),
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/")}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              뒤로가기
            </Button>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">리더보드</h1>
          <p className="text-gray-600 dark:text-gray-400">모든 참여자의 주차별 제출 현황과 벌금 내역</p>
        </div>

        <div className="mb-6 flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">주차 선택:</label>
          <Select value={selectedWeekOffset.toString()} onValueChange={(v) => setSelectedWeekOffset(parseInt(v))}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {weekOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value.toString()}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => setSelectedWeekOffset(0)}>
            이번주
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">역대 누적 총 벌금</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-600">
                {Object.values(cumulativeFineData).reduce((sum, fine) => sum + fine, 0).toLocaleString()}원
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">평균 제출</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-600">
                {(leaderboardData.reduce((sum, p) => sum + p.count, 0) / (leaderboardData.length || 1)).toFixed(1)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">총 벌금</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-600">
                {leaderboardData.reduce((sum, p) => sum + p.fine, 0).toLocaleString()}원
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">목표 달성</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">
                {leaderboardData.filter((p) => p.count >= MIN_SUBMISSIONS).length}/{leaderboardData.length}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">주차별 제출 현황</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="text-left py-3 px-4 font-semibold">순위</th>
                    <th className="text-left py-3 px-4 font-semibold">참여자</th>
                    <th className="text-center py-3 px-4 font-semibold">제출 개수</th>
                    <th className="text-center py-3 px-4 font-semibold">미달</th>
                    <th className="text-center py-3 px-4 font-semibold">이번주 벌금</th>
                    <th className="text-center py-3 px-4 font-semibold">누적 벌금</th>
                    <th className="text-center py-3 px-4 font-semibold">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboardData.map((person, index) => (
                    <tr
                      key={person.id}
                      className={`border-b border-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer transition ${
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
                      <td className="text-center py-3 px-4">
                        <span className={person.count >= MIN_SUBMISSIONS ? "text-green-600 font-bold" : "text-gray-600"}>
                          {person.count}/{MIN_SUBMISSIONS}
                        </span>
                      </td>
                      <td className="text-center py-3 px-4">
                        {person.shortage > 0 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 bg-red-500 text-white rounded-full text-xs font-bold">
                            {person.shortage}
                          </span>
                        ) : (
                          <span className="text-green-600 font-bold">-</span>
                        )}
                      </td>
                      <td className="text-center py-3 px-4 font-semibold">
                        {person.fine > 0 ? (
                          <span className="text-red-600">{person.fine.toLocaleString()}원</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="text-center py-3 px-4 font-semibold">
                        {cumulativeFineData[person.id] > 0 ? (
                          <span className="text-red-600">{(cumulativeFineData[person.id] || 0).toLocaleString()}원</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="text-center py-3 px-4">
                        {person.count >= MIN_SUBMISSIONS ? (
                          <span className="inline-block px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-xs font-bold">
                            달성
                          </span>
                        ) : (
                          <span className="inline-block px-3 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-full text-xs font-bold">
                            미달
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
