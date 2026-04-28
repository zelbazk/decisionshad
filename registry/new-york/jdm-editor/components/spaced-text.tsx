import React from "react";
import { Stack } from "../stack";

export type SpacedTextProps = {
  left: React.ReactNode;
  right?: React.ReactNode;
  gap?: number;
};

export const SpacedText: React.FC<SpacedTextProps> = ({
  left,
  right,
  gap = 16,
}) => {
  return (
    <Stack gap={gap} horizontal horizontalAlign="space-between">
      <span style={{ color: "inherit" }}>{left}</span>
      {right && <span style={{ color: "inherit" }}>{right}</span>}
    </Stack>
  );
};
