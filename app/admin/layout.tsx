"use client";

import ReduxProvider from "./store/ReduxProvider";
import AdminLayout from "./components/AdminLayout";

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ReduxProvider>
      <AdminLayout>{children}</AdminLayout>
    </ReduxProvider>
  );
}
