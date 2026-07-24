import { AuthShowcase } from "@/components/auth/auth-showcase";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <AuthShowcase />
      {children}
    </div>
  );
}
