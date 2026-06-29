"use client";

import {
  IconAlertTriangle,
  IconCircleCheck,
  IconCircleX,
  IconInfoCircle,
  IconLoader2,
} from "@tabler/icons-react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      className="toaster group"
      duration={3000}
      icons={{
        success: <IconCircleCheck className="size-4" stroke={2} />,
        info: <IconInfoCircle className="size-4" stroke={2} />,
        warning: <IconAlertTriangle className="size-4" stroke={2} />,
        error: <IconCircleX className="size-4" stroke={2} />,
        loading: <IconLoader2 className="size-4 animate-spin" stroke={2} />,
      }}
      position="bottom-center"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      theme={theme as ToasterProps["theme"]}
      toastOptions={{
        duration: 3000,
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
