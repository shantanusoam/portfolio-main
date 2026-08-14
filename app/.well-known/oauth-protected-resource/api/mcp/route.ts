import { oauthOptions } from "@/lib/oauth/http";
import { protectedResourceMetadata } from "@/lib/oauth/resource-metadata";

export const dynamic = "force-dynamic";
export const GET = protectedResourceMetadata;
export const OPTIONS = oauthOptions;
