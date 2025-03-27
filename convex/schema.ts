import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  chats: defineTable({
    userId: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    project_type: v.optional(v.string()),
    requirements: v.optional(v.string()),
    budget: v.optional(v.string()),
    messages: v.array(v.object({
      text: v.string(),
      isUser: v.boolean(),
      timestamp: v.number()
    })),
    status: v.string(),
    currentStep: v.string(),
    createdAt: v.number()
  })
}); 