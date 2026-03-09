import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { platform, category } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `你是一个短视频热门话题分析专家，精通抖音、快手、小红书、B站等平台的热门趋势。

请根据用户指定的平台和分类，生成当前可能的热门话题和关键词。基于你对各平台内容生态的理解，提供：
1. 当前热门话题（包含热度指数估算）
2. 上升趋势的新兴话题
3. 与话题相关的推荐关键词

注意：你需要基于对平台内容趋势的深度理解来推断热门话题，而非实时数据。请标注这是基于趋势分析的推荐。`;

    const userPrompt = `平台：${platform}
分类：${category || '综合'}

请分析该平台当前可能的热门话题和趋势关键词。`;

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
              name: "trending_topics",
              description: "返回热门话题分析结果",
              parameters: {
                type: "object",
                properties: {
                  hotTopics: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string", description: "话题名称" },
                        heat: { type: "number", description: "热度指数 1-100" },
                        trend: { type: "string", enum: ["rising", "stable", "declining"], description: "趋势方向" },
                        description: { type: "string", description: "话题简介，15-30字" },
                        relatedKeywords: {
                          type: "array",
                          items: { type: "string" },
                          description: "3-5个相关关键词",
                        },
                      },
                      required: ["title", "heat", "trend", "description", "relatedKeywords"],
                      additionalProperties: false,
                    },
                    description: "8-12个热门话题",
                  },
                  trendInsight: {
                    type: "string",
                    description: "整体趋势洞察，50-80字",
                  },
                },
                required: ["hotTopics", "trendInsight"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "trending_topics" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "请求过于频繁，请稍后再试" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI 额度已用完" }), {
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
    console.error("trending-topics error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "未知错误" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
