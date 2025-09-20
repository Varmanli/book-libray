"use client";

import { Suspense, ComponentType } from "react";
import LoadingBooks from "@/components/LoadingBooks";

interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loadingMessage?: string;
}

export default function LazyWrapper({
  children,
  fallback,
  loadingMessage = "در حال بارگذاری...",
}: LazyWrapperProps) {
  return (
    <Suspense fallback={fallback || <LoadingBooks message={loadingMessage} />}>
      {children}
    </Suspense>
  );
}

// Higher-order component for lazy loading
export function withLazyLoading<P extends object>(
  Component: ComponentType<P>,
  loadingMessage?: string
) {
  return function LazyLoadedComponent(props: P) {
    return (
      <LazyWrapper loadingMessage={loadingMessage}>
        <Component {...props} />
      </LazyWrapper>
    );
  };
}

