import img9kg from "@assets/9kg_1771297736162.png";
import img19kg from "@assets/ChatGPT_Image_Feb_17,_2026,_05_19_27_AM_1771298392950.png";
import img48kg from "@assets/ChatGPT_Image_Feb_17,_2026,_05_20_52_AM_1771298474337.png";

const sizeImageMap: Record<string, string> = {
  "9kg": img9kg,
  "19kg": img19kg,
  "48kg": img48kg,
};

export function getProductImage(size: string): string | null {
  const normalized = size.toLowerCase().replace(/\s/g, "");
  if (normalized.includes("48kg")) return sizeImageMap["48kg"];
  if (normalized.includes("19kg")) return sizeImageMap["19kg"];
  if (normalized.includes("9kg")) return sizeImageMap["9kg"];
  return null;
}

export { img9kg, img19kg, img48kg };
