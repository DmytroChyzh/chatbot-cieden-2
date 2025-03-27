import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  chats: defineTable({
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
  })
}); 