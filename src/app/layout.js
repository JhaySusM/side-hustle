import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";
import ChatWidget from "@/components/ChatWidget";

export const metadata = {
  title: "MaalX",
  description: "The modern marketplace to post, talk, and deal. Buy and sell anything locally with confidence.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <ChatWidget />
      </body>
    </html>
  );
}
