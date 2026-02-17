import { useEffect, useState } from "react";

import { SocialInfo, siteConfig } from "@/constants/site";

export function useSocialInfo() {
  const [socialInfo, setSocialInfo] = useState<SocialInfo>(
    siteConfig.socialInfo,
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSocialInfo = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/socialInfo");

        if (!response.ok) {
          throw new Error(`HTTP 响应错误！状态码：${response.status}`);
        }

        const data: SocialInfo = await response.json();

        setSocialInfo(data);
      } catch (err: any) {
        console.error("获取社交信息失败，使用默认值：", err);
        setSocialInfo(siteConfig.socialInfo);
        setError(err.message || "未知错误");
      } finally {
        setLoading(false);
      }
    };

    fetchSocialInfo();
  }, []);

  return { socialInfo, loading, error };
}
