import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy — Studio 242",
};

export default function RefundPolicyPage() {
  return (
    <main className="flex-1 bg-[var(--bg-1)]">
      <div className="mx-auto max-w-2xl px-6 py-14 sm:px-12">
        <h1 className="mb-8 text-center text-[30px] font-light tracking-wide">
          Refund Policy
        </h1>

        <div className="space-y-6 text-[15px] leading-relaxed text-[var(--text-muted)]">
          <p>
            We have a hassle-free 10-day return policy, which means you have
            10 days after receiving your item to request a return.
            Returns/Refunds/Exchanges are not available for international
            customers.
          </p>

          <p>
            To be eligible for a return, your item must be in the same
            condition that you received it — unworn or unused, with tags (if
            any), and in its original packaging. You&apos;ll also need the
            receipt or proof of purchase. We are not responsible if the item
            is not delivered due to an issue on your end, including but not
            limited to incorrect addresses or maximum delivery attempts by
            our delivery service.
          </p>

          <p>
            To start a return, contact us at{" "}
            <a href="mailto:care@studio242.co" className="text-[var(--accent-1)] underline">
              care@studio242.co
            </a>
            . If your return is accepted, we&apos;ll send you a return
            shipping label, as well as instructions on how and where to send
            your package. Items sent back to us without first requesting a
            return will not be accepted.
          </p>

          <section>
            <h2 className="mb-2 text-lg font-normal text-[var(--text)]">
              Damages and issues
            </h2>
            <p>
              Please inspect your order upon reception and contact us
              immediately within 48 hours if the item is defective, damaged,
              or if you receive the wrong item, so that we can evaluate the
              issue and make it right. If contacted after 48 hours, the item
              may not be accepted for returns.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-normal text-[var(--text)]">
              Exceptions / non-returnable items
            </h2>
            <p>
              Certain types of items cannot be returned, like items on sale
              or if explicitly mentioned non-refundable in the specific
              product description. Please get in touch if you have
              questions or concerns about your specific item. Unfortunately,
              we cannot accept returns on gift cards.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-normal text-[var(--text)]">
              Exchanges
            </h2>
            <p>
              Our easy 48-hour exchange policy allows you to exchange your
              items for the right size, wherever applicable. Other items can
              be exchanged for a total value of your original purchase or
              more. Shipping charges for returning the exchanged item are to
              be covered by you.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-normal text-[var(--text)]">
              Refunds
            </h2>
            <p>
              We will notify you once we&apos;ve received and inspected your
              return, and let you know if the refund was approved. If
              approved, you&apos;ll be automatically refunded to your
              original payment method within 8-10 business days — please
              allow extra time for your bank or card issuer to post it. For
              Cash on Delivery orders, we&apos;ll contact you by phone or
              email to arrange your refund the fastest way possible.
            </p>
          </section>

          <p className="pt-2 text-center">
            Questions? Reach us anytime at{" "}
            <a href="mailto:care@studio242.co" className="text-[var(--accent-1)] underline">
              care@studio242.co
            </a>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
