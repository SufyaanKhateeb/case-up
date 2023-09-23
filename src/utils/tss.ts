import { createTss } from "tss-react";
import { createMakeStyles } from "tss-react";

function useContext() {
  const myTheme = {};
  return { myTheme };
}

export const { tss } = createTss({ useContext });

export const { makeStyles } = createMakeStyles({
  useTheme: useContext,
});
