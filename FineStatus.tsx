import { useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

// 월요일 00:00 기준 주차 시작일
function startOfWeekMonday(d: Date) {
  const x = startOfDay(d);
  const day = x.getDay(); // 0=Sun ... 6=Sat
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  x.setDate(x.getDate() - daysSinceMonday);
  return x;
}

export function FineStatus() {
  const [, navigate] = useLocation();
  const participants = trpc.participants.list.useQuery();

  const today = new Date();

  // 지난주(월~일)
  const lastWeekStart = (() => {
    const thisWeekStart = startOfWeekMonday(today);
    const x = new Date(thisWeekStart);
    x.setDate(x.getDate() - 7);
    return x; // 지난주 월요일 00:00
  })();

  const lastWeekEnd = (() => {
    const x = new Date(lastWeekStart);
    x.setDate(x.getDate() + 6);
    return endOfDay(x); // 지난주 일요일 23:59:59.999
  })();

  const submissions = trpc.tilSubmissions.getByDateRange.useQuery({
    startDate: lastWeekStart,
    endDate: lastWeekEnd,
  });

  // ✅ 누적 벌금 계산용: 2026-01-01 ~ 지난주 일요일까지(이번 주 제외)
  const cumulativeStart = startOfDay(new Date("2026-01-01"));
  const allSubmissions = trpc.tilSubmissions.getByDateRange.useQuery({
    startDate: cumulativeStart,
    endDate: lastWeekEnd,
  });

  const fineData = useMemo(() => {
    if (!participants.data || !submissions.data) return [];

    const submissionCounts: Record<number, number> = {};
    participants.data.forEach((p) => (submissionCounts[p.id] = 0));

    submissions.data.forEach((sub) => {
      submissionCounts[sub.participantId] = (submissionCounts[sub.participantId] || 0) + 1;
    });

    return participants.data.map((participant) => {
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
    });
  }, [participants.data, submissions.data]);

  // ✅ 2026-01-01부터 주차별로 (4-제출수)*5000 누적
  const cumulativeFineData = useMemo(() => {
    if (!participants.data || !allSubmissions.data) return {};

    // 1) (participantId, weekStart)별 제출 수 집계
    //    key: `${participantId}|YYYY-MM-DD(weekStart)`
    const countsByWeek: Record<string, number> = {};

    for (const sub of allSubmissions.data) {
      const subDate = new Date(sub.submissionDate);
      // 혹시 서버에서 범위 외도 섞여오면 안전하게 컷
      if (subDate < cumulativeStart || subDate > lastWeekEnd) continue;

      const wkStart = startOfWeekMonday(subDate);
      const weekKey = wkStart.toISOString().slice(0, 10); // YYYY-MM-DD
      const key = `${sub.participantId}|${weekKey}`;

      countsByWeek[key] = (countsByWeek[key] || 0) + 1;
    }

    // 2) 2026-01-01이 속한 주의 월요일부터 지난주까지, 주차를 순회하며 벌금 합산
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
  }, [participants.data, allSubmissions.data, cumulativeStart, lastWeekEnd]);

  const totalCumulativeFine = Object.values(cumulativeFineData).reduce((sum, fine) => sum + fine, 0);
  const thisWeekTotalFine = fineData.reduce((sum, person) => sum + person.fine, 0);

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-2xl">벌금 현황</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="border-2 border-black p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-600 mb-2">누적 총 벌금</p>
            <p className="text-2xl font-bold">{totalCumulativeFine.toLocaleString()}원</p>
          </div>

          <div className="border-2 border-black p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-600 mb-2">지난주 총 벌금</p>
            <p className="text-2xl font-bold">{thisWeekTotalFine.toLocaleString()}원</p>
          </div>

          <div className="border-2 border-black p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-600 mb-2">필수 제출 갯수</p>
            <p className="text-2xl font-bold">{MIN_SUBMISSIONS}회</p>
          </div>

          <div className="border-2 border-black p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-600 mb-2">미달 횟수당 벌금</p>
            <p className="text-2xl font-bold">{FINE_PER_SHORTAGE.toLocaleString()}원</p>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-lg">지난주 제출 현황</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left py-2 px-3 font-semibold">참여자</th>
                  <th className="text-center py-2 px-3 font-semibold">제출 개수</th>
                  <th className="text-center py-2 px-3 font-semibold">미달</th>
                  <th className="text-right py-2 px-3 font-semibold">벌금</th>
                </tr>
              </thead>
              <tbody>
                {fineData.map((person) => (
                  <tr
                    key={person.id}
                    className={`border-b border-gray-200 ${person.fine > 0 ? "bg-red-50 dark:bg-slate-700" : ""}`}
                  >
                    <td
                      className={`py-3 px-3 cursor-pointer hover:text-blue-600 font-medium ${person.fine > 0 ? "dark:text-white" : ""}`}
                      onClick={() => navigate(`/participant/${person.id}`)}
                    >
                      <span className="mr-2">{person.emoji}</span>
                      {person.name}
                    </td>
                    <td className={`text-center py-3 px-3 ${person.fine > 0 ? "dark:text-white" : ""}`}>{person.count}/4</td>
                    <td className={`text-center py-3 px-3 ${person.fine > 0 ? "dark:text-white" : ""}`}>
                      {person.shortage > 0 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-red-500 text-white rounded-full text-xs font-bold">
                          {person.shortage}
                        </span>
                      ) : (
                        <span className="text-green-600 dark:text-green-400">-</span>
                      )}
                    </td>
                    <td className={`text-right py-3 px-3 font-semibold ${person.fine > 0 ? "dark:text-white" : ""}`}>
                      {person.fine > 0 ? (
                        <span className="text-red-600 dark:text-red-400">{person.fine.toLocaleString()}원</span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
