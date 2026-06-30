import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import type { LucideProps } from "lucide-react";

import {
  Airplane,
  AirplaneInFlight,
  AirplaneLanding,
  AirplaneTakeoff,
  AirplaneTaxiing,
  AirplaneTilt,
  Anchor,
  Backpack,
  Bicycle,
  Binoculars,
  BeerBottle,
  BeerStein,
  Boat,
  Bridge,
  Bus,
  Cactus,
  Camera,
  CameraPlus,
  Campfire,
  Car,
  CarProfile,
  CarSimple,
  Champagne,
  Church,
  Coffee,
  Compass,
  FishSimple,
  Flag,
  FlagBanner,
  FlagCheckered,
  FlagPennant,
  Fire,
  ForkKnife,
  Globe,
  GlobeHemisphereEast,
  GlobeHemisphereWest,
  GlobeSimple,
  GlobeStand,
  HandWaving,
  IdentificationBadge,
  IdentificationCard,
  Island,
  Leaf,
  Lighthouse,
  MapPin,
  MapPinLine,
  MapPinSimple,
  MapTrifold,
  Martini,
  Moped,
  Mosque,
  Motorcycle,
  Mountains,
  NavigationArrow,
  PersonSimpleHike,
  PersonSimpleSki,
  PersonSimpleSnowboard,
  PersonSimpleSwim,
  PersonSimpleWalk,
  RoadHorizon,
  Sailboat,
  Scooter,
  Snowflake,
  Star,
  Subway,
  Suitcase,
  SuitcaseRolling,
  SuitcaseSimple,
  Synagogue,
  Taxi,
  Tent,
  Ticket,
  Tipi,
  Train,
  TrainRegional,
  TrainSimple,
  Tram,
  Tree,
  Trophy,
  Truck,
  Umbrella,
  UmbrellaSimple,
  Van,
  Waves,
  Wine,
} from "@phosphor-icons/react";
import { Tag, icons } from "lucide-react";

/** Every available Lucide icon name (PascalCase), e.g. `"Star"`, `"BookOpen"`. */
export const ICON_NAMES = Object.keys(icons) as (keyof typeof icons)[];

/**
 * Curated travel & map icons from Phosphor Icons, keyed with the "ph:" prefix.
 * The prefix routes rendering to Phosphor rather than Lucide; existing Lucide
 * names stored without a prefix are unaffected.
 */
