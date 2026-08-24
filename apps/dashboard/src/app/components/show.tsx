"use client";

import React from "react";

export interface ShowProps<T> {
  when: T | null | undefined;
  fallback?: React.ReactNode;
  children: React.ReactNode | ((props: T) => React.ReactNode);
}

export function Show<T>(props: ShowProps<T>): React.ReactNode {
  const { when, fallback, children } = props;
  let result: React.ReactNode;

  if (!when) {
    result = fallback;
  } else {
    result = typeof children === "function" ? children(when) : children;
  }

  return result;
}
