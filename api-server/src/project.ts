import { generateSlug } from "random-word-slugs";

export const generateUniqueProjectId = () => {
  return generateSlug();
};
