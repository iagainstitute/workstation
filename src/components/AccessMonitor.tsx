"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export function AccessMonitor() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Don't run on access page itself
    if (pathname === "/access") return;

    const checkAccess = () => {
      // Get access expiry cookie
      const cookies = document.cookie.split(";");
      const expiryCookie = cookies.find((c) =>
        c.trim().startsWith("access_expiry=")
      );

      if (!expiryCookie) return;

      const expiryTime = parseInt(expiryCookie.split("=")[1]);
      const now = Date.now();

      // Check if access has expired
      if (now >= expiryTime) {
        // Clear cookies
        document.cookie =
          "access_verified=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        document.cookie =
          "access_expiry=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

        // Show alert and redirect
        alert("Your access code has expired. Please enter a new code.");
        router.push("/access");
      }
    };

    // Check immediately
    checkAccess();

    // Check every 10 seconds
    const interval = setInterval(checkAccess, 10000);

    return () => clearInterval(interval);
  }, [router, pathname]);

  return null;
}
