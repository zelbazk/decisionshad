import type { Preview } from "@storybook/nextjs-vite";
import React from "react";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import "../app/globals.css";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: "todo",
    },
  },
  decorators: [
    (Story) => (
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange>
        <TooltipProvider>
          <div className="p-6 min-h-screen bg-background text-foreground">
            <Story />
          </div>
        </TooltipProvider>
      </ThemeProvider>
    ),
  ],
};

export default preview;
