import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Trash2, Smile } from "lucide-react";

const EMOJI_OPTIONS = [
  "👤", "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂",
  "🙃", "😉", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "😚",
  "😙", "🥲", "😋", "😛", "😜", "🤪", "😌", "😔", "😑", "😐",
  "😏", "😒", "🙁", "😲", "😞", "😖", "😢", "😭", "😱", "😨",
  "😰", "😥", "😢", "😤", "😠", "😡", "🤬", "😈", "👿", "💀",
  "☠️", "💩", "🤡", "👹", "👺", "👻", "👽", "👾", "🤖", "😺",
  "😸", "😹", "😻", "😼", "😽", "🙀", "😿", "😾", "🙈", "🙉",
  "🙊", "💋", "💌", "💘", "💝", "💖", "💗", "💓", "💞", "💕",
  "💔", "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎",
];

export function ParticipantManager() {
  const [newName, setNewName] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState("👤");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const participants = trpc.participants.list.useQuery();
  const createParticipant = trpc.participants.create.useMutation();
  const deleteParticipant = trpc.participants.delete.useMutation();
  const updateEmoji = trpc.participants.updateEmoji.useMutation();

  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newName.trim()) {
      toast.error("참여자 이름을 입력해주세요");
      return;
    }

    try {
      await createParticipant.mutateAsync({ name: newName });
      toast.success("참여자가 추가되었습니다");
      setNewName("");
      setSelectedEmoji("👤");
      setShowEmojiPicker(false);
      participants.refetch();
    } catch (error) {
      toast.error("참여자 추가에 실패했습니다");
    }
  };

  const handleDeleteParticipant = async (id: number, name: string) => {
    if (!confirm(`${name}을(를) 삭제하시겠습니까?`)) return;

    try {
      await deleteParticipant.mutateAsync({ id });
      toast.success("참여자가 삭제되었습니다");
      participants.refetch();
    } catch (error) {
      toast.error("참여자 삭제에 실패했습니다");
    }
  };

  const handleUpdateEmoji = async (id: number, emoji: string) => {
    try {
      await updateEmoji.mutateAsync({ id, emoji });
      toast.success("이모티콘이 변경되었습니다");
      participants.refetch();
    } catch (error) {
      toast.error("이모티콘 변경에 실패했습니다");
    }
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl">참여자 관리</CardTitle>
        <CardDescription>TIL 제출에 참여할 사람들을 관리합니다</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <form onSubmit={handleAddParticipant} className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="새로운 참여자 이름"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="h-10"
              />
              <div className="relative">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="h-10 px-3"
                >
                  <Smile className="w-4 h-4" />
                  <span className="ml-2 text-lg">{selectedEmoji}</span>
                </Button>
                {showEmojiPicker && (
                  <div className="absolute top-full mt-2 left-0 bg-card border border-border rounded-lg shadow-lg p-2 z-50 grid grid-cols-10 gap-1 w-80">
                    {EMOJI_OPTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          setSelectedEmoji(emoji);
                          setShowEmojiPicker(false);
                        }}
                        className="text-2xl hover:bg-accent/20 rounded p-1 transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Button
                type="submit"
                className="bg-accent hover:bg-accent/90 text-accent-foreground h-10"
                disabled={createParticipant.isPending}
              >
                <Plus className="w-4 h-4 mr-2" />
                추가
              </Button>
            </div>
          </form>

          <div className="space-y-2">
            {participants.data?.map((participant) => (
              <div
                key={participant.id}
                className="flex items-center justify-between p-3 bg-card border border-border rounded-lg hover:border-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="relative group">
                    <button
                      type="button"
                      className="text-2xl hover:opacity-70 transition-opacity cursor-pointer"
                      onClick={() => {
                        const newEmoji = prompt("이모티콘을 선택하세요:", participant.emoji);
                        if (newEmoji && newEmoji.length > 0) {
                          handleUpdateEmoji(participant.id, newEmoji);
                        }
                      }}
                      title="클릭하여 이모티콘 변경"
                    >
                      {participant.emoji}
                    </button>
                    <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-foreground text-background text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      클릭하여 변경
                    </span>
                  </div>
                  <span className="font-medium text-foreground">{participant.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteParticipant(participant.id, participant.name)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}

            {participants.data?.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                아직 참여자가 없습니다. 위에서 참여자를 추가해주세요.
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
