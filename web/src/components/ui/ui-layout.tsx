"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import * as React from "react";
import { ReactNode, Suspense, useEffect, useRef, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { capsule } from "@/lib/capsule";
import { IconCopy } from "@tabler/icons-react";

import { AccountChecker } from "../account/account-ui";

import { WalletButton } from "../solana/solana-provider";
import { Button } from "./button";
import { PublicKey } from "@solana/web3.js";
export function ExplorerLink({
  path,
  label,
  className,
}: {
  path: string;
  label: string;
  className?: string;
}) {
  const getExplorerUrl = (path: string) =>
    `https://explorer.solana.com/${path}`;
  return (
    <a
      href={getExplorerUrl(path)}
      target="_blank"
      rel="noopener noreferrer"
      className={className ? className : `link font-mono`}
    >
      {label}
    </a>
  );
}
export function UiLayout({
  children,
  links,
}: {
  children: ReactNode;
  links: { label: string; path: string }[];
}) {
  const pathname = usePathname();

  return (
    <div className="h-full bg-red-500 flex flex-col">
      <div className="navbar  text-neutral-content">
        <div className="flex-1">
          <Link className="btn btn-ghost normal-case text-xl" href="/">
            {/* <img className="h-4 md:h-6" alt="Logo" src="/logo.png" /> */}
            TRADETALK
          </Link>
        </div>
        <div className="flex-none space-x-2">
          <CapsuleAccountInfo />
          <WalletButton />
        </div>
      </div>
      <div className="">
        <Suspense
          fallback={
            <div className="text-center my-32">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          }
        >
          {children}
        </Suspense>
        <Toaster position="bottom-right" />
      </div>
    </div>
  );
}

export function AppModal({
  children,
  title,
  hide,
  show,
  submit,
  submitDisabled,
  submitLabel,
}: {
  children: ReactNode;
  title: string;
  hide: () => void;
  show: boolean;
  submit?: () => void;
  submitDisabled?: boolean;
  submitLabel?: string;
}) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    if (!dialogRef.current) return;
    if (show) {
      dialogRef.current.showModal();
    } else {
      dialogRef.current.close();
    }
  }, [show, dialogRef]);

  return (
    <dialog className="modal" ref={dialogRef}>
      <div className="modal-box space-y-5">
        <h3 className="font-bold text-lg">{title}</h3>
        {children}
        <div className="modal-action">
          <div className="join space-x-2">
            {submit ? (
              <button
                className="btn btn-xs lg:btn-md btn-primary"
                onClick={submit}
                disabled={submitDisabled}
              >
                {submitLabel || "Save"}
              </button>
            ) : null}
            <button onClick={hide} className="btn">
              Close
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}

export function AppHero({
  children,
  title,
  subtitle,
}: {
  children?: ReactNode;
  title: ReactNode;
  subtitle: ReactNode;
}) {
  return (
    <div className="hero py-4">
      <div className="hero-content text-center">
        <div>{children}</div>
      </div>
    </div>
  );
}

export function ellipsify(str = "", len = 4) {
  if (str.length > 30) {
    return (
      str.substring(0, len) + ".." + str.substring(str.length - len, str.length)
    );
  }
  return str;
}

export function useTransactionToast() {
  return (signature: string) => {
    toast.success(
      <div className={"text-center"}>
        <div className="text-lg">Transaction sent</div>
        <ExplorerLink
          path={`tx/${signature}`}
          label={"View Transaction"}
          className="btn btn-xs btn-primary"
        />
      </div>,
      {
        duration: 5000,
      }
    );
  };
}

function CapsuleAccountInfo() {
  const [isActive, setIsActive] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    capsule.isSessionActive().then(setIsActive);
  }, [capsule]);

  if (!isActive) {
    return (
      <Button
        onClick={() => {
          console.log("redirecting to signin");
          router.push(
            `/auth/signin?callbackUrl=${encodeURIComponent(pathname)}`
          );
        }}
      >
        Sign in
      </Button>
    );
  }
  const pk = new PublicKey(capsule.getAddress()!);
  return (
    <div
      className="btn btn-primary flex flex-row gap-2 h-full"
      onClick={() => {
        navigator.clipboard.writeText(pk.toBase58());
      }}
    >
      <IconCopy />
      {pk.toBase58().slice(0, 4)}...{pk.toBase58().slice(-4)}
    </div>
  );
}
