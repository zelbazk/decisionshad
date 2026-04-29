"use client";

import React, { useContext, useMemo } from "react";

import { useWasmReady } from "./helpers/wasm";

export type DictionaryMap = Record<string, { label: string; value: string }[]>;

const DictionaryContext = React.createContext<DictionaryMap>({});

export const useDictionaries = (): DictionaryMap =>
  useContext(DictionaryContext);

export const DictionaryProvider: React.FC<
  React.PropsWithChildren<{ value: DictionaryMap }>
> = ({ value, children }) => (
  <DictionaryContext.Provider value={value}>
    {children}
  </DictionaryContext.Provider>
);

export type JdmConfigProviderProps = {
  dictionaries?: DictionaryMap;
  children?: React.ReactNode;
};

export const JdmConfigProvider: React.FC<JdmConfigProviderProps> = ({
  dictionaries,
  children,
}) => {
  useWasmReady();

  const dicts = useMemo(() => dictionaries ?? {}, [dictionaries]);

  return (
    <DictionaryContext.Provider value={dicts}>
      {children}
    </DictionaryContext.Provider>
  );
};
