import { ApiForm, inputCls } from "@/components/ui";
export default function Corporate() {
  return (
    <div className="mx-auto max-w-lg space-y-5 px-5 py-12"><h1 className="text-3xl text-burgundy">Corporate &amp; bulk orders</h1>
      <p className="text-stone-700">Gifting for staff, weddings or events? Tell us what you need and the shop will call you with a quote.</p>
      <ApiForm action="/api/corporate" submit="Send enquiry" reset>
        <input name="name" required placeholder="Your name" aria-label="Your name" className={inputCls} /><input name="company" required placeholder="Company / event" aria-label="Company or event" className={inputCls} />
        <input name="phone" required inputMode="numeric" placeholder="Mobile (10 digits)" aria-label="Mobile" className={inputCls} /><input name="email" type="email" placeholder="Email (optional)" aria-label="Email" className={inputCls} />
        <textarea name="details" required rows={4} placeholder="What, how many, and by when?" aria-label="Details" className={inputCls} /></ApiForm>
      <p className="text-xs text-stone-500">After sending, the shop will contact you. Nothing is charged online.</p></div>
  );
}
