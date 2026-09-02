// @cashfreepayments/cashfree-js ships no type declarations (confirmed —
// its package.json has no "types" field and no .d.ts in dist/). Minimal
// ambient declaration covering only what components/checkout/CheckoutForm.tsx
// actually uses.
declare module "@cashfreepayments/cashfree-js" {
  export interface CashfreeCheckoutOptions {
    paymentSessionId: string;
    redirectTarget?: "_self" | "_blank" | "_top" | "_parent" | "_modal";
  }

  export interface CashfreeInstance {
    checkout(options: CashfreeCheckoutOptions): Promise<unknown>;
  }

  export function load(config: {
    mode: "sandbox" | "production";
  }): Promise<CashfreeInstance | null>;
}
