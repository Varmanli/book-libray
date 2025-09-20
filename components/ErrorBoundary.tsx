"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { BookOpen, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
          <div className="max-w-2xl mx-auto text-center space-y-8">
            {/* Error Icon */}
            <div className="relative">
              <div className="w-32 h-32 mx-auto mb-6 relative">
                <div className="absolute inset-0 bg-red-500/10 rounded-3xl animate-pulse"></div>
                <div className="absolute inset-2 bg-red-500/20 rounded-2xl animate-bounce"></div>
                <BookOpen className="absolute inset-0 w-full h-full text-red-500 p-6 animate-pulse" />
              </div>
            </div>

            {/* Error Content */}
            <div className="space-y-4">
              <h1 className="text-4xl font-bold text-red-500">خطا!</h1>
              <h2 className="text-2xl font-semibold text-foreground">
                مشکلی پیش آمده است
              </h2>
              <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
                متأسفانه خطایی در بارگذاری صفحه رخ داده است. لطفاً صفحه را
                مجدداً بارگذاری کنید یا به صفحه اصلی بازگردید.
              </p>

              {process.env.NODE_ENV === "development" && this.state.error && (
                <details className="mt-4 p-4 bg-muted rounded-lg text-left">
                  <summary className="cursor-pointer font-medium text-sm">
                    جزئیات خطا (فقط در حالت توسعه)
                  </summary>
                  <pre className="mt-2 text-xs text-red-600 whitespace-pre-wrap">
                    {this.state.error.message}
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
              <Button
                onClick={this.handleRetry}
                size="lg"
                className="w-full sm:w-auto bg-primary hover:bg-primary/90"
              >
                <RefreshCw className="w-5 h-5 ml-2" />
                تلاش مجدد
              </Button>

              <Link href="/books">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  <Home className="w-5 h-5 ml-2" />
                  بازگشت به کتابخانه
                </Button>
              </Link>
            </div>

            {/* Helpful Links */}
            <div className="pt-8 border-t border-border">
              <p className="text-sm text-muted-foreground mb-4">
                اگر مشکل ادامه دارد، لطفاً با پشتیبانی تماس بگیرید
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

