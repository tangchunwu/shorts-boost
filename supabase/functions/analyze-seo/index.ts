import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { title, script, platform } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

const systemPrompt = `你是一个短视频SEO专家，精通抖音、快手、小红书、B站等国内短视频平台的算法和推荐机制。

用户会给你一个视频标题和/或脚本内容，以及目标平台。你需要：
1. 对用户输入的标题进行评分（0-100分），从吸引力、关键词密度、平台适配度、字数合理性四个维度打分
2. 提供优化后的标题方案、关键词推荐和SEO建议

评分标准：
- 吸引力(appeal)：标题是否能引起用户好奇心、点击欲望
- 关键词密度(keywords)：是否包含热门关键词、话题标签
- 平台适配度(platformFit)：是否符合目标平台的内容调性和用户习惯
- 字数合理性(length)：字数是否在平台推荐范围内（抖音15-25字、小红书18-30字）

请使用以下工具返回结构化结果。`;

    const userPrompt = `目标平台: ${platform}
视频标题: ${title || '(未提供)'}
视频脚本/描述: ${script || '(未提供)'}

请为这个短视频提供SEO优化建议。`;

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
              name: "seo_analysis",
              description: "返回短视频SEO分析结果，包含标题评分",
              parameters: {
                type: "object",
                properties: {
                  titleScore: {
                    type: "object",
                    description: "用户输入标题的评分（如果用户提供了标题）",
                    properties: {
                      overall: { type: "number", description: "总分0-100" },
                      dimensions: {
                        type: "object",
                        properties: {
                          appeal: { type: "number", description: "吸引力得分0-100" },
                          keywords: { type: "number", description: "关键词密度得分0-100" },
                          platformFit: { type: "number", description: "平台适配度得分0-100" },
                          length: { type: "number", description: "字数合理性得分0-100" },
                        },
                        required: ["appeal", "keywords", "platformFit", "length"],
                      },
                      feedback: { type: "string", description: "简短的改进建议，20字以内" },
                    },
                    required: ["overall", "dimensions", "feedback"],
                  },
                  titles: {
                    type: "array",
                    items: { type: "string" },
                    description: "5个优化后的标题方案，每个15-25字，要有吸引力",
                  },
                  keywords: {
                    type: "array",
                    items: { type: "string" },
                    description: "8-12个推荐关键词/话题标签",
                  },
                  tips: {
                    type: "array",
                    items: { type: "string" },
                    description: "5条针对性的SEO优化建议",
                  },
                  bestPostTime: {
                    type: "string",
                    description: "针对该平台的最佳发布时间建议",
                  },
                },
                required: ["titles", "keywords", "tips", "bestPostTime"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "seo_analysis" } },
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
    console.error("analyze-seo error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "未知错误" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
