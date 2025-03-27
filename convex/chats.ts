import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const saveChat = mutation({
  args: {
    userId: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    project_type: v.optional(v.string()),
    requirements: v.optional(v.string()),
    budget: v.optional(v.string()),
    message: v.object({
      text: v.string(),
      isUser: v.boolean()
    }),
    currentStep: v.string()
  },
  handler: async (ctx, args) => {
    const existingChat = await ctx.db
      .query("chats")
      .filter(q => q.eq(q.field("userId"), args.userId))
      .first();

    if (existingChat) {
      return await ctx.db.patch(existingChat._id, {
        name: args.name ?? existingChat.name,
        email: args.email ?? existingChat.email,
        phone: args.phone ?? existingChat.phone,
        project_type: args.project_type ?? existingChat.project_type,
        requirements: args.requirements ?? existingChat.requirements,
        budget: args.budget ?? existingChat.budget,
        messages: [...existingChat.messages, { ...args.message, timestamp: Date.now() }],
        currentStep: args.currentStep
      });
    }

    return await ctx.db.insert("chats", {
      userId: args.userId,
      name: args.name,
      email: args.email,
      phone: args.phone,
      project_type: args.project_type,
      requirements: args.requirements,
      budget: args.budget,
      messages: [{ ...args.message, timestamp: Date.now() }],
      status: "new",
      currentStep: args.currentStep,
      createdAt: Date.now()
    });
  }
});

export const getChatByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("chats")
      .filter(q => q.eq(q.field("userId"), args.userId))
      .first();
  }
}); 