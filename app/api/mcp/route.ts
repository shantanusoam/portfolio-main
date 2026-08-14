import { createMcpHandler, withMcpAuth } from "mcp-handler";
import {
  addLearningEntry,
  addLearningEntryShape,
  createBlogPost,
  createBlogPostShape,
} from "@/lib/mcp/tools";
import { getMcpResource } from "@/lib/oauth/config";
import { verifyAccessToken } from "@/lib/oauth/tokens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function result(value: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
  };
}

function toolError(error: unknown) {
  const message =
    error instanceof Error ? error.message : "Unknown portfolio error";
  return {
    isError: true,
    content: [{ type: "text" as const, text: message }],
  };
}

const handler = createMcpHandler(
  (server) => {
    server.registerTool(
      "create_blog_post",
      {
        title: "Create an on-brand portfolio post",
        description:
          "Publish a rough thought as a structured Signal Archive post. Before calling, preserve the owner's real insight and shape it in the archive's evidence-led first-person style: contract before effects, explicit system ownership, concrete tradeoffs, accessibility/recovery, and honest verification. Never invent measurements or project outcomes.",
        inputSchema: createBlogPostShape,
      },
      async (input, extra) => {
        if (!extra.authInfo?.token)
          return toolError(new Error("Authenticated token missing"));
        try {
          return result(await createBlogPost(input, extra.authInfo.token));
        } catch (error) {
          return toolError(error);
        }
      },
    );

    server.registerTool(
      "add_learning_entry",
      {
        title: "Add a portfolio learning checkpoint",
        description:
          "Add a concise field note to an existing learning track, or create a well-shaped track first when the topic is new. A strong checkpoint names the distinction learned, its operational consequence, and why it matters.",
        inputSchema: addLearningEntryShape,
      },
      async (input, extra) => {
        if (!extra.authInfo?.token)
          return toolError(new Error("Authenticated token missing"));
        try {
          return result(await addLearningEntry(input, extra.authInfo.token));
        } catch (error) {
          return toolError(error);
        }
      },
    );
  },
  {
    serverInfo: { name: "shantanu-portfolio-control-plane", version: "1.0.0" },
  },
  {
    basePath: "/api",
    disableSse: true,
    maxDuration: 60,
    verboseLogs: process.env.NODE_ENV !== "production",
  },
);

const authenticatedHandler = withMcpAuth(
  handler,
  (request, bearerToken) =>
    verifyAccessToken(bearerToken, {
      request,
      resource: getMcpResource(request),
      requiredScopes: ["portfolio:write"],
    }),
  {
    required: true,
    requiredScopes: ["portfolio:write"],
    resourceMetadataPath: "/.well-known/oauth-protected-resource",
  },
);

export { authenticatedHandler as GET, authenticatedHandler as POST };

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers":
        "Authorization, Content-Type, Accept, MCP-Protocol-Version, MCP-Session-Id",
      "Access-Control-Max-Age": "86400",
    },
  });
}
