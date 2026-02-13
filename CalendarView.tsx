import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, ExternalLink, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

interface CalendarViewProps {
  month?: Date;
}

interface SubmissionWithId {
  id: number;
  participantId: number;
  link: string;
  participantName: string;
  submissionDate: Date;
  participantEmoji?: string;
}

export function CalendarView({ month = new Date() }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(month);
  const [selectedParticipantId, setSelectedParticipantId] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionWithId | null>(null);

  // 월간 조회 범위: 1일 00:00 ~ 말일 23:59:59.999
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

  const startDate = startOfDay(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1));
  const endDate = endOfDay(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0));

  const submissions = trpc.tilSubmissions.getByDateRange.useQuery({
    startDate,
    endDate,
  });

  const participants = trpc.participants.list.useQuery();
  const deleteSubmissionMutation = trpc.tilSubmissions.delete.useMutation();

  // 날짜 키를 KST(Asia/Seoul)로 통일
  function ymdKST(d: Date) {
    return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
  }

  const submissionsByDate = useMemo(() => {
    if (!submissions.data) return {};

    const grouped: Record<string, SubmissionWithId[]> = {};

    submissions.data.forEach((sub) => {
      if (selectedParticipantId && sub.participantId !== selectedParticipantId) {
        return;
      }

      const date = new Date(sub.submissionDate);
      // KST 기준 날짜 키 (YYYY-MM-DD)
      const dateStr = ymdKST(date);
      if (!grouped[dateStr]) {
        grouped[dateStr] = [];
      }

      const participant = participants.data?.find((p) => p.id === sub.participantId);
      grouped[dateStr].push({
        id: sub.id,
        participantId: sub.participantId,
        link: sub.link,
        participantName: participant?.name || "Unknown",
        submissionDate: new Date(sub.submissionDate),
        participantEmoji: participant?.emoji,
      });
    });

    return grouped;
  }, [submissions.data, participants.data, selectedParticipantId]);

  const daysInMonth = endDate.getDate();
  const firstDayOfWeek = startDate.getDay();

  const emptyDays: (number | null)[] = Array.from({ length: firstDayOfWeek }, () => null);
  const filledDays: (number | null)[] = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const days: (number | null)[] = [...emptyDays, ...filledDays];

  const weeks = Array.from({ length: Math.ceil(days.length / 7) }, (_, i) =>
    days.slice(i * 7, (i + 1) * 7)
  );

  const monthName = currentMonth.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
  });

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleDeleteClick = (submission: SubmissionWithId) => {
    setSelectedSubmission(submission);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedSubmission) return;

    try {
      await deleteSubmissionMutation.mutateAsync({ id: selectedSubmission.id });
      await submissions.refetch();
      setDeleteDialogOpen(false);
      setSelectedSubmission(null);
      toast.success("TIL이 삭제되었습니다.");
    } catch (error) {
      toast.error("TIL 삭제에 실패했습니다.");
    }
  };

  return (
    <>
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <CardTitle className="text-2xl">{monthName}</CardTitle>
              <CardDescription>TIL 제출 현황</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevMonth}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextMonth}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={selectedParticipantId?.toString() || "all"}
              onValueChange={(value) =>
                setSelectedParticipantId(value === "all" ? null : parseInt(value))
              }
            >
              <SelectTrigger className="w-full sm:w-48 h-9">
                <SelectValue placeholder="모든 참여자" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 참여자</SelectItem>
                {participants.data?.map((p) => (
                  <SelectItem key={p.id} value={p.id.toString()}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedParticipantId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedParticipantId(null)}
                className="h-9 px-2"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-7 gap-2 mb-2">
              {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
                <div key={day} className="text-center font-semibold text-sm text-muted-foreground h-8">
                  {day}
                </div>
              ))}
            </div>

            <div className="space-y-2">
              {weeks.map((week, weekIdx) => (
                <div key={weekIdx} className="grid grid-cols-7 gap-2">
                  {week.map((day, dayIdx) => {
                    // 날짜 생성 시 UTC 기준으로 생성하여 타임존 이슈 방지
                    const dateStr = day
                      ? ymdKST(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day))
                      : null;

                    const daySubmissions = dateStr ? (submissionsByDate[dateStr] || []) : [];

                    return (
                      <div
                        key={`${weekIdx}-${dayIdx}`}
                        className={`min-h-24 p-2 rounded-lg border-2 transition-all ${
                          day
                            ? "bg-card border-border hover:border-accent/50 hover:shadow-md"
                            : "bg-muted/30 border-transparent"
                        }`}
                      >
                        {day && (
                          <div className="h-full flex flex-col">
                            <div className="text-sm font-semibold text-foreground mb-1">{day}</div>
                            <div className="flex-1 space-y-1 overflow-y-auto">
                              {daySubmissions.length > 0 && daySubmissions.map((sub, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center gap-1 text-xs bg-accent/10 text-accent hover:bg-accent/20 px-2 py-1 rounded transition-colors group"
                                >
                                  {sub.participantEmoji && (
                                    <span className="flex-shrink-0 text-sm">{sub.participantEmoji}</span>
                                  )}
                                  <a
                                    href={sub.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="truncate flex-1 hover:underline"
                                  >
                                    {sub.participantName}
                                  </a>
                                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                  <button
                                    onClick={() => handleDeleteClick(sub)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 hover:text-destructive"
                                    title="삭제"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>TIL 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedSubmission && (
                <>
                  <div className="mt-4 p-3 bg-muted rounded-lg space-y-2">
                    <div className="text-sm">
                      <span className="font-semibold">참여자:</span> {selectedSubmission.participantName}
                    </div>
                    <div className="text-sm">
                      <span className="font-semibold">날짜:</span> {selectedSubmission.submissionDate.toLocaleDateString("ko-KR")}
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
                  <div className="mt-4 text-sm text-destructive font-semibold">
                    이 TIL을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                  </div>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              삭제
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
