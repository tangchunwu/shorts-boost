import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { records, period } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!records || records.length === 0) {
      return new Response(JSON.stringify({ error: "没有数据可以生成报告" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const summary = records.map((r: any) =>
      `${r.title}|${r.platform}|${r.publishedAt}|播放${r.views}|赞${r.likes}|评${r.comments}|转${r.shares}`
    ).join("\n");

    const totalViews = records.reduce((s: number, r: any) => s + r.views, 0);
    const totalLikes = records.reduce((s: number, r: any) => s + r.likes, 0);
    const totalComments = records.reduce((s: number, r: any) => s + r.comments, 0);
    const totalShares = records.reduce((s: number, r: any) => s + r.shares, 0);
    const avgViews = Math.round(totalViews / records.length);
    const engagementRate = totalViews > 0 ? ((totalLikes + totalComments + totalShares) / totalViews * 100).toFixed(2) : '0';

    const periodLabel = period === 'week' ? '本周' : '本月';

    const systemPrompt = `你是一位专业的短视频数据分析师。请根据用户的${periodLabel}发布数据生成一份复盘报告。

报告要求：
1. 数据概览：总结关键指标
2. 表现最佳：找出播放量/互动率最高的 1-3 条内容，分析原因
3. 待改进：找出表现较差的内容，给出改进建议
4. 趋势分析：播放量、互动率的变化趋势
5. 下期建议：3-5 条具体可执行的下期发布建议

请用简洁专业的语气撰写。`;

    const userPrompt = `以下是我${periodLabel}的短视频发布数据（共${records.length}条）：

${summary}

汇总数据：
- 总播放量：${totalViews.toLocaleString()}
- 总点赞：${totalLikes.toLocaleString()}
- 总评论：${totalComments.toLocaleString()}
- 总转发：${totalShares.toLocaleString()}
- 平均播放：${avgViews.toLocaleString()}
- 综合互动率：${engagementRate}%

请生成${periodLabel}复盘报告。`;

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
              name: "generate_report",
              description: "生成周期复盘报告",
              parameters: {
                type: "object",
                properties: {
                  overview: { type: "string", description: "数据概览，50-100字" },
                  bestContent: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        reason: { type: "string", description: "表现好的原因" },
                      },
                      required: ["title", "reason"],
                      additionalProperties: false,
                    },
                    description: "表现最佳的1-3条内容",
                  },
                  improvements: {
                    type: "array",
                    items: { type: "string" },
                    description: "3条待改进的点",
                  },
                  trend: { type: "string", description: "趋势分析，30-60字" },
                  nextActions: {
                    type: "array",
                    items: { type: "string" },
                    description: "3-5条下期建议",
                  },
                  overallScore: { type: "number", description: "本期整体表现评分0-100" },
                },
                required: ["overview", "bestContent", "improvements", "trend", "nextActions", "overallScore"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_report" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "请求频率过高，请稍后重试" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI 额度不足" }), {
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
    console.error("periodic-report error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "未知错误" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
