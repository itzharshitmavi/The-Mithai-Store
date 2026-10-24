import { getShop } from "@/lib/orders";
import { ApiForm, inputCls } from "@/components/ui";
import { Page, Label, card, ownerOnly, NoAccess } from "@/lib/adminUi";
export const dynamic = "force-dynamic";
export default async function Settings() {
  if (!(await ownerOnly())) return <NoAccess />;
  const s = await getShop();
  return (
    <Page title="Shop settings"><section className={card}><ApiForm action="/api/admin/settings" submit="Save settings"><input type="hidden" name="scope" value="shop" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Label t="Shop name"><input name="name" defaultValue={s.name} className={inputCls} /></Label><Label t="Phone"><input name="phone" defaultValue={s.phone} className={inputCls} /></Label>
        <Label t="WhatsApp number (with country code, e.g. 919876543210)"><input name="whatsapp" defaultValue={s.whatsapp} className={inputCls} /></Label>
        <Label t="Google Maps link"><input name="mapUrl" type="url" defaultValue={s.mapUrl} className={inputCls} /></Label>
        <Label t="Address"><textarea name="address" defaultValue={s.address} className={inputCls} /></Label><Label t="Opening hours"><textarea name="hours" defaultValue={s.hours} className={inputCls} placeholder="Mon-Sun 9:00 AM - 9:00 PM" /></Label>
        <Label t="Minimum order ₹"><input type="number" name="minOrderRupees" min={0} defaultValue={s.minOrderPaise / 100} className={inputCls} /></Label>
        <Label t="Delivery charge ₹"><input type="number" name="deliveryFeeRupees" min={0} defaultValue={s.deliveryFeePaise / 100} className={inputCls} /></Label>
        <Label t="Free delivery above ₹"><input type="number" name="freeDeliveryAboveRupees" min={0} defaultValue={s.freeDeliveryAbovePaise / 100} className={inputCls} /></Label>
        <Label t="Normal preparation time (hours)"><input type="number" name="leadHours" min={0} defaultValue={s.leadHours} className={inputCls} /></Label>
        <Label t="Hold unpaid online orders for (minutes)"><input type="number" name="reservationMinutes" min={5} max={120} defaultValue={s.reservationMinutes} className={inputCls} /></Label>
        <Label t="Delivery PIN codes (comma separated)"><textarea name="pincodes" defaultValue={s.pincodes.join(", ")} className={inputCls} /></Label>
        <Label t="Holiday closures (dates YYYY-MM-DD, comma separated)"><textarea name="holidays" defaultValue={s.holidays.join(", ")} className={inputCls} /></Label></div>
      <Label t="Delivery policy"><textarea name="deliveryPolicy" rows={3} defaultValue={s.deliveryPolicy} className={inputCls} /></Label>
      <Label t="Cancellation & refund policy"><textarea name="cancellationPolicy" rows={3} defaultValue={s.cancellationPolicy} className={inputCls} /></Label>
      <label className="text-sm"><input type="checkbox" name="paused" defaultChecked={s.paused} /> Pause online ordering</label></ApiForm></section></Page>
  );
}
