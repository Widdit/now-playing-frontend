export interface ApiItem {
  path: string;
  desc: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "WS";
  params?: { key: string; value: string }[];
  body?: string;
  info?: string;
  tag: string;
}

export const API_LIST: ApiItem[] = [
  {
    path: "/api/query",
    desc: "获取歌曲和播放器信息",
    method: "GET",
    tag: "歌曲",
  },
  {
    path: "/api/query/track",
    desc: "获取歌曲信息",
    method: "GET",
    tag: "歌曲",
  },
  {
    path: "/api/query/hasSong",
    desc: "获取当前是否有歌曲",
    method: "GET",
    tag: "歌曲",
  },
  {
    path: "/api/query/player",
    desc: "获取播放器信息",
    method: "GET",
    tag: "播放器",
  },
  {
    path: "/api/query/progress",
    desc: "获取播放器进度条毫秒值",
    method: "GET",
    tag: "播放器",
  },
  {
    path: "/api/lyric",
    desc: "获取歌词",
    method: "GET",
    tag: "歌词",
    info: "注意：该接口返回的是完整歌词，而歌词时间轴解析工作是在前端完成的",
  },
  {
    path: "/api/audio/devices",
    desc: "获取音频设备列表",
    method: "GET",
    tag: "设备",
  },
  {
    path: "/api/query/isConnected",
    desc: "获取是否成功连接平台",
    method: "GET",
    tag: "平台",
  },
  {
    path: "/api/version",
    desc: "获取最新版本信息",
    method: "GET",
    tag: "软件",
  },
  {
    path: "/api/system/appInfo",
    desc: "获取软件信息",
    method: "GET",
    tag: "软件",
  },
  {
    path: "/api/system/log/mainContent",
    desc: "获取日志主要内容",
    method: "GET",
    tag: "软件",
  },
  {
    path: "/api/system/networkInterfaces",
    desc: "获取网络接口列表",
    method: "GET",
    tag: "网络",
    info: "已按照 \"真实局域网 IP\" 的可能性从高到低排序",
  },
  {
    path: "/api/system/lanDevices",
    desc: "扫描给定局域网 IP 所在网段内的可达 IP 地址",
    method: "GET",
    tag: "网络",
    params: [
      { key: "localIp", value: "192.168.1.10" }
    ],
  },
  {
    path: "/api/cover/convert",
    desc: "获取歌曲封面的 Base64 编码",
    method: "POST",
    body: `{
  "cover_url": "https://p1.music.126.net/vcyUJw7mfEzzMCgbJry31w==/109951169507121139.jpg?param=500y500"
}`,
    tag: "封面",
    info: "注意：如果开启了 SMTC 识别，会优先返回 SMTC 提供的封面，而不是 cover_url 参数对应的封面",
  },
  {
    path: "/api/cover/videoUrl",
    desc: "获取歌曲封面的动态封面 URL",
    method: "POST",
    body: `{
  "songTitle": "After Hours",
  "songAuthor": "The Weeknd"
}`,
    tag: "封面",
  },
  {
    path: "/api/ws/lyric",
    desc: "实时获取歌词信息",
    method: "WS",
    tag: "歌词",
    info: "WebSocket 连接，用于实时推送数据。连接后将持续接收歌曲、歌词、播放状态等更新消息",
  },
];
