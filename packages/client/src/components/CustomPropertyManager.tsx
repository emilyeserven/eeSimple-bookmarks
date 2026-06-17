import type { CustomProperty, CustomPropertyType } from "@eesimple/types";

import { useState } from "react";

import { PropertyTagManager } from "./PropertyTagManager";
import {
  useCreateCustomProperty,
  useCustomProperties,
  useDeleteCustomProperty,
} from "../hooks/useCustomProperties";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TYPE_LABELS: Record<CustomPropertyType, string> = {
  tiered_tags: "Tiered Tags",
  number: "Number",
};

/** Create, list, and delete custom properties; manage each tiered-tags property's tiers. */
export function CustomPropertyManager() {
  const {
    data: properties, isLoading, error,
  } = useCustomProperties();
  const createProperty = useCreateCustomProperty();

  const [name, setName] = useState("");
  const [type, setType] = useState<CustomPropertyType>("tiered_tags");
  const [numberMin, setNumberMin] = useState("0");
  const [numberMax, setNumberMax] = useState("100");

  function create() {
    const trimmed = name.trim();
    if (!trimmed) return;
    createProperty.mutate({
      name: trimmed,
      type,
      numberMin: type === "number" ? Number(numberMin) : null,
      numberMax: type === "number" ? Number(numberMax) : null,
    });
    setName("");
    setNumberMin("0");
    setNumberMax("100");
  }

  return (
    <section className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>New custom property</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className="
              grid gap-3
              sm:grid-cols-2
            "
          >
            <div className="space-y-1">
              <Label htmlFor="property-name">Name</Label>
              <Input
                id="property-name"
                placeholder="e.g. Priority"
                value={name}
                onChange={event => setName(event.target.value)}
                onKeyDown={event => event.key === "Enter" && create()}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="property-type">Type</Label>
              <Select
                value={type}
                onValueChange={value => setType(value as CustomPropertyType)}
              >
                <SelectTrigger
                  id="property-type"
                  className="w-full"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tiered_tags">Tiered Tags</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {type === "number"
              ? (
                <>
                  <div className="space-y-1">
                    <Label htmlFor="property-min">Slider minimum</Label>
                    <Input
                      id="property-min"
                      type="number"
                      value={numberMin}
                      onChange={event => setNumberMin(event.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="property-max">Slider maximum</Label>
                    <Input
                      id="property-max"
                      type="number"
                      value={numberMax}
                      onChange={event => setNumberMax(event.target.value)}
                    />
                  </div>
                </>
              )
              : null}
          </div>

          <Button
            type="button"
            onClick={create}
            disabled={!name.trim() || createProperty.isPending}
          >
            Add property
          </Button>
          {createProperty.isError
            ? <p className="text-sm text-destructive">{createProperty.error.message}</p>
            : null}
        </CardContent>
      </Card>

      {isLoading ? <p className="text-muted-foreground">Loading custom properties…</p> : null}
      {error ? <p className="text-destructive">{error.message}</p> : null}
      {!isLoading && (properties?.length ?? 0) === 0
        ? <p className="text-muted-foreground">No custom properties yet. Create one above.</p>
        : null}

      <div className="space-y-4">
        {(properties ?? []).map(property => (
          <PropertyCard
            key={property.id}
            property={property}
          />
        ))}
      </div>
    </section>
  );
}

interface PropertyCardProps {
  property: CustomProperty;
}

function PropertyCard({
  property,
}: PropertyCardProps) {
  const deleteProperty = useDeleteCustomProperty();

  return (
    <Card>
      <CardHeader
        className="flex-row items-center justify-between gap-2 space-y-0"
      >
        <div className="flex items-center gap-2">
          <CardTitle>{property.name}</CardTitle>
          <Badge variant="secondary">{TYPE_LABELS[property.type]}</Badge>
          {property.type === "number"
            ? (
              <span className="text-xs text-muted-foreground">
                {`${property.numberMin ?? "auto"} – ${property.numberMax ?? "auto"}`}
              </span>
            )
            : null}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-destructive"
          onClick={() => deleteProperty.mutate(property.id)}
        >
          Delete
        </Button>
      </CardHeader>

      {property.type === "tiered_tags"
        ? (
          <CardContent>
            <PropertyTagManager propertyId={property.id} />
          </CardContent>
        )
        : null}
    </Card>
  );
}
