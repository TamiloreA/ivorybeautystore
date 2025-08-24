// components/ProductCard.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Star, MapPin, Shield, ShoppingCart, Check, Loader2, LogIn } from "lucide-react";
import { useAuth } from "@/context/AuthContext"; // uses your existing context

type ProductLike = {
  _id: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  imageUrl?: string;
  collectionRef?: { name: string };
  rating?: number;
  reviews?: number;
  pickupPoints?: number;
  seller?: string;
  description?: string;
};

export default function ProductCard({
  product,
  onAddToCart,
  showDescription = false,
}: {
  product: ProductLike;
  onAddToCart?: (id: string, qty?: number) => void | Promise<void>;
  showDescription?: boolean;
}) {
  if (!product) return null;

  const sale = product.compareAtPrice && product.compareAtPrice > product.price;
  const priceNGN = `₦${(product.price ?? 0).toLocaleString("en-NG", { minimumFractionDigits: 0 })}`;
  const originalNGN =
    product.compareAtPrice != null
      ? `₦${product.compareAtPrice.toLocaleString("en-NG", { minimumFractionDigits: 0 })}`
      : undefined;

  const router = useRouter();
  const auth: any = useAuth?.(); // tolerant to whatever your context exposes
  const isLoggedIn = Boolean(auth?.user || auth?.isAuthenticated || auth?.token || auth?.currentUser);

  const [state, setState] = useState<"idle" | "loading" | "added">("idle");

  const handleClick = async () => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    if (state !== "idle") return;

    try {
      setState("loading");
      await onAddToCart?.(product._id, 1);
      setState("added");
      // revert after a moment
      window.setTimeout(() => setState("idle"), 1400);
    } catch (e) {
      setState("idle");
      console.error("Add to cart failed", e);
    }
  };

  const btnLabel = !isLoggedIn
    ? "Sign in to add to cart"
    : state === "loading"
    ? "Adding…"
    : state === "added"
    ? "Added"
    : "Add to Cart";

  return (
    <Card className="market-card group overflow-hidden rounded-xl border border-border/70 bg-card/70 backdrop-blur-[1px] transition-shadow hover:shadow-[0_8px_28px_-8px_rgba(0,0,0,.45)]">
      {/* Media */}
      <div className="relative overflow-hidden rounded-t-lg">
        <img
          src={product.imageUrl || "/placeholder.svg"}
          alt={product.name}
          className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />

        {sale && (
          <Badge className="absolute left-3 top-3 bg-destructive text-destructive-foreground text-xs font-medium px-2 py-1">
            Sale
          </Badge>
        )}

        {/* Wishlist */}
        <Button
          size="icon"
          variant="secondary"
          type="button"
          aria-label="Add to wishlist"
          className="absolute right-3 top-3 h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
        >
          <Heart className="h-4 w-4" />
        </Button>
      </div>

      <CardContent className="mc-content px-5 py-4 md:px-6 md:py-5">
        {/* Category */}
        {product.collectionRef?.name && (
          <Badge
            variant="outline"
            className="mc-category text-[11px] font-medium tracking-[0.02em] border-border/60 text-muted-foreground px-2 py-0.5"
          >
            {product.collectionRef.name}
          </Badge>
        )}

        {/* Title */}
        <h3 className="mc-title font-heading text-[16px] font-semibold leading-[1.35] tracking-[-0.0125em] m-0 line-clamp-2">
          {product.name}
        </h3>

        {showDescription && product.description ? (
          <p className="mc-desc mt-1 text-[13px] leading-snug text-muted-foreground line-clamp-2">
            {product.description}
          </p>
        ) : null}

        {/* Price */}
        <div className="mc-price flex items-baseline">
          <span className="mc-price-main font-heading text-[18px] font-bold tabular-nums tracking-[-0.02em] leading-none">
            {priceNGN}
          </span>
          {originalNGN && (
            <span className="mc-price-compare text-[13px] text-muted-foreground leading-none line-through">
              {originalNGN}
            </span>
          )}
        </div>

        {/* Rating + points */}
        <div className="mc-meta flex items-center justify-between text-[13px] text-muted-foreground leading-none">
          <div className="flex items-center gap-1.5">
            <Star className="h-4 w-4 fill-pink-300 text-pink-300" />
            <span>{(product.rating ?? 4.9).toFixed(1)}</span>
            <span>({product.reviews ?? 67})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4" />
            <span>{product.pickupPoints ?? 12} points</span>
          </div>
        </div>

        {/* Seller */}
        <div className="mc-seller text-[12px] leading-tight text-muted-foreground">
          by {product.seller ?? "Ivory Beauty"}
        </div>

        {/* Escrow */}
        <div className="mc-escrow text-[11px] font-medium leading-none">
          <Shield className="h-3 w-3 inline-block mr-1 align-[-2px]" />
          <span>Escrow Protected</span>
        </div>

        {/* CTA */}
        <Button
          onClick={handleClick}
          type="button"
          disabled={state === "loading"}
          className={`mc-cta relative h-10 w-full justify-center rounded-lg bg-foreground text-background hover:bg-foreground/90 font-medium transition-all duration-300
            ${!isLoggedIn ? "bg-foreground/90 hover:bg-foreground/90" : ""}
            ${state === "added" ? "added" : ""}
            ${state === "loading" ? "loading" : ""}`}
        >
          {(!isLoggedIn && <LogIn className="mr-2 h-4 w-4" />) ||
            (state === "loading" && <Loader2 className="mr-2 h-4 w-4 spin" />) ||
            (state === "added" && <Check className="mr-2 h-4 w-4" />) || <ShoppingCart className="mr-2 h-4 w-4" />}
          <span className="text-[14px] font-medium leading-none tracking-[-0.01em]">
            {btnLabel}
          </span>
        </Button>
      </CardContent>
    </Card>
  );
}
