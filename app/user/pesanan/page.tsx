import { OrdersView } from "../../../components/user/orders-view";

export default function PesananPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 pb-20">
      <section className="mt-8">
        <OrdersView embedded />
      </section>
    </main>
  );
}
