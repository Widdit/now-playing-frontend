import { GithubFilled, QqOutlined } from "@ant-design/icons";

import { BilibiliIcon } from "@/components/Icons";
import { siteConfig } from "@/constants/site";
import { useSocialInfo } from "@/hooks/useSocialInfo";
import { useEnv } from "@/contexts/EnvContext";
import { TitleBar } from "@/components/TitleBar";
import { useOpenExternalUrl } from "@/hooks/useOpenExternalUrl";

export default function NotFoundPage() {
  const { isDesktop } = useEnv();
  const { socialInfo } = useSocialInfo();
  const { openExternalUrl } = useOpenExternalUrl();

  return (
    <>
      {isDesktop && <TitleBar autoHide={false} />}

      <div className="outlet-wrapper h-full">
        <div className="h-full">
          <div className="h-screen pt-16 pb-10 px-8 mb-5 relative overflow-hidden w-full gap-2 border-dark-600/80 flex flex-col items-center justify-center">
            <div className="flex flex-col items-center justify-center gap-3 flex-[0.7] mb-20">
              <svg
                className="text-dark-600 w-20 h-20"
                fill="none"
                height="24"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                width="24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M6.51 7.97a6.502 6.502 0 0 1 11.734-.515c.237.446.355.668.42.756.1.136.067.1.191.215.08.073.305.228.755.537A5.5 5.5 0 0 1 16.5 19M6.51 7.97l-.045.11m.046-.11a6.432 6.432 0 0 0-.046.11m0 0A6.518 6.518 0 0 0 6.174 12m.291-3.92c-.322.803-.483 1.204-.561 1.325-.152.235-.038.1-.244.29-.106.097-.579.39-1.525.976A4.5 4.5 0 0 0 6.5 19m5.5-2.001v-6m0 9v-.001" />
              </svg>
              <h1 className="text-4xl font-bold text-offwhite mt-3 font-poppins">
                404
              </h1>
              <p className="text-gray-400 font-semibold max-w-[500px] text-center">
                此页面不存在
              </p>
              <a
                className="text-indigo-500 underline underline-offset-2 font-semibold text-lg mt-6"
                data-discover="true"
                href="/"
              >
                回到首页
              </a>
            </div>

            <div className="flex sm:flex-row flex-col items-center gap-6 flex-[0.3]">
              <p className="font-semibold">联系我们</p>
              <a
                className="flex items-center gap-2 font-semibold group transition-all cursor-pointer"
                onClick={() => {openExternalUrl(siteConfig.links.bilibili);}}
              >
                <BilibiliIcon size={22} />
                <span className="font-poppins group-hover:underline underline-offset-2">
                Bilibili
              </span>
              </a>
              <a
                className="flex items-center gap-2 font-semibold group transition-all cursor-pointer"
                onClick={() => {openExternalUrl(siteConfig.links.github);}}
              >
                <GithubFilled style={{ fontSize: "20px" }} />
                <span className="font-poppins group-hover:underline underline-offset-2">
                GitHub
              </span>
              </a>
              <a
                className="flex items-center gap-2 font-semibold group transition-all cursor-pointer"
                onClick={() => {openExternalUrl(socialInfo.qqGroupLink);}}
              >
                <QqOutlined style={{ fontSize: "20px" }} />
                <span className="font-poppins group-hover:underline underline-offset-2">
                QQ
              </span>
              </a>
            </div>

            <div className="blur-3xl w-[70%] rounded-full h-28 absolute -bottom-28 bg-gradient-to-r from-pink-500 via-indigo-500 to-cyan-500" />
          </div>
        </div>
      </div>
    </>
  );
}
