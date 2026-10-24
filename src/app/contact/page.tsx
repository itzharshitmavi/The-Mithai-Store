import { getShop } from "@/lib/orders";
import { fmt } from "@/lib/money";
export const dynamic = "force-dynamic";
export default async function Contact() {
  const s = await getShop(); const wa = s.whatsapp.replace(/\D/g, "");
  const P = ({ t }: { t: string }) => <p className="whitespace-pre-line text-stone-700">{t}</p>;
  return (
    <div className="mx-auto max-w-2xl space-y-8 px-5 py-12"><h1 className="text-3xl text-burgundy">Contact &amp; policies</h1>
      <section className="space-y-1"><h2 className="text-xl text-burgundy">Visit or call</h2><p>{s.address}</p><p>{s.hours}</p>{s.phone && <p><a href={`tel:${s.phone}`} className="underline">{s.phone}</a></p>}
        {wa && <p><a href={`https://wa.me/${wa}`} className="underline" target="_blank" rel="noopener noreferrer">Message us on WhatsApp</a></p>}
        {s.mapUrl && <p><a href={s.mapUrl} className="underline" target="_blank" rel="noopener noreferrer">Get directions</a></p>}</section>
      <section className="space-y-2"><h2 className="text-xl text-burgundy">Delivery</h2><p>Minimum order {fmt(s.minOrderPaise)}. Delivery charge {fmt(s.deliveryFeePaise)}, free above {fmt(s.freeDeliveryAbovePaise)}.{s.pincodes.length ? ` We deliver to PIN codes: ${s.pincodes.join(", ")}.` : ""}</p><P t={s.deliveryPolicy} /></section>
      <section className="space-y-2"><h2 className="text-xl text-burgundy">Cancellation &amp; refunds</h2><P t={s.cancellationPolicy || "Orders can be cancelled online until they start being prepared. Paid orders are refunded to the original payment method."} /></section>
    </div>
  );
}
