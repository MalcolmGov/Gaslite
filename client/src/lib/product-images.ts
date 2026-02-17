import img9kg from "@assets/9kg_1771297736162.png";
import img19kg from "@assets/19kg_1771297736162.png";
import img48kg from "@assets/48kg_1771297736161.png";

const sizeImageMap: Record<string, string> = {
  "9kg": img9kg,
  "19kg": img19kg,
  "48kg": img48kg,
};

export function getProductImage(size: string): string | null {
  const normalized = size.toLowerCase().replace(/\s/g, "");
  for (const [key, url] of Object.entries(sizeImageMap)) {
    if (normalized.includes(key)) return url;
  }
  return null;
}

export { img9kg, img19kg, img48kg };
