"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import api from "@/lib/api";

type Props = {
  product: { id: string; title: string; price?: string; image?: string };
  onAdd?: () => void | Promise<void>;
};

export function AddToCartButton({ product, onAdd }: Props) {
  const [pending, start] = useTransition();

  return (
    <Button
      className="w-full h-10 rounded-lg"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await api.user.addToCart({ productId: product.id, quantity: 1 });
          await onAdd?.();
        })
      }
    >
      <ShoppingCart className="mr-2 h-4 w-4" />
      {pending ? "Adding…" : "Add to Cart"}
    </Button>
  );
}
