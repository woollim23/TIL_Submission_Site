import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Loader2, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
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

export function LatestUpdates() {
  const latestSubmissions = trpc.tilSubmissions.getLatest.useQuery({ limit: 3 });
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const deleteSubmissionMutation = trpc.tilSubmissions.delete.useMutation();

  const formattedSubmissions = useMemo(() => {
    if (!latestSubmissions.data) return [];
    return latestSubmissions.data.map((submission) => ({
      ...submission,
      formattedDate: formatDistanceToNow(new Date(submission.submissionDate), {
        addSuffix: true,
        locale: ko,
      }),
    }));
  }, [latestSubmissions.data]);

  const handleImageError = (id: number) => {
    setImageErrors((prev) => new Set(prev).add(id));
  };

  const handleDeleteClick = (submission: any, e: React.MouseEvent) => {
    e.preventDefault();
    setSelectedSubmission(submission);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedSubmission) return;

    try {
      await deleteSubmissionMutation.mutateAsync({ id: selectedSubmission.id });
      await latestSubmissions.refetch();
      setDeleteDialogOpen(false);
      setSelectedSubmission(null);
      toast.success("TIL이 삭제되었습니다.");
    } catch (error) {
      toast.error("TIL 삭제에 실패했습니다.");
    }
  };

  if (latestSubmissions.isLoading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">최신 업데이트</CardTitle>
          <CardDescription>최근 제출된 TIL</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-accent" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl">최신 업데이트</CardTitle>
        <CardDescription>최근 제출된 TIL</CardDescription>
      </CardHeader>
      <CardContent>
        {formattedSubmissions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            아직 제출된 TIL이 없습니다.
          </div>
        ) : (
          <div className="space-y-4">
            {formattedSubmissions.map((submission) => (
              <a
                key={submission.id}
                href={submission.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 bg-gradient-to-r from-accent/5 to-accent/10 border border-accent/20 rounded-lg hover:border-accent/40 hover:shadow-md transition-all group"
              >
                <div className="flex items-start gap-4">
                  {/* 이모티콘과 정보 */}
                  <div className="flex-shrink-0">
                    <span className="text-3xl">{submission.participantEmoji}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="mb-2">
                      <p className="font-semibold text-foreground">
                        {submission.participantName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {submission.formattedDate}
                      </p>
                    </div>
                    <p className="text-sm text-foreground/80 mb-2 line-clamp-2 break-all">
                      {submission.link}
                    </p>


                  </div>

                  {/* 외부 링크 버튼과 삭제 버튼 */}
                  <div className="flex gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => e.preventDefault()}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDeleteClick(submission, e)}
                      className="hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </CardContent>

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
    </Card>
  );
}
