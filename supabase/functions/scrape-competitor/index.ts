import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FIRECRAWL_BASE = "https://api.firecrawl.dev/v1";

function classifyPageType(url: string, content?: string): string {
  const lower = url.toLowerCase();
  if (/\/(pricing|plans|packages|subscribe)/.test(lower)) return "pricing";
  if (/\/blog(\/|$)/.test(lower)) return "blog";
  if (/\/(about|team|company|careers)/.test(lower)) return "about";
  if (/\/(product|features|solutions)/.test(lower)) return "product";
  if (/\/(review|testimonial|case-stud)/.test(lower)) return "review";
  if (/g2\.com|capterra\.com|trustpilot\.com/.test(lower)) return "review";
  // Check if it's the root/landing page
  try {
    const parsed = new URL(url);
    if (parsed.pathname === "/" || parsed.pathname === "") return "landing";
  } catch { /* ignore */ }
  return "other";
}

async function firecrawlScrape(
  apiKey: string,
  url: string
): Promise<{ markdown: string; metadata: Record<string, unknown> } | null> {
  let formattedUrl = url.trim();
  if (!formattedUrl.startsWith("http")) formattedUrl = `https://${formattedUrl}`;

  const res = await fetch(`${FIRECRAWL_BASE}/scrape`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: formattedUrl,
      formats: ["markdown"],
      onlyMainContent: true,
    }),
  });

  if (res.status === 429) {
    throw new Error("RATE_LIMITED: Firecrawl rate limit reached. Please try again later.");
  }
  if (res.status === 402) {
    throw new Error("CREDITS_EXHAUSTED: Firecrawl credits exhausted. Please top up your plan.");
  }

  const data = await res.json();
  if (!res.ok) {
    console.error("Firecrawl scrape error:", data);
    return null;
  }

  const markdown = data.data?.markdown || data.markdown || "";
  const metadata = data.data?.metadata || data.metadata || {};
  return { markdown, metadata };
}

