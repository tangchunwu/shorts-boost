import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { competitorVideos, myRecords } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `你是一个短视频竞品分析专家，精通抖音、快手、小红书、B站等国内短视频平台。

用户会给你竞品视频数据和自己的视频数据，你需要进行深入的对比分析。

请从以下维度分析：
1. 内容策略差异：竞品和用户在选题、标题风格上的差异
2. 数据表现对比：播放量、互动率等关键指标的对比
3. 优势与劣势：用户相对竞品的优势和需要改进的地方
4. 可借鉴的策略：从竞品数据中总结出可以借鉴的内容策略
5. 具体行动建议：给出3-5条立即可执行的优化建议`;

    const userPrompt = `## 我的视频数据（最近${myRecords.length}条）：
${myRecords.map((r: any) => `- 「${r.title}」${r.platform} | 播放:${r.views} 点赞:${r.likes} 评论:${r.comments} 分享:${r.shares}`).join('\n')}

## 竞品视频数据（${competitorVideos.length}条）：
${competitorVideos.map((c: any) => `- [${c.accountName}]「${c.title}」${c.platform} | 播放:${c.views} 点赞:${c.likes} 评论:${c.comments} 分享:${c.shares}`).join('\n')}

请进行全面的竞品对比分析。`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "competitor_analysis",
              description: "返回竞品分析报告",
              parameters: {
                type: "object",
                properties: {
                  summary: { type: "string", description: "整体对比总结，2-3句话" },
                  contentStrategy: { type: "string", description: "内容策略差异分析" },
                  strengths: { type: "array", items: { type: "string" }, description: "用户的优势，3条" },
                  weaknesses: { type: "array", items: { type: "string" }, description: "用户需改进的地方，3条" },
                  learnFrom: { type: "array", items: { type: "string" }, description: "可借鉴的竞品策略，3-4条" },
                  actionItems: { type: "array", items: { type: "string" }, description: "立即可执行的建议，3-5条" },
                  titlePatterns: { type: "array", items: { type: "string" }, description: "竞品标题中的高效模式，3条" },
                },
                required: ["summary", "contentStrategy", "strengths", "weaknesses", "learnFrom", "actionItems", "titlePatterns"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "competitor_analysis" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "请求过于频繁，请稍后再试" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI 额度已用完，请充值后再试" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI 服务暂时不可用" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "AI 未返回有效结果" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-competitors error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "未知错误" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
