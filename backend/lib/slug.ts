import { prisma } from "./prisma";

function slugify(businessName: string): string {
  return businessName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function generateUniqueSlug(businessName: string): Promise<string> {
  const base = slugify(businessName) || "merchant";
  let slug = base;
  let suffix = 2;

  while (await prisma.merchant.findUnique({ where: { slug } })) {
    slug = `${base}-${suffix}`;
    suffix++;
  }

  return slug;
}
