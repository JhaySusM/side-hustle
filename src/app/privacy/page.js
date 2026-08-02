import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Privacy Policy | TradiGo",
};

export default function PrivacyPage() {
  return (
    <div>
      <Navbar />
      <div className="container py-5" style={{ maxWidth: 860 }}>
        <h1 className="mb-4">Privacy Policy</h1>
        <p className="text-muted">Last updated: August 2, 2026</p>

        <p>
          TradiGo (&quot;we&quot;, &quot;us&quot;) operates a classifieds marketplace where
          buyers and sellers post listings, message each other, and complete transactions. This
          policy explains what information we collect, why, and how you can control it.
        </p>

        <h2 className="h4 mt-4">Information we collect</h2>
        <ul>
          <li>Account details: name, email address, phone number, and password (stored hashed).</li>
          <li>Delivery/contact address: house number, street, area, city, postal code, and country, if you provide one.</li>
          <li>If you sign in with Google, Facebook, or WhatsApp, we receive your name, email, and a provider account ID from that service.</li>
          <li>Content you create: listings, messages sent to other users, ratings, and reports.</li>
          <li>Transaction records between buyers and sellers, including agreed amounts and status.</li>
        </ul>

        <h2 className="h4 mt-4">How we use your information</h2>
        <ul>
          <li>To create and secure your account, including email/phone verification.</li>
          <li>To operate core marketplace features: listings, messaging, transactions, ratings, and notifications.</li>
          <li>To respond to reports and enforce our terms.</li>
        </ul>

        <h2 className="h4 mt-4">Sharing</h2>
        <p>
          We do not sell your personal information. Your name and listing details are visible to
          other users as part of normal marketplace use. We share data with service providers only
          as needed to operate the platform (e.g. our database host, email delivery, and image
          hosting providers).
        </p>

        <h2 className="h4 mt-4">Data retention and deletion</h2>
        <p>
          We retain account and transaction data for as long as your account is active. You can
          request deletion of your data at any time &mdash; see our{" "}
          <a href="/data-deletion">Data Deletion</a> page for instructions.
        </p>

        <h2 className="h4 mt-4">Contact</h2>
        <p>
          Questions about this policy can be sent to{" "}
          <a href="mailto:sw.ezio.0001@gmail.com">sw.ezio.0001@gmail.com</a>.
        </p>
      </div>
      <Footer />
    </div>
  );
}
