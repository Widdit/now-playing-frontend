import { useState } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { addToast } from "@heroui/toast";

import {
  MAX_MCP_PORT,
  MIN_MCP_PORT,
  parseYesPlayMcpConfig,
} from "./yesPlayMcpConfig";

export type YesPlayMode = "legacy" | "mcp";

export type YesPlaySettingsUpdate = {
  yesPlayMode: YesPlayMode;
  yesPlayMcpPort: number;
  yesPlayMcpToken?: string;
};

type Props = {
  platform?: string;
  mode: YesPlayMode;
  port: number;
  tokenConfigured: boolean;
  onSave: (settings: YesPlaySettingsUpdate) => Promise<boolean>;
};

function YesPlayMusicForm({
  mode,
  port,
  tokenConfigured,
  onSave,
}: Omit<Props, "platform">) {
  const [draftMode, setDraftMode] = useState(mode);
  const [draftPort, setDraftPort] = useState(String(port));
  const [token, setToken] = useState<string>();
  const hasSavedToken = token === undefined && tokenConfigured;
  const hasToken = hasSavedToken || Boolean(token?.trim());
  const [saving, setSaving] = useState(false);
  const portNumber = Number(draftPort);
  const validPort =
    /^\d+$/.test(draftPort) &&
    portNumber >= MIN_MCP_PORT &&
    portNumber <= MAX_MCP_PORT;
  const isMcp = draftMode === "mcp";

  const importClipboard = async () => {
    let text: string;

    try {
      text = await navigator.clipboard.readText();
    } catch {
      addToast({
        title: "无法读取剪贴板",
        description: "请允许此页面读取剪贴板",
        color: "danger",
      });

      return;
    }

    try {
      const config = parseYesPlayMcpConfig(text);

      setDraftMode("mcp");
      setDraftPort(String(config.port));
      setToken(config.token);
      addToast({ title: "已导入配置，保存后生效" });
    } catch (error) {
      addToast({
        title: "导入失败",
        description:
          error instanceof SyntaxError
            ? "剪贴板内容不是有效的 JSON"
            : (error as Error).message,
        color: "danger",
      });
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const saved = await onSave({
        yesPlayMode: draftMode,
        yesPlayMcpPort: isMcp ? portNumber : port,
        ...(isMcp && token !== undefined && { yesPlayMcpToken: token.trim() }),
      });

      if (saved) {
        setToken(undefined);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <section
      aria-label="YesPlayMusic 设置"
      className="mt-4 flex flex-col gap-3 border-t border-divider pt-3 font-poppins"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span>读取方式</span>
        <Select
          disallowEmptySelection
          aria-label="YesPlayMusic 读取方式"
          className="w-36"
          isDisabled={saving}
          selectedKeys={[draftMode]}
          size="sm"
          onSelectionChange={(keys) =>
            setDraftMode(Array.from(keys)[0] as YesPlayMode)
          }
        >
          <SelectItem key="legacy">旧版本（0.x）</SelectItem>
          <SelectItem key="mcp">MCP（3.x+）</SelectItem>
        </Select>
      </div>
      {isMcp && (
        <>
          <p className="text-sm text-color-desc">
            在播放器「设置 → MCP」开启服务。
          </p>
          <div className="grid grid-cols-1 gap-2 min-[460px]:grid-cols-[8rem_minmax(0,1fr)]">
            <Input
              errorMessage={`端口应为 ${MIN_MCP_PORT}–${MAX_MCP_PORT} 的整数`}
              inputMode="numeric"
              isDisabled={saving}
              isInvalid={!validPort}
              label="MCP 端口"
              size="sm"
              value={draftPort}
              onValueChange={setDraftPort}
            />
            <Input
              autoComplete="new-password"
              endContent={
                hasToken ? (
                  <Button
                    isIconOnly
                    aria-label="清空输入框"
                    isDisabled={saving}
                    size="sm"
                    variant="light"
                    onPress={() => setToken("")}
                  >
                    ×
                  </Button>
                ) : undefined
              }
              isDisabled={saving}
              label={hasToken ? "已填写 Token" : "Token（可选）"}
              placeholder={hasSavedToken ? "••••••••" : undefined}
              size="sm"
              type="password"
              value={token ?? ""}
              onKeyDown={(event) => {
                if (
                  hasSavedToken &&
                  (event.key === "Backspace" || event.key === "Delete")
                ) {
                  event.preventDefault();
                  setToken("");
                }
              }}
              onValueChange={setToken}
            />
          </div>
        </>
      )}
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          isDisabled={saving}
          size="sm"
          variant="light"
          onPress={importClipboard}
        >
          从剪贴板导入
        </Button>
        <Button
          color="primary"
          isDisabled={isMcp && !validPort}
          isLoading={saving}
          size="sm"
          variant="flat"
          onPress={save}
        >
          保存
        </Button>
      </div>
    </section>
  );
}

export default function YesPlayMusicSettings({ platform, ...settings }: Props) {
  return platform === "yesplay" ? <YesPlayMusicForm {...settings} /> : null;
}
