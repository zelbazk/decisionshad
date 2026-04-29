import type { Preview } from "@storybook/nextjs-vite";
import * as ZenEngineWasm from "@gorules/zen-engine-wasm";
import React from "react";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { JdmConfigProvider } from "@/registry/new-york/jdm-editor/theme";
import "../app/globals.css";

// Initialise WASM before any story renders
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — default export is the wasm init fn
await ZenEngineWasm.default();

(
  window as Window &
    typeof globalThis & { VariableType: unknown; Variable: unknown }
).VariableType = ZenEngineWasm.VariableType;
(
  window as Window &
    typeof globalThis & { VariableType: unknown; Variable: unknown }
).Variable = ZenEngineWasm.Variable;

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
          <JdmConfigProvider>
            <div className="p-6 min-h-screen bg-background text-foreground">
              <Story />
            </div>
          </JdmConfigProvider>
        </TooltipProvider>
      </ThemeProvider>
    ),
  ],
};

export default preview;
