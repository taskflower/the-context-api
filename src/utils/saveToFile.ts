import fs from "fs/promises";
import path from "path";

export async function saveToFile(filename: string, content: string): Promise<string> {
  const reportsDir = path.join(process.cwd(), "data", "reports");
  await fs.mkdir(reportsDir, { recursive: true });
  const filePath = path.join(reportsDir, filename);
  await fs.writeFile(filePath, content, "utf-8");
  return filePath;
}
