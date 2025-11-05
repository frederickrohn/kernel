import { Stagehand } from "@browserbasehq/stagehand";
import { Kernel, type KernelContext } from '@onkernel/sdk';
import { z } from 'zod';

const kernel = new Kernel();

const app = kernel.app('ts-stagehand-v3');

interface SearchQueryInput {
  query: string;
}

interface SearchQueryOutput {
  hasAIOverview: boolean;
}

// LLM API Keys are set in the environment during `kernel deploy <filename> -e OPENAI_API_KEY=XXX`
// See https://onkernel.com/docs/launch/deploy#environment-variables

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set');
}

app.action<SearchQueryInput, SearchQueryOutput>(
  'google-ai-overview-check',
  async (ctx: KernelContext, payload?: SearchQueryInput): Promise<SearchQueryOutput> => {
    // A function that checks if a Google search has an AI Overview

    // Args:
    //     ctx: Kernel context containing invocation information
    //     payload: A search query string

    // Returns:
    //     output: Whether the search results page has an AI Overview

    const query = payload?.query || 'kernel';

    const kernelBrowser = await kernel.browsers.create({
      invocation_id: ctx.invocation_id,
      stealth: true,
    });
    
    console.log("Kernel browser live view url: ", kernelBrowser.browser_live_view_url);

    // V3 Stagehand initialization - note the flattened config structure
    const stagehand = new Stagehand({
      env: "LOCAL",
      localBrowserLaunchOptions: {
        cdpUrl: kernelBrowser.cdp_ws_url,
      },
      model: "openai/gpt-4.1",  // V3: "model" instead of "modelName"
      apiKey: OPENAI_API_KEY,    // V3: flat config instead of nested
      verbose: 1,
      domSettleTimeout: 30_000   // V3: no "Ms" suffix
    });
    await stagehand.init();

    /////////////////////////////////////
    // Your Stagehand implementation here
    /////////////////////////////////////
    
    // V3: Access page through context.pages()[0]
    const page = stagehand.context.pages()[0]!;
    await page.goto("https://www.google.com");
    
    // Atomic action: type query
    await stagehand.act(`Type "${query}" into the search bar`);

    // Atomic action: press Enter
    await stagehand.act(`Press Enter`);
    
    // Wait for search results to load
    await page.waitForLoadState('networkidle');
    
    // Extract AI Overview presence
    const aiOverviewSchema = z.object({
      hasAIOverview: z.boolean(),
    });
    
    const output = await stagehand.extract(
      "Check if there is an AI Overview section visible on this Google search results page. Return true if present, false if not.",
      aiOverviewSchema
    );
    
    await stagehand.close();
    await kernel.browsers.deleteByID(kernelBrowser.session_id);

    return output;
  },
);
