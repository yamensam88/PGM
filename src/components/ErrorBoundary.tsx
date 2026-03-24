"use client";

import React from "react";

export class ErrorBoundary extends React.Component<{ fallback?: React.ReactNode, children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { fallback?: React.ReactNode, children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-2 text-xs bg-red-100 text-red-800 border border-red-200 rounded">
          <p className="font-bold">Erreur UI :</p>
          <code className="text-[10px] break-all">{this.state.error?.message}</code>
        </div>
      );
    }

    return this.props.children;
  }
}
