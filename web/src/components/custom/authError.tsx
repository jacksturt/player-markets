// components/custom/authError.tsx
import { useEffect, useState } from "react";
import { useRouter } from "next-nprogress-bar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export function AuthErrorDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check URL hash for auth error when component mounts
    const checkForAuthError = () => {
      if (typeof window === "undefined") return;

      const hash = window.location.hash;
      const params = new URLSearchParams(hash.replace("#", ""));

      const error = params.get("error");
      const errorDescription = params.get("error_description");

      // Check specifically for the email error
      if (
        error === "server_error" &&
        errorDescription?.includes(
          "Error getting user email from external provider"
        )
      ) {
        setIsOpen(true);

        // Clean up the URL by removing the error parameters
        router.replace(window.location.pathname);
      }
    };

    checkForAuthError();
  }, [router]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Email Required</DialogTitle>
          <DialogDescription>
            Please add an email address to your Twitter/X account and try
            signing in again.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
