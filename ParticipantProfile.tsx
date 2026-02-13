import { useParams, useLocation } from "wouter";
import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, Calendar, AlertCircle, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";


const MIN_SUBMISSIONS = 4;
const FINE_PER_SHORTAGE = 5000;

// FineStatus.tsx와 동일한 헬퍼 함수들
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

export default function ParticipantProfile() {
  const params = useParams();
  const [, navigate] = useLocation();
  const participantId = parseInt(params.id as string);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);

  const participant = trpc.participants.list.useQuery();
  const allSubmissions = trpc.tilSubmissions.getAllByParticipant.useQuery({
    participantId,
  });
  const deleteSubmissionMutation = trpc.tilSubmissions.delete.useMutation();

  const participantData = useMemo(() => {
    return participant.data?.find((p) => p.id === participantId);
  }, [participant.data, participantId]);

  // 주별 벌금 계산 (2025-12-29부터 지난주까지)
  const finesByWeek = useMemo(() => {
    if (!allSubmissions.data || allSubmissions.data.length === 0) return [];

    const cumulativeStart = startOfDay(new Date("2025-12-29"));
    const today = new Date();
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

    // 1) (weekStart)별 제출 수 집계
    //    key: YYYY-MM-DD(weekStart)
    const countsByWeek: Record<string, number> = {};

    for (const sub of allSubmissions.data) {
      const subDate = new Date(sub.submissionDate);
      // 2025-12-29 이전 또는 지난주 이후 제출은 무시
      if (subDate < cumulativeStart || subDate > lastWeekEnd) continue;

      const wkStart = startOfWeekMonday(subDate);
      const weekKey = wkStart.toISOString().slice(0, 10); // YYYY-MM-DD

      countsByWeek[weekKey] = (countsByWeek[weekKey] || 0) + 1;
    }

    // 2) 2025-12-29이 속한 주의 월요일부터 지난주까지, 주차를 순회하며 벌금 계산
    const firstWeekStart = startOfWeekMonday(cumulativeStart);
    const lastWeekStartForLoop = startOfWeekMonday(lastWeekEnd);
    const weeks: Array<{ startDate: Date; submissions: number; fine: number }> = [];

    let wk = new Date(firstWeekStart);
    while (wk <= lastWeekStartForLoop) {
      const weekKey = wk.toISOString().slice(0, 10);
      const count = countsByWeek[weekKey] || 0;
      const shortage = Math.max(0, MIN_SUBMISSIONS - count);
      const fine = shortage * FINE_PER_SHORTAGE;

      weeks.push({
        startDate: new Date(wk),
        submissions: count,
        fine,
      });

      wk.setDate(wk.getDate() + 7);
    }

    // 최신순으로 정렬
    return weeks.sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
  }, [allSubmissions.data]);

  // 누적 벌금 계산 (2026-01-01부터)
  const totalFine = useMemo(() => {
    return finesByWeek.reduce((sum, week) => sum + week.fine, 0);
  }, [finesByWeek]);

  const totalSubmissions = allSubmissions.data?.length || 0;

  const handleDeleteClick = (submission: any) => {
    setSelectedSubmission(submission);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedSubmission) return;

    try {
      await deleteSubmissionMutation.mutateAsync({ id: selectedSubmission.id });
      await allSubmissions.refetch();
      setDeleteDialogOpen(false);
      setSelectedSubmission(null);
      toast.success("TIL이 삭제되었습니다.");
    } catch (error) {
      toast.error("TIL 삭제에 실패했습니다.");
    }
  };

  if (!participantData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4 md:p-8">
        <div className="container max-w-4xl">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            돌아가기
          </Button>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">참여자를 찾을 수 없습니다.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4 md:p-8">
      <div className="container max-w-4xl">
        {/* 뒤로가기 버튼 */}
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          돌아가기
        </Button>

        {/* 참여자 정보 헤더 */}
        <Card className="border-0 shadow-lg mb-6">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-4">
              <div className="text-5xl">{participantData.emoji}</div>
              <div>
                <CardTitle className="text-3xl">{participantData.name}</CardTitle>
                <CardDescription>전체 TIL 제출 기록 및 벌금 현황</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-accent/10 rounded-lg border border-accent/20">
                <div className="text-sm text-muted-foreground mb-1">총 제출 개수</div>
                <div className="text-3xl font-bold text-accent">{totalSubmissions}</div>
              </div>
              <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                <div className="text-sm text-muted-foreground mb-1">누적 벌금 (2025-12-29 주차부터)</div>
                <div className="text-3xl font-bold text-destructive">
                  {totalFine.toLocaleString()}원
                </div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg border border-border">
                <div className="text-sm text-muted-foreground mb-1">주당 기준</div>
                <div className="text-3xl font-bold text-foreground">{MIN_SUBMISSIONS}회</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 주별 벌금 내역 */}
        <Card className="border-0 shadow-lg mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl">주별 벌금 내역 (2025-12-29 주차부터)</CardTitle>
            <CardDescription>각 주차별 제출 현황과 벌금 계산</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-border">
                    <th className="text-left py-3 px-4 font-semibold text-foreground">주차</th>
                    <th className="text-center py-3 px-4 font-semibold text-foreground">제출 개수</th>
                    <th className="text-center py-3 px-4 font-semibold text-foreground">미달</th>
                    <th className="text-right py-3 px-4 font-semibold text-foreground">벌금</th>
                  </tr>
                </thead>
                <tbody>
                  {finesByWeek.map((week, index) => {
                    const shortage = Math.max(0, MIN_SUBMISSIONS - week.submissions);
                    const endDate = new Date(week.startDate);
                    endDate.setDate(endDate.getDate() + 6);

                    return (
                      <tr
                        key={index}
                        className={`border-b border-border transition-colors ${
                          week.fine > 0 ? "bg-destructive/5 hover:bg-destructive/10" : "hover:bg-muted/50"
                        }`}
                      >
                        <td className="py-3 px-4 font-medium text-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            {week.startDate.toLocaleDateString("ko-KR")} ~{" "}
                            {endDate.toLocaleDateString("ko-KR")}
                          </div>
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className="text-accent font-semibold">{week.submissions}</span>
                          <span className="text-muted-foreground">/{MIN_SUBMISSIONS}</span>
                        </td>
                        <td className="text-center py-3 px-4">
                          {shortage > 0 ? (
                            <span className="inline-flex items-center gap-1 text-destructive font-semibold">
                              <AlertCircle className="w-4 h-4" />
                              {shortage}
                            </span>
                          ) : (
                            <span className="text-green-600 font-semibold">-</span>
                          )}
                        </td>
                        <td className="text-right py-3 px-4 font-semibold">
                          {week.fine > 0 ? (
                            <span className="text-destructive">{week.fine.toLocaleString()}원</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* 전체 TIL 제출 기록 */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl">전체 TIL 제출 기록</CardTitle>
            <CardDescription>모든 제출한 TIL 목록 (최신순)</CardDescription>
          </CardHeader>
          <CardContent>
            {allSubmissions.data && allSubmissions.data.length > 0 ? (
              <div className="space-y-3">
                {allSubmissions.data.map((submission) => (
                  <div
                    key={submission.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-accent/50 hover:bg-accent/5 transition-all group"
                  >
                    <a
                      href={submission.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 min-w-0 flex items-center gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-muted-foreground mb-1">
                          {new Date(submission.submissionDate).toLocaleDateString("ko-KR")}
                        </div>
                        <div className="text-foreground font-medium truncate group-hover:text-accent transition-colors">
                          {submission.link}
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-accent flex-shrink-0" />
                    </a>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(submission)}
                      className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">아직 제출한 TIL이 없습니다.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>TIL 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedSubmission && (
                <>
                  <div className="mt-4 p-3 bg-muted rounded-lg space-y-2">
                    <div className="text-sm">
                      <span className="font-semibold">참여자:</span> {participantData?.name}
                    </div>
                    <div className="text-sm">
                      <span className="font-semibold">날짜:</span> {new Date(selectedSubmission.submissionDate).toLocaleDateString("ko-KR")}
                    </div>
                    <div className="text-sm">
                      <span className="font-semibold">링크:</span>{" "}
                      <a
                        href={selectedSubmission.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:underline truncate"
                      >
                        {selectedSubmission.link}
                      </a>
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-muted-foreground">
                    정말 이 TIL을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                  </div>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              삭제
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