async function firecrawlCrawl(
  apiKey: string,
  url: string,
  options: { limit: number; includePaths?: string[] }
): Promise<Array<{ url: string; markdown: string; metadata: Record<string, unknown> }>> {
  let formattedUrl = url.trim();
  if (!formattedUrl.startsWith("http")) formattedUrl = `https://${formattedUrl}`;

  const res = await fetch(`${FIRECRAWL_BASE}/crawl`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: formattedUrl,
      limit: options.limit,
      includePaths: options.includePaths,
      scrapeOptions: { formats: ["markdown"], onlyMainContent: true },
    }),
  });

  if (res.status === 429) {
    throw new Error("RATE_LIMITED: Firecrawl rate limit reached. Please try again later.");
  }
  if (res.status === 402) {
    throw new Error("CREDITS_EXHAUSTED: Firecrawl credits exhausted. Please top up your plan.");
  }

  const data = await res.json();
  if (!res.ok) {
    console.error("Firecrawl crawl error:", data);
    return [];
  }

  // Crawl returns immediately with status/id — we need to poll
  const crawlId = data.id;
  if (!crawlId) {
    // If data is already present (sync response)
    if (data.data && Array.isArray(data.data)) {
      return data.data.map((d: any) => ({
        url: d.metadata?.sourceURL || url,
        markdown: d.markdown || "",
        metadata: d.metadata || {},
      }));
    }
    return [];
  }

  // Poll for results (max ~50 seconds to stay within timeout)
  const deadline = Date.now() + 50_000;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 3000));
    const pollRes = await fetch(`${FIRECRAWL_BASE}/crawl/${crawlId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (pollRes.status === 429) {
      throw new Error("RATE_LIMITED: Firecrawl rate limit reached while polling.");
    }
    const pollData = await pollRes.json();

    if (pollData.status === "completed") {
      return (pollData.data || []).map((d: any) => ({
        url: d.metadata?.sourceURL || url,
        markdown: d.markdown || "",
        metadata: d.metadata || {},
      }));
    }
    if (pollData.status === "failed") {
      console.error("Crawl failed:", pollData);
      return [];
    }
  }

  // Timeout — return whatever we have
  console.warn("Crawl polling timed out for", crawlId);
  return [];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
  if (!FIRECRAWL_API_KEY) {
    return new Response(
      JSON.stringify({ success: false, error: "FIRECRAWL_API_KEY is not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  let jobId: string | null = null;

  try {
    const { competitor_id, job_type, user_id } = await req.json();

    if (!competitor_id || !job_type || !user_id) {
      return new Response(
        JSON.stringify({ success: false, error: "competitor_id, job_type, and user_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const validTypes = ["full_site", "landing_page", "blog", "pricing", "reviews"];
    if (!validTypes.includes(job_type)) {
      return new Response(
        JSON.stringify({ success: false, error: `Invalid job_type. Must be one of: ${validTypes.join(", ")}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create scrape job
    const { data: job, error: jobError } = await supabase
      .from("scrape_jobs")
      .insert({
        user_id,
        competitor_id,
        job_type,
        status: "running",
        started_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (jobError) throw new Error(`Failed to create scrape job: ${jobError.message}`);
    jobId = job.id;

    // Fetch competitor
    const { data: competitor, error: compError } = await supabase
      .from("competitors")
      .select("website_url, review_sources")
      .eq("id", competitor_id)
      .single();

    if (compError || !competitor) {
      throw new Error("Competitor not found");
    }

    const baseUrl = competitor.website_url;
    const reviewSources = competitor.review_sources as Record<string, string> | null;

    type ScrapedPage = {
      page_url: string;
      page_type: string;
      raw_content: string;
      extracted_data: Record<string, unknown>;
    };

    const pages: ScrapedPage[] = [];

    // Execute scraping based on job_type
    if (job_type === "landing_page") {
      const result = await firecrawlScrape(FIRECRAWL_API_KEY, baseUrl);
      if (result) {
        pages.push({
          page_url: baseUrl,
          page_type: classifyPageType(baseUrl, result.markdown),
          raw_content: result.markdown,
          extracted_data: result.metadata,
        });
      }
    } else if (job_type === "pricing") {
      const pricingPaths = ["", "/pricing", "/plans", "/packages", "/subscribe"];
      for (const path of pricingPaths) {
        try {
          const fullUrl = path ? `${baseUrl.replace(/\/$/, "")}${path}` : baseUrl;
          const result = await firecrawlScrape(FIRECRAWL_API_KEY, fullUrl);
          if (result && result.markdown.length > 100) {
            pages.push({
              page_url: fullUrl,
              page_type: classifyPageType(fullUrl, result.markdown),
              raw_content: result.markdown,
              extracted_data: result.metadata,
            });
          }
        } catch (e) {
          if (String(e).includes("RATE_LIMITED") || String(e).includes("CREDITS_EXHAUSTED")) throw e;
          console.warn(`Failed to scrape pricing path ${path}:`, e);
        }
      }
    } else if (job_type === "blog") {
      const results = await firecrawlCrawl(FIRECRAWL_API_KEY, baseUrl, {
        limit: 20,
        includePaths: ["/blog/*", "/posts/*", "/articles/*"],
      });
      for (const r of results) {
        pages.push({
          page_url: r.url,
          page_type: classifyPageType(r.url, r.markdown),
          raw_content: r.markdown,
          extracted_data: r.metadata,
        });
      }
    } else if (job_type === "full_site") {
      const results = await firecrawlCrawl(FIRECRAWL_API_KEY, baseUrl, { limit: 50 });
      for (const r of results) {
        pages.push({
          page_url: r.url,
          page_type: classifyPageType(r.url, r.markdown),
          raw_content: r.markdown,
          extracted_data: r.metadata,
        });
      }
    } else if (job_type === "reviews") {
      if (!reviewSources || Object.keys(reviewSources).length === 0) {
        throw new Error("No review sources configured for this competitor");
      }
      for (const [source, url] of Object.entries(reviewSources)) {
        try {
          const result = await firecrawlScrape(FIRECRAWL_API_KEY, url);
          if (result) {
            pages.push({
              page_url: url,
              page_type: "review",
              raw_content: result.markdown,
              extracted_data: { ...result.metadata, review_source: source },
            });
          }
        } catch (e) {
          if (String(e).includes("RATE_LIMITED") || String(e).includes("CREDITS_EXHAUSTED")) throw e;
          console.warn(`Failed to scrape review source ${source}:`, e);
        }
      }
    }

    // Store results
    if (pages.length > 0) {
      const rows = pages.map((p) => ({
        scrape_job_id: jobId,
        competitor_id,
        user_id,
        page_url: p.page_url,
        page_type: p.page_type,
        raw_content: p.raw_content,
        extracted_data: p.extracted_data,
      }));

      const { error: insertError } = await supabase.from("scrape_results").insert(rows);
      if (insertError) {
        console.error("Failed to insert scrape results:", insertError);
      }
    }

    // Mark completed
    await supabase
      .from("scrape_jobs")
      .update({
        status: "completed",
        pages_scraped: pages.length,
        completed_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    return new Response(
      JSON.stringify({ success: true, job_id: jobId, pages_scraped: pages.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Scrape error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    // Mark job as failed if we have a job ID
    if (jobId) {
      await supabase
        .from("scrape_jobs")
        .update({
          status: "failed",
          error_message: errorMessage,
          completed_at: new Date().toISOString(),
        })
        .eq("id", jobId);
    }

    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
