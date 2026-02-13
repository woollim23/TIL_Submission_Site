import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export function TILSubmitForm() {
  const [participantId, setParticipantId] = useState<string>("");
  const [link, setLink] = useState("");
  const [submissionDate, setSubmissionDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const participants = trpc.participants.list.useQuery();
  const createSubmission = trpc.tilSubmissions.create.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!participantId || !link || !submissionDate) {
      toast.error("모든 필드를 입력해주세요");
      return;
    }

    // 유효한 날짜인지 확인
    const submissionDateObj = new Date(submissionDate);
    const [year, month, day] = submissionDate.split("-").map(Number);
    
    // 입력된 날짜가 실제로 유효한 날짜인지 확인
    if (
      submissionDateObj.getFullYear() !== year ||
      submissionDateObj.getMonth() + 1 !== month ||
      submissionDateObj.getDate() !== day
    ) {
      toast.error("유효하지 않은 날짜입니다. 해당 월의 마지막 날짜를 확인해주세요.");
      return;
    }

    try {
      await createSubmission.mutateAsync({
        participantId: parseInt(participantId),
        link,
        submissionDate: submissionDateObj,
      });

      toast.success("TIL이 성공적으로 제출되었습니다");
      setParticipantId("");
      setLink("");
      setSubmissionDate(new Date().toISOString().split("T")[0]);
    } catch (error) {
      toast.error("TIL 제출에 실패했습니다");
    }
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl">TIL 제출</CardTitle>
        <CardDescription>오늘 배운 내용을 공유해주세요</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="participant" className="text-base font-semibold">
              참여자
            </Label>
            <Select value={participantId} onValueChange={setParticipantId}>
              <SelectTrigger id="participant" className="h-10">
                <SelectValue placeholder="참여자를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {participants.data?.map((p) => (
                  <SelectItem key={p.id} value={p.id.toString()}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="link" className="text-base font-semibold">
              TIL 링크
            </Label>
            <Input
              id="link"
              type="url"
              placeholder="https://example.com/til"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date" className="text-base font-semibold">
              제출 날짜
            </Label>
            <Input
              id="date"
              type="date"
              value={submissionDate}
              onChange={(e) => setSubmissionDate(e.target.value)}
              className="h-10"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-10 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
            disabled={createSubmission.isPending}
          >
            <Plus className="w-4 h-4 mr-2" />
            {createSubmission.isPending ? "제출 중..." : "제출"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
