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

/** Priority-ordered [pattern, category] pairs. First match wins. */
const CATEGORY_RULES: [RegExp, string][] = [
  // Code & Dev — before Shapes so SquareCode/SquareTerminal route here
  [
    /^(Code|CodeXml|Git|Terminal|Bug|Database|Server|Bot(?!tleWine)|Braces|BracesCorner|Brackets|Binary|Webhook|Cpu|Gpu|Microchip|CircuitBoard|Regex|Shell|Workflow|Logs|MemoryStick|HardDrive|EthernetPort|Usb|HdmiPort|PcCase|SquareCode|SquareTerminal|FolderCode|FolderGit|FolderGit2|FileCode|FileCodeCorner|FileBraces|FileBracesCorner|FileTerminal|Container|Component|AppWindow|Blocks|SquareDashedKanban)/,
    "Code & Dev",
  ],
  // Charts & Data — before Shapes so SquareChartGantt/SquareKanban route here
  [
    /^(Chart|SquareChartGantt|SquareKanban|Kanban|Trending|Activity|SquareActivity|Gauge|CircleGauge)/,
    "Charts & Data",
  ],
  // Arrows — includes Circle/Square compound arrow/chevron variants
  [
    /^(Arrow|Chevron|Corner|Move|CircleArrow|SquareArrow|CircleChevron|SquareChevron|Redo|Undo|Rotate|Refresh|IterationC|StepBack|StepForward|Rewind|FastForward|SkipBack|SkipForward|Forward|DecimalsArrow|WavesArrow|ArrowsUpFromLine|BanknoteArrow|CalendarArrow|ClockArrow)/,
    "Arrows",
  ],
  // Files & Docs — before Media so BookAudio/BookHeadphones route here, not Media
  [
    /^(File|Folder|Clipboard|Archive|Book|Notebook|NotepadText|StickyNote|Paperclip|Stamp|Scroll|Save|Files)/,
    "Files & Docs",
  ],
  // Media & Audio — Circle/Square play/pause/stop listed explicitly before Shapes catches them
  [
    /^(Music|Volume|Mic(?!row)|Headphone|Headset|Radio|Podcast|BoomBox|Clapperboard|Film|Video|Play|Pause|Stop|Shuffle|Repeat|Disc|CassetteTape|AudioLines|AudioWaveform|Turntable|Metronome|Piano|Guitar|Drum(?!stick)|Speaker|ListMusic|FileMusic|CirclePlay|SquarePlay|CirclePause|SquarePause|CircleStop|SquareStop|TvMinimalPlay|ImagePlay|KeyboardMusic|Album)/,
    "Media & Audio",
  ],
  // Camera & Scanning
  [
    /^(Camera|Aperture|QrCode|Barcode|ScanBarcode|ScanQrCode|ScanLine|ScanText|ScanSearch|ScanFace|ScanEye|Scan$|SwitchCamera|PictureInPicture|Focus|Crop)/,
    "Camera",
  ],
  // Communication
  [
    /^(Message|Bell|Mail|Phone|Send|Reply|Inbox|Megaphone|Voicemail|Contact|Mails|Mailbox|Speech|ConciergeBell|Captions|CaptionsOff|ClosedCaption|Antenna|Wifi|Signal|Satellite|Cast|ScreenShare|Nfc|MessagesSquare)/,
    "Communication",
  ],
  // People — emotion icons live here
  [
    /^(User|Users|CircleUser|SquareUser|PersonStanding|Hand|Baby|Accessibility|BicepsFlexed|Footprints|IdCard|GraduationCap|VenetianMask|Smile|SmilePlus|Frown|Meh|Angry|Annoyed|Laugh)/,
    "People",
  ],
  // Devices
  [
    /^(Laptop|Monitor|Smartphone|Tablet|Keyboard|Mouse|Printer|Battery|Bluetooth|Tv|Webcam|Computer|Airplay|Unplug)/,
    "Devices",
  ],
  // Maps & Location — Globe* checked here before Security catches GlobeLock
  [
    /^(Map|MapPin|Globe(?!Lock)|Compass|Navigation|Route|Waypoints|Radar|Locate|Crosshair|Milestone|Signpost)/,
    "Maps & Location",
  ],
  // Buildings
  [
    /^(Building|House|Hotel|Hospital|School|University|Church|Castle|Warehouse|Landmark|Tent|Factory|Store|Library|BrickWall|Dam|Bridge|Mosque|Synagogue)/,
    "Buildings",
  ],
  // Nature & Weather
  [
    /^(Sun|Moon|Cloud|Snowflake|Flower|Tree|Leaf|Mountain|Flame|Wind|Waves|Rainbow|Tornado|Haze|Sprout|Shrub|Rose|Cactus|Clover|Sunrise|Sunset|Bolt|Droplet|Thermometer|Island|LeafyGreen|FlameKindling|Campfire)/,
    "Nature & Weather",
  ],
  // Food & Drink
  [
    /^(Coffee|Wine|Beer|Cake|IceCream|Cookie|Candy|Pizza|Croissant|Sandwich|Hamburger|Salad|Soup|Egg|Milk|Utensils|ChefHat|CupSoda|GlassWater|Apple|Cherry|Grape|Carrot|Banana|Broccoli|Donut|Shrimp|BottleWine|Popcorn|Beef|Bean|Blender|FishSymbol|Ham|Citrus|Dessert|CookingPot|Popsicle|Lollipop|Vegan|Martini|Nut|Drumstick|CandyCane|CakeSlice)/,
    "Food & Drink",
  ],
  // Health & Medical — Heart uses negative lookahead so HeartHandshake routes to Social
  [
    /^(Heart(?!Handshake)|Stethoscope|Syringe|Pill|Bandage|Ambulance|Brain|Dna|Microscope|TestTube|Beaker|BriefcaseMedical|ScanHeart|FlaskConical|FlaskRound|Bone|Eye|Ear|Weight)/,
    "Health & Medical",
  ],
  // Transportation
  [
    /^(Car|Bus|Train|Plane|Boat|Ship|Taxi|Truck|Bicycle|Motorcycle|Motorbike|Scooter|Van|Helicopter|Rocket|Forklift|Tractor|Bike|CableCar|TramFront|Sailboat|Kayak|Luggage|Drone|Fuel|EvCharger|TrafficCone|BaggageClaim|Caravan|Anchor|LifeBuoy|Construction|RoadHorizon|Road)/,
    "Transportation",
  ],
  // Finance — currency badges listed explicitly; Tag/Ticket/Package go here
  [
    /^(Wallet|CreditCard|DollarSign|Euro|Receipt|Shopping|Gift|Coin|Banknote(?!Arrow)|PiggyBank|Bitcoin|Currency|PoundSterling|BadgeCent|BadgeDollarSign|BadgeEuro|IndianRupee|JapaneseYen|RussianRuble|SwissFranc|TurkishLira|SaudiRiyal|GeorgianLari|PhilippinePeso|Tag|Ticket|Package)/,
    "Finance",
  ],
  // Security — Key uses negative lookahead so Keyboard routes to Devices
  [
    /^(Lock|Shield|Key(?!board)|Vault|FingerprintPattern|EarthLock|GlobeLock|Ban|AlarmSmoke|FireExtinguisher|Siren|HardHat)/,
    "Security",
  ],
  // Layout & UI — List* excluded for ListMusic/ListVideo (Media); Badge currency variants excluded (Finance)
  [
    /^(Layout|Grid|Gallery|Panel|Columns|Rows|Layer|Table|List(?!Music|Video)|AlignCenter|AlignEnd|AlignStart|AlignHorizontal|AlignVertical|StretchHorizontal|StretchVertical|Expand|Minimize|Maximize|Frame|Split|BetweenHorizontal|BetweenVertical|Scaling|Proportions|Group|Ungroup|Merge|Separator|Section|InspectionPanel|UnfoldHorizontal|UnfoldVertical|FoldHorizontal|FoldVertical|BringToFront|SendToBack|Grip|Search|Trash|Delete|Import|Badge(?!Cent|Dollar|Euro|Indian|Japanese|Pound|Russian|Swiss|Turkish|Lira)|Filter|Funnel|Loader|Check)/,
    "Layout & UI",
  ],
  // Text — Pen uses negative lookahead so Pentagon routes to Shapes
  [
    /^(Bold|Italic|Underline|Strikethrough|Heading|Type|TextAlign|Pilcrow|CaseLower|CaseSensitive|CaseUpper|Subscript|Superscript|Baseline|Highlighter|Ampersand|Ligature|SpellCheck|WholeWord|RemoveFormatting|ALargeSmall|AArrowDown|AArrowUp|Quote|Signature|Form|Summary|TextCursor|TextQuote|TextSearch|TextInitial|TextWrap|Pen(?!tagon)|Pencil)/,
    "Text",
  ],
  // Math & Science — Pi uses exact-match lookahead so Pizza/Pilcrow route elsewhere
  [
    /^(?:Pi$|Atom|Radiation|Biohazard|Sigma|SquareSigma|SquarePi|Radical|SquareRadical|Infinity|Omega|Calculator|SquareFunction|Variable|Tangent|Diameter|Radius|Astroid|Axis3d|Scale3d|Telescope|DraftingCompass|Ruler|RulerDimensionLine|Magnet|Orbit|Lasso|LassoSelect)/,
    "Math & Science",
  ],
  // Time
  [
    /^(Clock|Calendar|Timer|AlarmClock|Hourglass|Watch|History|Timeline|Calendars)/,
    "Time",
  ],
  // Settings & Tools
  [
    /^(Settings|Sliders|Toggle|Cog|Wrench|Hammer|Drill|Axe|Scissors|Anvil|Blend|Contrast|Palette|PaintBucket|PaintRoller|Paintbrush|SprayCan|Pipette|Eraser|SwatchBook|Brush|Shovel|Pickaxe|Toolbox|ToolCase|PocketKnife)/,
    "Settings & Tools",
  ],
  // Shapes — Circle/Square use end-anchor inside alternation so compound variants route above
  [
    /^(Triangle|Pentagon|Hexagon|Octagon|Diamond|Ellipse|Cone|Cylinder|Torus|Cuboid|Pyramid|Spline|Star|Box|Boxes|Squircle|Rectangle|(?:Circle|Square)$|Dot|Slash|Asterisk)/,
    "Shapes",
  ],
  // Gaming & Fun
  [
    /^(Dice|Chess|Sword|FerrisWheel|RollerCoaster|Puzzle|Balloon|PartyPopper|Drama|Ghost|Skull|Trophy|Medal|Award|Ribbon|Wand|BowArrow|Target|Dumbbell|Volleyball|ToyBrick|Sparkle|Crown|Gavel|Gem|Flag|Joystick|Gamepad)/,
    "Gaming & Fun",
  ],
  // Social
  [
    /^(Share|Rss|Link|Unlink|ExternalLink|Handshake|HeartHandshake|Vote|Podium|Presentation|Lectern|ThumbsUp|ThumbsDown)/,
    "Social",
  ],
  // Catch-all
  [/.*/, "Other"],
];

function getLucideCategory(name: string): string {
  for (const [pattern, cat] of CATEGORY_RULES) {
    if (pattern.test(name)) return cat;
  }
  return "Other";
}

/** All Lucide icons grouped by display category (built once at module init). */
export const LUCIDE_ICONS_BY_CATEGORY: Record<string, string[]> = {};
for (const name of ICON_NAMES) {
  const cat = getLucideCategory(name);
  (LUCIDE_ICONS_BY_CATEGORY[cat] ??= []).push(name);
}

/** Sorted category display names for the icon picker tab strip. */
export const LUCIDE_CATEGORY_NAMES: string[] = Object.keys(LUCIDE_ICONS_BY_CATEGORY).sort();

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
