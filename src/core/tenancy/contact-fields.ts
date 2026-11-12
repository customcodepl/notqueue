/** Whether the join form asks for a contact field, and whether it must be filled. */
export const CONTACT_FIELD_POLICIES = [
  "required",
  "optional",
  "hidden",
] as const;
export type ContactFieldPolicy = (typeof CONTACT_FIELD_POLICIES)[number];

export const CONTACT_FIELDS = ["name", "phone", "email"] as const;
export type ContactField = (typeof CONTACT_FIELDS)[number];

export type ContactFieldPolicies = Readonly<
  Record<ContactField, ContactFieldPolicy>
>;

/**
 * Platform defaults for a new venue, collecting as little as possible: staff
 * call out the name; phone is optional with no SMS in v1 (ROADMAP Q4); there
 * is no email channel in v1.
 */
export const DEFAULT_CONTACT_FIELD_POLICIES: ContactFieldPolicies = {
  name: "required",
  phone: "optional",
  email: "hidden",
};

export function isContactFieldPolicy(
  value: unknown,
): value is ContactFieldPolicy {
  return CONTACT_FIELD_POLICIES.includes(value as ContactFieldPolicy);
}
