"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useSimulator } from "@/components/simulator/SimulatorProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  deleteScenario,
  listScenarios,
  loadScenario,
  saveScenario,
  type ScenarioSummary,
} from "@/app/actions/scenarios";

const UNSAVED_CONFIRM =
  "未保存の変更は失われる可能性があります。続行しますか？";

export function ScenarioBar() {
  const { state, actions } = useSimulator();
  const [scenarios, setScenarios] = useState<ScenarioSummary[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [currentName, setCurrentName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refreshList = useCallback(async () => {
    const rows = await listScenarios();
    setScenarios(rows);
  }, []);

  useEffect(() => {
    void refreshList();
  }, [refreshList]);

  const confirmProceed = () => {
    if (currentId === null) return true;
    return window.confirm(UNSAVED_CONFIRM);
  };

  const handleLoad = async (id: string) => {
    if (id === currentId) return;
    if (!confirmProceed()) return;

    setBusy(true);
    try {
      const loaded = await loadScenario(id);
      actions.replaceState(loaded.state);
      setCurrentId(loaded.id);
      setCurrentName(loaded.name);
      toast.success(`「${loaded.name}」を読み込みました`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "読み込みに失敗しました",
      );
    } finally {
      setBusy(false);
    }
  };

  const handleSave = async (saveAs = false) => {
    let name = currentName;
    if (saveAs || !currentId) {
      const input = window.prompt("シナリオ名を入力してください", name ?? "");
      if (input === null) return;
      name = input.trim();
      if (!name) {
        toast.error("シナリオ名を入力してください");
        return;
      }
    }

    setBusy(true);
    try {
      const saved = await saveScenario(
        saveAs ? null : currentId,
        name!,
        state,
        { saveAs },
      );
      setCurrentId(saved.id);
      setCurrentName(saved.name);
      await refreshList();
      toast.success(
        saveAs ? `「${saved.name}」として保存しました` : "保存しました",
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "保存に失敗しました",
      );
    } finally {
      setBusy(false);
    }
  };

  const handleNew = () => {
    if (!confirmProceed()) return;
    actions.resetToDefaults();
    setCurrentId(null);
    setCurrentName(null);
    toast.message("新規シナリオを開始しました（未保存）");
  };

  const handleDelete = async () => {
    if (!currentId) {
      toast.error("削除する保存済みシナリオがありません");
      return;
    }
    if (
      !window.confirm(
        `「${currentName ?? "このシナリオ"}」を削除しますか？この操作は取り消せません。`,
      )
    ) {
      return;
    }

    setBusy(true);
    try {
      await deleteScenario(currentId);
      actions.resetToDefaults();
      setCurrentId(null);
      setCurrentName(null);
      await refreshList();
      toast.success("シナリオを削除しました");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "削除に失敗しました",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/20 px-3 py-2">
      <span className="text-xs font-medium text-muted-foreground">シナリオ</span>

      <Select
        value={currentId ?? ""}
        onValueChange={(value) => {
          if (!value) return;
          void handleLoad(value);
        }}
        disabled={busy}
      >
        <SelectTrigger className="w-[min(100%,280px)]" aria-label="シナリオを選択">
          <SelectValue
            placeholder={currentName ?? "（未保存・サンプル表示）"}
          />
        </SelectTrigger>
        <SelectContent>
          {scenarios.length === 0 ? (
            <SelectItem value="__empty__" disabled>
              保存済みシナリオなし
            </SelectItem>
          ) : null}
          {scenarios.map((scenario) => (
            <SelectItem key={scenario.id} value={scenario.id}>
              {scenario.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {currentId ? (
        <Badge variant="secondary">保存済み</Badge>
      ) : (
        <Badge variant="outline">未保存</Badge>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="default"
          disabled={busy}
          onClick={() => void handleSave(false)}
        >
          保存
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => void handleSave(true)}
        >
          別名で保存
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={handleNew}
        >
          新規
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busy || !currentId}
          onClick={() => void handleDelete()}
        >
          削除
        </Button>
      </div>
    </div>
  );
}
