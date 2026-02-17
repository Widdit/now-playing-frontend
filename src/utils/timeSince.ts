// 时间常量（毫秒）
const TIME_UNITS = {
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  MONTH: 30 * 24 * 60 * 60 * 1000,
  YEAR: 365 * 24 * 60 * 60 * 1000,
} as const;

/**
 * 将时间戳转换为间隔时间描述
 * @param targetTimestamp - 目标时间戳（毫秒）
 * @returns 间隔时间的语义化描述
 */
export function timeSince(targetTimestamp: number): string {
  const diff = Date.now() - targetTimestamp;

  // 未来时间或刚刚发生
  if (diff < TIME_UNITS.MINUTE) {
    return "刚刚";
  }

  // 1 小时之内
  if (diff < TIME_UNITS.HOUR) {
    const minutes = Math.floor(diff / TIME_UNITS.MINUTE);
    return `${minutes} 分钟前`;
  }

  // 24 小时之内
  if (diff < TIME_UNITS.DAY) {
    const hours = Math.floor(diff / TIME_UNITS.HOUR);
    return `${hours} 小时前`;
  }

  // 7 天之内
  if (diff < TIME_UNITS.WEEK) {
    const days = Math.floor(diff / TIME_UNITS.DAY);
    return `${days} 天前`;
  }

  // 30 天之内
  if (diff < TIME_UNITS.MONTH) {
    const weeks = Math.floor(diff / TIME_UNITS.WEEK);
    return `${weeks} 星期前`;
  }

  // 365 天之内
  if (diff < TIME_UNITS.YEAR) {
    const months = Math.floor(diff / TIME_UNITS.MONTH);
    return `${months} 个月前`;
  }

  // 365 天及以上
  const years = Math.floor(diff / TIME_UNITS.YEAR);
  return `${years} 年前`;
}
