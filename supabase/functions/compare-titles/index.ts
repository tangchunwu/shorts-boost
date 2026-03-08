import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { myTitle, competitorTitles, platform } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `你是一个短视频标题优化专家，精通抖音、快手、小红书、B站等平台的算法推荐机制。
用户会给你他们自己的标题和竞品标题，请进行详细对比分析。
请使用工具返回结构化结果。`;

    const userPrompt = `目标平台: ${platform}

我的标题: ${myTitle}

竞品标题:
${competitorTitles.map((t: string, i: number) => `${i + 1}. ${t}`).join('\n')}

请对比分析这些标题，指出我的标题优劣势，并给出改进建议。`;

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
              name: "title_comparison",
              description: "返回标题对比分析结果",
              parameters: {
                type: "object",
                properties: {
                  myTitleScore: {
                    type: "number",
                    description: "我的标题综合评分(0-100)",
                  },
                  competitorScores: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        score: { type: "number", description: "评分(0-100)" },
                        highlight: { type: "string", description: "该标题最大亮点" },
                      },
                      required: ["title", "score", "highlight"],
                      additionalProperties: false,
                    },
                    description: "竞品标题评分详情",
                  },
                  strengths: {
                    type: "array",
                    items: { type: "string" },
                    description: "我的标题的优势(2-3条)",
                  },
                  weaknesses: {
                    type: "array",
                    items: { type: "string" },
                    description: "我的标题的不足(2-3条)",
                  },
                  improvedTitles: {
                    type: "array",
                    items: { type: "string" },
                    description: "3个融合竞品优势的改进标题",
                  },
                  summary: {
                    type: "string",
                    description: "一句话总结对比结论",
                  },
                },
                required: ["myTitleScore", "competitorScores", "strengths", "weaknesses", "improvedTitles", "summary"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "title_comparison" } },
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
    console.error("compare-titles error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "未知错误" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
