import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const saveChat = mutation({
  args: {
    userId: v.string(),
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    project_type: v.string(),
    requirements: v.string(),
    budget: v.optional(v.string()),
    messages: v.array(v.object({
      role: v.string(),
      content: v.string(),
      timestamp: v.number()
    })),
    status: v.string()
  },
  handler: async (ctx, args) => {
    const chatId = await ctx.db.insert("chats", args);
    return chatId;
  },
});

export const getChatByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const chat = await ctx.db
      .query("chats")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();
    return chat;
  },
}); 