import Image from "next/image";
import { cn } from "@/lib/cn";
import { DishArt } from "./dish-art";

export function DishImage({
  name,
  imageUrl,
  category,
  className,
  sizes = "(max-width: 640px) 50vw, 320px",
  priority,
}: {
  name: string;
  imageUrl: string | null;
  category?: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  return (
    <div className={cn("relative overflow-hidden bg-cream-200", className)}>
      {imageUrl ? (
        <Image src={imageUrl} alt={name} fill sizes={sizes} className="object-cover" priority={priority} />
      ) : (
        <DishArt name={name} category={category} />
      )}
    </div>
  );
}
