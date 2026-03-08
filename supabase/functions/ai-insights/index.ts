import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { records } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!records || records.length === 0) {
      return new Response(JSON.stringify({ insights: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build a concise data summary for the AI
    const summary = records.map((r: any) => 
      `${r.title}|${r.platform}|${r.publishedAt}|播放${r.views}|赞${r.likes}|评${r.comments}|转${r.shares}`
    ).join("\n");

    const totalViews = records.reduce((s: number, r: any) => s + r.views, 0);
    const totalLikes = records.reduce((s: number, r: any) => s + r.likes, 0);
    const totalComments = records.reduce((s: number, r: any) => s + r.comments, 0);
    const totalShares = records.reduce((s: number, r: any) => s + r.shares, 0);
    const avgViews = Math.round(totalViews / records.length);
    const engagementRate = totalViews > 0 ? ((totalLikes + totalComments + totalShares) / totalViews * 100).toFixed(2) : '0';

    const systemPrompt = `你是一位专业的短视频数据分析师和增长顾问。请根据用户的发布数据，分析数据趋势并给出洞察。

要求：
1. 找出表现异常（特别好或特别差）的内容，说明原因
2. 发现数据趋势（播放量是上升还是下降？）
3. 给出 2-3 条具体可执行的增长建议
4. 如果有异常数据波动，发出预警

请用简洁友好的语气，每条洞察用一句话概括。`;

    const userPrompt = `以下是我的短视频发布数据（共${records.length}条）：

${summary}

汇总数据：
- 总播放量：${totalViews.toLocaleString()}
- 总点赞：${totalLikes.toLocaleString()}
- 总评论：${totalComments.toLocaleString()}
- 总转发：${totalShares.toLocaleString()}
- 平均播放：${avgViews.toLocaleString()}
- 综合互动率：${engagementRate}%

请分析并返回洞察。`;

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
              name: "return_insights",
              description: "返回数据洞察结果",
              parameters: {
                type: "object",
                properties: {
                  insights: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        type: { type: "string", enum: ["trend", "anomaly", "tip", "warning"] },
                        title: { type: "string", description: "洞察标题，5-10字" },
                        description: { type: "string", description: "详细说明，20-50字" },
                      },
                      required: ["type", "title", "description"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["insights"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_insights" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "请求频率过高，请稍后重试" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI 额度不足，请充值" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI 分析失败" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback: return the raw content
    const content = result.choices?.[0]?.message?.content || "";
    return new Response(JSON.stringify({ insights: [], rawContent: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-insights error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
