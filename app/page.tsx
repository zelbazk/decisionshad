import * as React from "react";
import { OpenInV0Button } from "@/components/open-in-v0-button";
import { SimpleInput } from "@/registry/new-york/blocks/simple-input/simple-input";

export default function Home() {
  return (
    <div className="max-w-3xl mx-auto flex flex-col min-h-svh px-4 py-8 gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">decisionshad</h1>
        <p className="text-muted-foreground">
          A custom registry for distributing code using shadcn.
        </p>
      </header>
      <main className="flex flex-col flex-1 gap-8">
        <div className="flex flex-col gap-4 border rounded-lg p-4 min-h-[450px] relative">
          <div className="flex items-center justify-between">
            <h2 className="text-sm text-muted-foreground sm:pl-3">
              A simple labeled input component.
            </h2>
            <OpenInV0Button name="simple-input" className="w-fit" />
          </div>
          <div className="flex items-center justify-center min-h-[400px] relative">
            <SimpleInput />
          </div>
        </div>
      </main>
    </div>
  );
}
