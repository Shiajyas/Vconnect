import React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({ children, ...props }) {
  return (
    <NextThemesProvider
      attribute="class" // Syncs theme with `className` on <html>
      defaultTheme="dark" // Matches server-side rendering
      enableSystem={true} // Allows system theme detection
      disableTransitionOnChange={true} // Prevent flicker during theme changes
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
