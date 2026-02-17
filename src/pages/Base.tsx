import { Image } from "@heroui/image";
import { Divider } from "@heroui/divider";
import { Accordion, AccordionItem } from "@heroui/accordion";

export default function BasePage() {
  return (
    <div className="flex justify-center">
      <div className="flex flex-col w-full max-w-[800px] py-6 px-10 gap-6">
        <h1 className="text-3xl text-white font-bold leading-9">页面模板</h1>

        {/* 打开方式 */}
        <div className="flex flex-col gap-4">
          <h1 className="text-xl text-default-800 font-bold leading-9">
            打开方式
          </h1>
          <p>在软件托盘图标的右键菜单中启用并管理桌面组件</p>
          <Image
            alt="桌面组件帮助"
            src="/assets/desktop-widget-help.png"
            width={260}
          />
        </div>

        <Divider />

        {/* 使用帮助 */}
        <div className="flex flex-col gap-4">
          <h1 className="text-xl text-default-800 font-bold leading-9">
            使用帮助
          </h1>
          <Accordion variant="bordered">
            <AccordionItem
              classNames={{
                trigger: "cursor-pointer",
              }}
              title="如何在歌曲暂停时自动隐藏桌面组件？"
            >
              <p>
                在歌曲组件的设置页面中开启 <b>"暂停时隐藏"</b> 选项即可
              </p>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>
  );
}
