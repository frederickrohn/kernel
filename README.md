# Google AI Overview Checker

A [Kernel](https://onkernel.com) application that uses [Stagehand V3](https://docs.stagehand.dev) to automate browser interactions and check whether Google search results include an AI Overview section.

## Overview

This project demonstrates how to combine Kernel's browser automation infrastructure with Stagehand's AI-powered browser actions to create a serverless function that:

1. Accepts a search query as input
2. Launches a remote browser session via Kernel
3. Performs a Google search using Stagehand's AI-powered `act()` and `extract()` methods
4. Detects whether an AI Overview is present in the search results
5. Returns the result as a boolean value

## Features

- **AI-Powered Browser Automation**: Uses Stagehand V3's natural language action execution
- **Serverless Browser Sessions**: Powered by Kernel's remote browser infrastructure
- **Type-Safe**: Written in TypeScript with Zod schema validation
- **Stealth Mode**: Runs browsers in stealth mode to avoid detection
- **Live Browser Preview**: Provides a live view URL for debugging

## Tech Stack

- **[Kernel SDK](https://onkernel.com)** (`@onkernel/sdk`): Serverless browser orchestration platform
- **[Stagehand V3](https://docs.stagehand.dev)** (`@browserbasehq/stagehand`): AI-powered browser automation framework
- **[Zod](https://zod.dev)**: TypeScript-first schema validation
- **TypeScript**: Type-safe development

## How It Works

### The Action Flow

```typescript
app.action<SearchQueryInput, SearchQueryOutput>(
  'google-ai-overview-check',
  async (ctx, payload) => {
    // 1. Create a Kernel browser session
    const kernelBrowser = await kernel.browsers.create({
      invocation_id: ctx.invocation_id,
      stealth: true,
    });

    // 2. Initialize Stagehand with the remote browser
    const stagehand = new Stagehand({
      env: "LOCAL",
      localBrowserLaunchOptions: {
        cdpUrl: kernelBrowser.cdp_ws_url,
      },
      model: "openai/gpt-4.1",
      apiKey: OPENAI_API_KEY,
    });

    // 3. Perform the search using AI-powered actions
    const page = stagehand.context.pages()[0];
    await page.goto("https://www.google.com");
    await stagehand.act(`Type "${query}" into the search bar`);
    await stagehand.act(`Press Enter`);

    // 4. Extract whether AI Overview is present
    const output = await stagehand.extract(
      "Check if there is an AI Overview section visible...",
      aiOverviewSchema
    );

    // 5. Clean up and return
    await stagehand.close();
    await kernel.browsers.deleteByID(kernelBrowser.session_id);
    return output;
  }
);
```

## Installation

```bash
cd sample-app
npm install
```

## Configuration

You'll need an OpenAI API key for Stagehand's AI-powered actions. Set it as an environment variable during deployment:

```bash
kernel deploy index.ts -e OPENAI_API_KEY=sk-...
```

See [Kernel's environment variables documentation](https://onkernel.com/docs/launch/deploy#environment-variables) for more details.

## Usage

### Deploy to Kernel

```bash
kernel deploy index.ts -e OPENAI_API_KEY=your_openai_api_key
```

### Invoke the Action

```bash
kernel invoke google-ai-overview-check --payload '{"query": "what is machine learning"}'
```

### Response

```json
{
  "hasAIOverview": true
}
```

## Stagehand V3 Features Used

This project demonstrates several Stagehand V3 capabilities:

- **`stagehand.act()`**: Natural language action execution
  ```typescript
  await stagehand.act(`Type "${query}" into the search bar`);
  ```

- **`stagehand.extract()`**: AI-powered data extraction with Zod schemas
  ```typescript
  const output = await stagehand.extract(
    "Check if there is an AI Overview section visible...",
    z.object({ hasAIOverview: z.boolean() })
  );
  ```

- **V3 Context API**: Access to browser pages through `stagehand.context.pages()`
  ```typescript
  const page = stagehand.context.pages()[0];
  ```

## Development

### Local Testing

You can test the action locally by running it through Kernel's local development server:

```bash
kernel dev index.ts
```

### Debugging

The application logs the browser's live view URL during execution:

```typescript
console.log("Kernel browser live view url: ", kernelBrowser.browser_live_view_url);
```

Visit this URL to watch the browser automation in real-time.

## Project Structure

```
sample-app/
├── index.ts          # Main application code
├── package.json      # Dependencies
├── tsconfig.json     # TypeScript configuration
└── README.md         # This file
```

## Learn More

- [Kernel Documentation](https://onkernel.com/docs)
- [Stagehand V3 Documentation](https://docs.stagehand.dev)
- [Zod Documentation](https://zod.dev)

## License

MIT
