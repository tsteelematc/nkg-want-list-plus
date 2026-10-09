// Tip-jar links shown in the popup footer.
// TODO: set your own handles below.
const VENMO_USERNAME = "YOUR-VENMO-USERNAME";
const PAYPAL_USERNAME = "YOUR-PAYPAL-ME-USERNAME";

export const DONATE_OPTIONS: { label: string; url: string }[] = [
  { label: "Venmo", url: `https://venmo.com/${VENMO_USERNAME}` },
  { label: "PayPal", url: `https://paypal.me/${PAYPAL_USERNAME}` },
];
