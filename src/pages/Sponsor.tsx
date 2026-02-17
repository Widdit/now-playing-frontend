import React, { Suspense, useEffect } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  getKeyValue,
} from "@heroui/table";
import { Spinner } from "@heroui/spinner";
import { useAsyncList } from "@react-stately/data";
import { Button } from "@heroui/button";
import { Spacer } from "@heroui/spacer";
import { WechatOutlined, QqOutlined } from "@ant-design/icons";
import { Chip } from "@heroui/chip";
import { ClockCircle } from "@mynaui/icons-react";
import { Tooltip } from "@heroui/tooltip";

import { useEnv } from "@/contexts/EnvContext";

const Lanyard = React.lazy(() => import("@/components/lanyard/Lanyard"));

type SponsorRecord = {
  key: string;
  date: string;
  sponsor: string;
  amount: string;
  message: string;
};

const columns = [
  { key: "date", label: "赞助时间", allowsSorting: true, width: 130 },
  { key: "sponsor", label: "赞助者", allowsSorting: true, width: 196 },
  { key: "amount", label: "赞助金额", allowsSorting: true, width: 130 },
  { key: "message", label: "留言", allowsSorting: false },
];

export default function SponsorPage() {
  const [isError, setIsError] = React.useState(false);
  const [paymentMethod, setPaymentMethod] = React.useState("wechat");
  const [updateTime, setUpdateTime] = React.useState("");
  const [maxTableHeight, setMaxTableHeight] = React.useState(485);
  const { isDesktop } = useEnv();

  const list = useAsyncList<SponsorRecord>({
    async load({ signal }) {
      try {
        const res = await fetch("/api/sponsorList", { signal });

        if (!res.ok) throw new Error("网络错误");
        const data = await res.json();

        setUpdateTime(data.updateTime);

        if (data.records && Array.isArray(data.records)) {
          return {
            items: data.records.map((item: any, index: number) => ({
              key: String(index + 1),
              date: item.date || "",
              sponsor: item.sponsor || "",
              amount: item.amount || "",
              message: item.message || "",
            })),
          };
        } else {
          return { items: [] };
        }
      } catch (err) {
        console.error("获取赞助列表失败:", err);
        setIsError(true);

        return { items: [] };
      }
    },

    async sort({ items, sortDescriptor }) {
      return {
        items: [...items].sort((a, b) => {
          const colKey = sortDescriptor.column as keyof SponsorRecord;
          const first = a[colKey] ?? "";
          const second = b[colKey] ?? "";

          let cmp = 0;

          if (colKey === "amount") {
            // 汇率表
            const rates: Record<string, number> = {
              "¥": 1,
              "$": 7.18,
              "€": 8.36,
              "£": 9.66,
            };

            const parseToCNY = (amountStr: string) => {
              const parts = amountStr.trim().split(" ");

              if (parts.length !== 2) return 0; // 无效格式直接当 0 处理
              const symbol = parts[0];
              const num = parseFloat(parts[1]) || 0;
              const rate = rates[symbol] ?? 1; // 如果没匹配到符号，按 1 处理

              return num * rate;
            };

            const val1 = parseToCNY(String(first));
            const val2 = parseToCNY(String(second));

            cmp = val1 < val2 ? -1 : val1 > val2 ? 1 : 0;
          } else {
            cmp =
              String(first) < String(second)
                ? -1
                : String(first) > String(second)
                  ? 1
                  : 0;
          }

          if (sortDescriptor.direction === "descending") {
            cmp *= -1;
          }

          return cmp;
        }),
      };
    },
  });

  useEffect(() => {
    const calculateTableHeight = () => {
      const windowH = window.innerHeight;

      let newTableHeight = Math.floor(windowH - 370);
      if (!isDesktop) {
        newTableHeight += 50;
      }

      setMaxTableHeight(newTableHeight);
    };

    // 组件挂载时立即计算一次，确保当前高度正确
    calculateTableHeight();

    // 监听窗口 resize 事件
    window.addEventListener("resize", calculateTableHeight);

    // 清理函数：组件卸载时移除监听器
    return () => {
      window.removeEventListener("resize", calculateTableHeight);
    };
  }, []);

  return (
    <div className="px-10 py-6 md:h-full md:overflow-hidden">
      <div className="flex flex-col md:flex-row gap-6 md:h-full mx-auto max-w-[1600px]">
        {/* 二维码 */}
        <div className="w-full md:w-1/2 flex flex-col md:h-full">
          <h1 className="text-3xl text-white font-bold leading-9">赞助</h1>
          <div className="relative -top-10 w-full h-full flex items-center justify-center">
            <Suspense fallback={null}>
              <Lanyard
                gravity={[0, -40, 0]}
                platform={paymentMethod}
                position={[0, 0, 20]}
              />
            </Suspense>
          </div>
        </div>

        {/* 赞助我们 & 赞助名单 */}
        <div className="w-full md:w-1/2 max-w-[720px] flex flex-col">
          <div className="flex flex-col gap-4">
            <h1 className="text-xl text-default-800 font-bold leading-9">
              赞助我们
            </h1>
            <p>
              如果您认为 <span className="font-poppins">Now Playing</span>{" "}
              对您有所帮助，欢迎赞助支持我们~
              您的支持将帮助我们更好地维护与完善项目，让本项目持续为直播社区创造价值。感谢您的支持与鼓励！
            </p>
            <Button
              color={paymentMethod === "wechat" ? "primary" : "success"}
              startContent={
                paymentMethod === "wechat" ? <QqOutlined /> : <WechatOutlined />
              }
              variant="flat"
              onPress={() =>
                setPaymentMethod(paymentMethod === "wechat" ? "qq" : "wechat")
              }
            >
              {paymentMethod === "wechat" ? "切换 QQ 支付" : "切换微信支付"}
            </Button>

            <Spacer x={2} />

            <div className="flex flex-row gap-4 items-center">
              <h1 className="text-xl text-default-800 font-bold leading-9">
                赞助名单
              </h1>
              <Tooltip closeDelay={200} content="数据统计截止时间" delay={50}>
                <Chip
                  size="sm"
                  startContent={<ClockCircle className="mx-0.5" size={16} />}
                  variant="flat"
                >
                  {updateTime}
                </Chip>
              </Tooltip>
            </div>
            <Table
              isHeaderSticky
              isVirtualized
              aria-label="赞助名单"
              maxTableHeight={maxTableHeight}
              selectionMode="single"
              sortDescriptor={list.sortDescriptor}
              onSortChange={list.sort}
            >
              <TableHeader columns={columns}>
                {(column) => (
                  <TableColumn
                    key={column.key}
                    allowsSorting={column.allowsSorting}
                    width={column.width}
                  >
                    {column.label}
                  </TableColumn>
                )}
              </TableHeader>

              {isError ? (
                <TableBody emptyContent={"表格数据加载失败"}>{[]}</TableBody>
              ) : (
                <TableBody
                  isLoading={list.isLoading}
                  items={list.items}
                  loadingContent={<Spinner label="加载中" />}
                >
                  {(item) => (
                    <TableRow key={item.key}>
                      {(columnKey) => (
                        <TableCell>{getKeyValue(item, columnKey)}</TableCell>
                      )}
                    </TableRow>
                  )}
                </TableBody>
              )}
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
