"use client";

import { useEffect } from "react";
import {
  captureIdTokenFromUrl,
  stripStaleIdTokenFromUrl,
} from "@/lib/admin-fetch";

export function SessionBootstrap() {
  useEffect(() => {
    captureIdTokenFromUrl();
    stripStaleIdTokenFromUrl();
  }, []);

  return null;
}
