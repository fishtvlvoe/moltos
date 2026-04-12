import type { DataPoint, CalmIndexResult } from "@moltos/calm-index";

// Gmail 郵件指標資料結構
export interface GmailMetrics {
  dailyCounts: DataPoint[];
  replyLatencies: DataPoint[];
  nightActivity: DataPoint[];
  unreadCounts: DataPoint[];
  coverageDays: number;
  lastUpdated: number;
}

// 平靜指數快照（含新鮮度與建立時間）
export interface CalmIndexSnapshot {
  result: CalmIndexResult;
  coverageDays: number;
  isStale: boolean;
  createdAt: number;
  /** 資料不足 14 天時為 true */
  dataInsufficient?: boolean;
}

// 聊天訊息（支援串流狀態）
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  isStreaming?: boolean;
}

// YouTube 影片摘要卡片
export interface VideoSummary {
  videoId: string;
  title: string;
  channelName: string;
  thumbnailUrl: string;
  publishedAt: string;
  url: string;
}

// Demo 模式靜態假資料總型別
export interface DemoData {
  user: { name: string; email: string; image?: string };
  gmailMetrics: GmailMetrics;
  calmIndex: CalmIndexSnapshot;
  videos: VideoSummary[];
  chatHistory: ChatMessage[];
}
