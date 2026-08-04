import { Cosplay } from "@/types/cosplay";

export function emptyCosplayForm(): Partial<Cosplay> {
  return {
    character: "",
    series: "",
    outfit: "Default",
    title: "",
    status: "planned",
    description: "",
    characterArt: "",
    image: "",
    gallery: [],
    accent: "from-rose-500 to-red-700",
    tags: [],
    progress: [{ label: "Overall", percent: 0 }],
    sources: [],
  };
}
