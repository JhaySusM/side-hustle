import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Data Deletion | TradiGo",
};

export default function DataDeletionPage() {
  return (
    <div>
      <Navbar />
      <div className="container py-5" style={{ maxWidth: 860 }}>
        <h1 className="mb-4">Data Deletion Instructions</h1>
        <p className="text-muted">Last updated: August 2, 2026</p>

        <p>
          You can request deletion of your TradiGo account and associated personal data at any
          time, including data received from Google, Facebook, or WhatsApp sign-in.
        </p>

        <h2 className="h4 mt-4">How to request deletion</h2>
        <p>
          Send an email to{" "}
          <a href="mailto:sw.ezio.0001@gmail.com">sw.ezio.0001@gmail.com</a> from the address
          registered on your account, with the subject line &quot;Delete my account&quot;. Include
          the phone number or email used to sign up so we can locate your account.
        </p>

        <h2 className="h4 mt-4">What gets deleted</h2>
        <ul>
          <li>Your profile: name, email, phone number, address, and password.</li>
          <li>Your linked Google/Facebook sign-in identifiers.</li>
          <li>Your listings, messages, favorites, and ratings.</li>
        </ul>
        <p>
          Transaction records tied to completed sales may be retained as required for dispute
          resolution and accounting purposes, with personal identifiers removed where possible.
        </p>

        <h2 className="h4 mt-4">Turnaround time</h2>
        <p>We process deletion requests within 30 days of receiving them.</p>
      </div>
      <Footer />
    </div>
  );
}
