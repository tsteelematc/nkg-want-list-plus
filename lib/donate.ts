// Tip-jar links shown in the popup footer.
// TODO: set your own handles below.
const PAYPAL_USERNAME = "tsteelemadison";
const VENMO_USERNAME = "tsteelemadison";

export const DONATE_OPTIONS: { label: string; url: string }[] = [
  { label: "PayPal", url: `https://paypal.me/${PAYPAL_USERNAME}` },
  { label: "Venmo", url: `https://venmo.com/${VENMO_USERNAME}` },
];
