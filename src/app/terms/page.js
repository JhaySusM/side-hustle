import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Terms of Service | TradiGo",
};

export default function TermsPage() {
  return (
    <div>
      <Navbar />
      <div className="container py-5" style={{ maxWidth: 860 }}>
        <h1 className="mb-4">Terms of Service</h1>
        <p className="text-muted">Last updated: August 2, 2026</p>

        <p>
          By creating an account or using TradiGo, you agree to these terms. TradiGo is a
          classifieds marketplace connecting buyers and sellers &mdash; we are not a party to the
          transactions arranged between users.
        </p>

        <h2 className="h4 mt-4">Your account</h2>
        <p>
          You are responsible for the accuracy of your listings and messages, and for keeping your
          account credentials secure. You must be able to legally enter into transactions for
          whatever you list.
        </p>

        <h2 className="h4 mt-4">Listings and conduct</h2>
        <ul>
          <li>Listings must be truthful and for items you have the right to sell.</li>
          <li>Prohibited, illegal, or counterfeit items may not be listed.</li>
          <li>Harassment, fraud, or abuse of other users through messages is not allowed.</li>
          <li>We may remove listings, suspend accounts, or act on reports at our discretion.</li>
        </ul>

        <h2 className="h4 mt-4">Transactions and fees</h2>
        <p>
          Buyers and sellers negotiate and complete transactions directly. Where a platform fee
          applies, it is disclosed to both parties before the transaction is marked complete.
          TradiGo does not guarantee the condition, delivery, or legitimacy of any listed item.
        </p>

        <h2 className="h4 mt-4">Termination</h2>
        <p>
          We may suspend or terminate accounts that violate these terms or applicable law. You may
          stop using TradiGo and request account deletion at any time &mdash; see our{" "}
          <a href="/data-deletion">Data Deletion</a> page.
        </p>

        <h2 className="h4 mt-4">Contact</h2>
        <p>
          Questions about these terms can be sent to{" "}
          <a href="mailto:sw.ezio.0001@gmail.com">sw.ezio.0001@gmail.com</a>.
        </p>
      </div>
      <Footer />
    </div>
  );
}
