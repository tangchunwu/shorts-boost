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

    const recordsSummary = records.map((r: any) =>
      `标题: "${r.title}" | 平台: ${r.platform} | 播放: ${r.views} | 点赞: ${r.likes} | 评论: ${r.comments} | 分享: ${r.shares} | 标签: ${r.tags?.join(', ') || '无'} | 表现: ${r.performance === 'high' ? '高' : r.performance === 'low' ? '低' : '普通'}`
    ).join('\n');

    const systemPrompt = `你是一个短视频数据分析专家，精通国内短视频平台的内容运营策略。
用户会给你一组短视频发布记录（包含标题、平台、播放量、互动数据等），请你深入分析这些数据，找出规律和改进方向。`;

    const userPrompt = `以下是我的短视频发布记录，请帮我做复盘分析：

${recordsSummary}

请分析这些记录，给出详细的复盘建议。`;

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
              name: "review_analysis",
              description: "返回短视频复盘分析结果",
              parameters: {
                type: "object",
                properties: {
                  summary: {
                    type: "string",
                    description: "整体数据表现总结，100字以内",
                  },
                  topPatterns: {
                    type: "array",
                    items: { type: "string" },
                    description: "3-5条表现好的内容规律（标题风格、关键词、时间等）",
                  },
                  weakPoints: {
                    type: "array",
                    items: { type: "string" },
                    description: "3-5条需要改进的问题",
                  },
                  actionItems: {
                    type: "array",
                    items: { type: "string" },
                    description: "3-5条具体可执行的改进建议",
                  },
                  bestTitle: {
                    type: "string",
                    description: "表现最好的标题是哪个，为什么好",
                  },
                },
                required: ["summary", "topPatterns", "weakPoints", "actionItems", "bestTitle"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "review_analysis" } },
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
    console.error("review-records error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "未知错误" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
