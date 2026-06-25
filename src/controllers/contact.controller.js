const { z } = require("zod");
const { prisma } = require("../lib/prisma");
const { asyncHandler, AppError } = require("../utils/http");

const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().email(),
  phone: z.string().trim().max(20).optional(),
  subject: z.string().trim().min(1).max(100),
  message: z.string().trim().min(10).max(2000),
});

const submitContact = asyncHandler(async (req, res) => {
  const parsed = contactSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, parsed.error.issues?.[0]?.message || "Invalid input");
  }

  const { name, email, phone, subject, message } = parsed.data;

  await prisma.auditLog.create({
    data: {
      action: "CONTACT_SUBMISSION",
      entityType: "Contact",
      entityId: email,
      metadataJson: { name, email, phone: phone || null, subject, message },
    },
  });

  res.json({ success: true, message: "Message received. We'll get back to you within 24 hours." });
});

module.exports = { submitContact };
