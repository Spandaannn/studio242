import CartPageContent from "@/components/cart/CartPageContent";

export default function CartPage() {
  return (
    <div className="flex-1 bg-[var(--bg-1)]">
      <div className="mx-auto max-w-5xl border-b border-[var(--border)] px-6 pb-6 pt-10 sm:px-12">
        <h1 className="text-[30px] font-light tracking-wide">Your Cart</h1>
      </div>
      <div className="mx-auto max-w-5xl px-6 py-10 sm:px-12">
        <CartPageContent />
      </div>
    </div>
  );
}
