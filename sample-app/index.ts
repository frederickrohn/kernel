import { Stagehand } from "@browserbasehq/stagehand";
import { Kernel, type KernelContext } from '@onkernel/sdk';
import { z } from 'zod';

const kernel = new Kernel();

const app = kernel.app('ts-stagehand-v3');

interface SearchQueryInput {
  query: string;
}

interface SearchQueryOutput {
  teamSize: string;
  // FOR GOOGLE: Change to { url: string; }
}

// LLM API Keys are set in the environment during `kernel deploy <filename> -e OPENAI_API_KEY=XXX`
// See https://onkernel.com/docs/launch/deploy#environment-variables

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set');
}

app.action<SearchQueryInput, SearchQueryOutput>(
  'headcount-task',
  // FOR GOOGLE: Change action name to 'google-search-task'
  async (ctx: KernelContext, payload?: SearchQueryInput): Promise<SearchQueryOutput> => {
    // A function that returns the team size of a Y Combinator startup
    // FOR GOOGLE: Change description to "returns the first search result URL from Google"

    // Args:
    //     ctx: Kernel context containing invocation information
    //     payload: A startup name to search for on Y Combinator
    //              FOR GOOGLE: Change to "A search query string"

    // Returns:
    //     output: The team size (number of employees) of the startup
    //             FOR GOOGLE: Change to "The URL of the first search result"

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
    // V3: act() is called on stagehand, not page
    const page = stagehand.context.pages()[0]!; // ! is used to tell TypeScript that the page is not null
    await page.goto("https://www.ycombinator.com/companies");
    await stagehand.act(`Type in "${query}" into the search box`);
    await stagehand.act("Click on the first search result");
    const teamSizeSchema = z.object({
      teamSize: z.string(),
    });
    const output = await stagehand.extract( // V3: extract() takes instruction as first param, schema as second
      "Extract the team size (number of employees) shown on this Y Combinator company page.",
      teamSizeSchema
    );


    // FOR GOOGLE: Change to await page.goto("https://www.google.com");
    // FOR GOOGLE: Change to `Type in ${query} into the Google search bar`
    // FOR GOOGLE: Change to "Press Enter"

    // Schema definition
    
    // FOR GOOGLE: Change schema to:
    // const urlSchema = z.object({
    //   url: z.string(),
    // });
    
    // FOR GOOGLE: Change to:
    // const output = await stagehand.extract(
    //   "Extract the URL of the first organic search result (not an ad)",
    //   urlSchema
    // );
    
    await stagehand.close();
    await kernel.browsers.deleteByID(kernelBrowser.session_id);

    return output;
  },
);
