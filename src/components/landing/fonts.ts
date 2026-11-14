import localFont from "next/font/local";

// Latin subsets from the design export, self-hosted so builds need no network.
// License: ./fonts/OFL.txt

export const archivo = localFont({
  src: "./fonts/archivo-latin.woff2",
  weight: "100 900",
  style: "normal",
  display: "swap",
  variable: "--font-archivo",
  // Variable width axis: lets `font-stretch` (104%–118%) render the real wide cuts.
  declarations: [{ prop: "font-stretch", value: "62% 125%" }],
});

export const newsreader = localFont({
  src: "./fonts/newsreader-italic-latin.woff2",
  weight: "300 500",
  style: "italic",
  display: "swap",
  variable: "--font-newsreader",
});
