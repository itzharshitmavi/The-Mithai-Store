# Manual QA checklist (run after install, before going live)
Use Razorpay TEST keys and `SEED_SAMPLE=1` data.

1. **Last item**: set a variant's online stock to 1. Place two orders at the same moment (two browsers). Exactly one succeeds; the other sees "Only limited stock left".
2. **Offline sell-out**: in Stock, set the variant to Sold out. Product page and checkout refuse it.
3. **Slot capacity**: create a slot with max 1 order. Order it; the slot shows "Full" and cannot be chosen.
4. **Festival**: turn on Festival mode with a daily limit of 1 and one allowed product. A second order for the same day is refused, and other products are refused.
5. **Payment then closed browser**: pay in the Razorpay popup, close the tab before redirect. Order becomes PAID via the webhook.
6. **Duplicate webhook**: resend the same webhook event from the Razorpay dashboard. Stock is deducted once.
7. **Bad signature**: POST to /api/payments/webhook with a wrong signature. Response is 401.
8. **Expired reservation**: place an ONLINE order and do not pay. After the hold time, open the Stock or Slots page. The order is Cancelled and stock is back.
9. **Late payment**: pay after expiry. Order is Cancelled with refund pending; stock is not oversold.
10. **Failed email**: leave SMTP empty. Order is saved; Orders page shows "Email failed" with Retry.
11. **PIN code**: enter a PIN not in settings. Checkout refuses delivery.
12. **Cancellation**: cancel as customer while Placed/Confirmed (works), then while Preparing (refused). Paid order shows refund pending.
13. **Double click**: click "Place order" twice quickly. Only one order is created.
14. **Holiday and lead time**: add a holiday date and pick a too-soon slot. Both are refused with a clear message.
15. **Roles**: sign in as a customer and open /admin (redirected) and call /api/admin/inventory (403).
