import path from "path";
import fs from "fs/promises";

export const getAllFiles = async (folderPath: string) => {
  console.log(`Reading dir: ${folderPath}`);
  let output: string[] = [];
  // Check if the folderPath is the folder which exists
  const folderStat = await fs.stat(folderPath);
  if (folderStat.isDirectory()) {
    const files = await fs.readdir(folderPath);
    files.forEach(async (file) => {
      const name = path.join(folderPath, file);
      const fileStat = await fs.stat(name);
      if (fileStat.isDirectory()) {
        output = output.concat(await getAllFiles(name));
      } else {
        output.push(name);
      }
    });
  } else {
    throw new Error("Invalid folder path");
  }
  return output;
};
