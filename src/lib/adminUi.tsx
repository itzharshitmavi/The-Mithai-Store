import { currentUser } from "@/lib/auth";
export const card = "rounded-xl border border-gold/40 bg-white/70 p-4";
export const Page = ({ title, children }: { title: string; children: React.ReactNode }) => <div className="mx-auto max-w-5xl space-y-6 px-4 py-8"><h1 className="text-3xl text-burgundy">{title}</h1>{children}</div>;
export const Label = ({ t, children }: { t: string; children: React.ReactNode }) => <label className="block text-sm"><span className="mb-1 block text-stone-600">{t}</span>{children}</label>;
export async function ownerOnly() { const u = await currentUser(); return u?.role === "ADMIN"; }
export const NoAccess = () => <Page title="Owner access only"><p>Ask the shop owner to make this change.</p></Page>;