export const PHOSPHOR_TRAVEL_ICONS: Record<string, PhosphorIcon> = {
  // Air
  "ph:Airplane": Airplane,
  "ph:AirplaneTakeoff": AirplaneTakeoff,
  "ph:AirplaneLanding": AirplaneLanding,
  "ph:AirplaneTilt": AirplaneTilt,
  "ph:AirplaneInFlight": AirplaneInFlight,
  "ph:AirplaneTaxiing": AirplaneTaxiing,
  // Water
  "ph:Anchor": Anchor,
  "ph:Sailboat": Sailboat,
  "ph:Boat": Boat,
  // Land transport
  "ph:Train": Train,
  "ph:TrainSimple": TrainSimple,
  "ph:TrainRegional": TrainRegional,
  "ph:Subway": Subway,
  "ph:Tram": Tram,
  "ph:Bus": Bus,
  "ph:Taxi": Taxi,
  "ph:Car": Car,
  "ph:CarSimple": CarSimple,
  "ph:CarProfile": CarProfile,
  "ph:Van": Van,
  "ph:Truck": Truck,
  "ph:Motorcycle": Motorcycle,
  "ph:Scooter": Scooter,
  "ph:Bicycle": Bicycle,
  "ph:Moped": Moped,
  // Landmarks
  "ph:Church": Church,
  "ph:Mosque": Mosque,
  "ph:Synagogue": Synagogue,
  "ph:Lighthouse": Lighthouse,
  "ph:Bridge": Bridge,
  "ph:Tipi": Tipi,
  // Nature
  "ph:Mountains": Mountains,
  "ph:Island": Island,
  "ph:Waves": Waves,
  "ph:Tree": Tree,
  "ph:Snowflake": Snowflake,
  "ph:Campfire": Campfire,
  "ph:Cactus": Cactus,
  "ph:Leaf": Leaf,
  "ph:Fire": Fire,
  // Travel gear
  "ph:Suitcase": Suitcase,
  "ph:SuitcaseSimple": SuitcaseSimple,
  "ph:SuitcaseRolling": SuitcaseRolling,
  "ph:Backpack": Backpack,
  "ph:Tent": Tent,
  "ph:Umbrella": Umbrella,
  "ph:UmbrellaSimple": UmbrellaSimple,
  // Navigation & maps
  "ph:MapTrifold": MapTrifold,
  "ph:MapPin": MapPin,
  "ph:MapPinSimple": MapPinSimple,
  "ph:MapPinLine": MapPinLine,
  "ph:Compass": Compass,
  "ph:Globe": Globe,
  "ph:GlobeHemisphereEast": GlobeHemisphereEast,
  "ph:GlobeHemisphereWest": GlobeHemisphereWest,
  "ph:GlobeSimple": GlobeSimple,
  "ph:GlobeStand": GlobeStand,
  "ph:NavigationArrow": NavigationArrow,
  "ph:RoadHorizon": RoadHorizon,
  // Food & culture
  "ph:ForkKnife": ForkKnife,
  "ph:Coffee": Coffee,
  "ph:BeerBottle": BeerBottle,
  "ph:BeerStein": BeerStein,
  "ph:Wine": Wine,
  "ph:Martini": Martini,
  "ph:Champagne": Champagne,
  // Activities
  "ph:Camera": Camera,
  "ph:CameraPlus": CameraPlus,
  "ph:Binoculars": Binoculars,
  "ph:PersonSimpleWalk": PersonSimpleWalk,
  "ph:PersonSimpleHike": PersonSimpleHike,
  "ph:PersonSimpleSwim": PersonSimpleSwim,
  "ph:PersonSimpleSnowboard": PersonSimpleSnowboard,
  "ph:PersonSimpleSki": PersonSimpleSki,
  "ph:FishSimple": FishSimple,
  // Documents & identifiers
  "ph:IdentificationCard": IdentificationCard,
  "ph:IdentificationBadge": IdentificationBadge,
  "ph:Ticket": Ticket,
  // Flags, awards & cultural
  "ph:Flag": Flag,
  "ph:FlagPennant": FlagPennant,
  "ph:FlagCheckered": FlagCheckered,
  "ph:FlagBanner": FlagBanner,
  "ph:Trophy": Trophy,
  "ph:HandWaving": HandWaving,
  "ph:Star": Star,
};

export const PHOSPHOR_TRAVEL_ICON_NAMES = Object.keys(PHOSPHOR_TRAVEL_ICONS);

/** The icon rendered when a category has no icon set or an unknown name. */
const DEFAULT_ICON = Tag;

interface CategoryIconProps extends Omit<LucideProps, "name"> {
  /** A Lucide icon name (no prefix) or Phosphor travel icon name ("ph:" prefix);
   * falls back to a default icon when null/unknown. */
  name: string | null | undefined;
}

/** Render an icon by its stored name. Lucide icons have no prefix; Phosphor
 * travel icons are identified by a `"ph:"` prefix (e.g. `"ph:Airplane"`). */
export function CategoryIcon({
  name, ...props
}: CategoryIconProps) {
  if (name?.startsWith("ph:")) {
    const PhIcon = PHOSPHOR_TRAVEL_ICONS[name];
    if (PhIcon) {
      return (
        <PhIcon
          weight="bold"
          size={props.size ?? props.width ?? props.height}
          color={props.color}
          className={props.className}
        />
      );
    }
    return <DEFAULT_ICON {...props} />;
  }
  const Icon = (name && icons[name as keyof typeof icons]) || DEFAULT_ICON;
  return <Icon {...props} />;
}
