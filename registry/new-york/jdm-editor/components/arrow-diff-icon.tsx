import { ArrowDown, ArrowRight } from "lucide-react";
import React from "react";

export const ArrowDiffIcon: React.FC<{
  direction?: "right" | "down";
  size?: "small" | "medium";
}> = ({ direction = "right", size = "small" }) => {
  const fontSize = size === "small" ? 12 : 16;

  if (direction === "down")
    return <ArrowDown className="text-modified" style={{ fontSize }} />;

  return <ArrowRight className="text-modified" style={{ fontSize }} />;
};
