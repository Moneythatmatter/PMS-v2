// Wash load batch classifications (Whites, Colors, Delicates)

export type WashBatchType = "Whites" | "Colors" | "Delicates";

export const getBatchGroup = (item: string): WashBatchType => {
  const name = item.toLowerCase();
  if (name.includes("white") || name.includes("bed sheet") || name.includes("pillow")) {
    return "Whites";
  }
  if (name.includes("silk") || name.includes("wool") || name.includes("suit")) {
    return "Delicates";
  }
  return "Colors";
};
