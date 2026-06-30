import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import type { LucideProps } from "lucide-react";

import * as React from "react";

import * as PhosphorIcons from "@phosphor-icons/react";
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

/** First-match-wins categorizer shared by the Lucide and Phosphor registries. */
function categorize(name: string, rules: [RegExp, string][]): string {
  for (const [pattern, cat] of rules) {
    if (pattern.test(name)) return cat;
  }
  return "Other";
}

/** All Lucide icons grouped by display category (built once at module init). */
export const LUCIDE_ICONS_BY_CATEGORY: Record<string, string[]> = {};
for (const name of ICON_NAMES) {
  const cat = categorize(name, CATEGORY_RULES);
  (LUCIDE_ICONS_BY_CATEGORY[cat] ??= []).push(name);
}

/** Sorted category display names for the icon picker tab strip. */
export const LUCIDE_CATEGORY_NAMES: string[] = Object.keys(LUCIDE_ICONS_BY_CATEGORY).sort();

/** Non-icon runtime exports of `@phosphor-icons/react` to skip when building the
 * registry. `Icon`/`IconProps`/`IconWeight` are type-only and never appear here. */
const PHOSPHOR_NON_ICON_EXPORTS = new Set(["IconContext", "IconBase", "SSR"]);

/**
 * Every Phosphor icon component, keyed with the "ph:" prefix (e.g. `"ph:YinYang"`).
 * The prefix routes rendering to Phosphor rather than Lucide; Lucide names stored
 * without a prefix are unaffected.
 *
 * Phosphor exports each icon twice — a bare name (`Airplane`) and an `*Icon`-suffixed
 * alias (`AirplaneIcon`) pointing at the same component. We key on the **bare** name so
 * existing stored values like `"ph:Airplane"` keep resolving and the registry has no
 * duplicates. The bare names are marked `@deprecated` in Phosphor; that's only a
 * tree-shaking hint and is harmless under `import *`. A future Phosphor major that
 * removes the bare exports would require re-keying on the `*Icon` names plus a
 * stored-value migration.
 */
export const PHOSPHOR_ICONS: Record<string, PhosphorIcon> = {};
for (const [name, value] of Object.entries(PhosphorIcons)) {
  if (PHOSPHOR_NON_ICON_EXPORTS.has(name) || name.endsWith("Icon")) continue;
  PHOSPHOR_ICONS[`ph:${name}`] = value as PhosphorIcon;
}

/** Priority-ordered [pattern, category] pairs for Phosphor's PascalCase names.
 * First match wins. The "Asian & Cultural" bucket is intentionally first so the
 * icons this set was added for (yin-yang, lotus, praying hands, …) are discoverable. */
const PHOSPHOR_CATEGORY_RULES: [RegExp, string][] = [
  // Asian & Cultural — listed first so these route here before generic buckets.
  // BowlFood/BowlSteam only (BowlingBall excluded); Fan exact-match.
  [
    /^(YinYang|FlowerLotus|HandsPraying|HandPeace|Peace$|BowlFood|BowlSteam|TeaBag|Fan$|Coffee|CoffeeBean|Cherries|Orange|Scroll|MoonStars|Sparkle|Confetti|Lantern)/,
    "Asian & Cultural",
  ],
  // Transport & Travel
  [
    /^(Airplane|Car|Train|Bus|Boat|Sailboat|Anchor|Taxi|Truck|Van|Motorcycle|Scooter|Bicycle|Moped|Subway|Tram|RoadHorizon|GasPump|Suitcase|Backpack|Tent|Compass|Ticket)/,
    "Transport & Travel",
  ],
  // Maps & Location
  [/^(Map|Globe|NavigationArrow|Path|Crosshair|GpsFix|Lighthouse|Bridge)/, "Maps & Location"],
  // Buildings
  [/^(Building|House|Church|Mosque|Synagogue|Bank|Factory|Storefront|Warehouse|Castle|Tipi)/, "Buildings"],
  // Nature & Weather
  [
    /^(Sun|Moon|Cloud|Snowflake|Flower|Tree|Leaf|Mountains|Island|Waves|Fire|Campfire|Cactus|Plant|Drop|Wind|Lightning|Rainbow|Star)/,
    "Nature & Weather",
  ],
  // Food & Drink
  [
    /^(Bowl|ForkKnife|Wine|Beer|Martini|Champagne|Hamburger|Pizza|Cookie|IceCream|Cake|Bread|Egg|Cheese|Carrot|Avocado|Pepper|Hamburger|Cooking|Pint|BrandyGlass|Knife|Popcorn|Fish|Shrimp)/,
    "Food & Drink",
  ],
  // People & Body
  [/^(Person|User|Users|Baby|Hand|Footprints|Brain|Tooth|Eye|Ear|Nose|Smiley|Student)/, "People & Body"],
  // Communication
  [/^(Chat|Phone|Envelope|Bell|Megaphone|PaperPlane|Broadcast|Voicemail|Microphone)/, "Communication"],
  // Media & Audio
  [/^(Music|Speaker|Headphones|Play|Pause|Stop|FilmReel|FilmSlate|VinylRecord|MusicNote|Radio|Microphone)/, "Media & Audio"],
  // Devices & Tech
  [/^(Device|Laptop|Desktop|Monitor|Keyboard|Mouse|Printer|Cpu|Television|Camera|Watch|Battery|Plug)/, "Devices & Tech"],
  // Files & Docs
  [/^(File|Folder|Book|Note|Clipboard|Archive|Paperclip|Newspaper|Article)/, "Files & Docs"],
  // Finance & Commerce
  [/^(Coin|Currency|Wallet|CreditCard|Bank|Money|ShoppingCart|ShoppingBag|Receipt|Tag|Gift|PiggyBank|HandCoins)/, "Finance & Commerce"],
  // Security
  [/^(Lock|Shield|Key|Password|Fingerprint|SealCheck)/, "Security"],
  // Gaming & Fun
  [/^(Dice|Game|Sword|PuzzlePiece|Trophy|Medal|Crown|Confetti|Balloon|Joystick|Cards)/, "Gaming & Fun"],
  // Flags & Symbols
  [/^(Flag|Heart|HandsClapping|HandWaving|ThumbsUp|ThumbsDown)/, "Flags & Symbols"],
  // Catch-all
  [/.*/, "Other"],
];

/** All Phosphor icons grouped by display category (keys are `"ph:"`-prefixed names). */
export const PHOSPHOR_ICONS_BY_CATEGORY: Record<string, string[]> = {};
for (const prefixed of Object.keys(PHOSPHOR_ICONS)) {
  const cat = categorize(prefixed.slice(3), PHOSPHOR_CATEGORY_RULES);
  (PHOSPHOR_ICONS_BY_CATEGORY[cat] ??= []).push(prefixed);
}

/** Sorted Phosphor category display names for the icon picker tab strip. */
export const PHOSPHOR_CATEGORY_NAMES: string[] = Object.keys(PHOSPHOR_ICONS_BY_CATEGORY).sort();

export const PHOSPHOR_ICON_NAMES = Object.keys(PHOSPHOR_ICONS);

/**
 * App-authored SVG icons that neither Lucide nor Phosphor ships (e.g. a torii gate,
 * a Buddhist temple). Drawn in Lucide's visual style — 24×24, `fill="none"`,
 * `stroke="currentColor"`, round caps/joins — so they sit alongside the rest. Stored
 * with a `"custom:"` prefix, mirroring Phosphor's `"ph:"` prefix.
 */
function CustomSvg({
  size, color, strokeWidth = 2, className, width, height, children,
}: LucideProps & { children: React.ReactNode }) {
  const dim = size ?? width ?? height ?? 24;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={dim}
      height={dim}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? "currentColor"}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {children}
    </svg>
  );
}

/** A Shinto shrine torii gate: two posts, a top kasagi beam, and a nuki tie-beam. */
function ToriiIcon(props: LucideProps) {
  return (
    <CustomSvg {...props}>
      <path d="M3 7h18" />
      <path d="M5 11h14" />
      <path d="M7 7v14" />
      <path d="M17 7v14" />
    </CustomSvg>
  );
}

/** A Buddhist temple / pagoda: a swooping roof with a finial, columns, a doorway, and steps. */
function BuddhistTempleIcon(props: LucideProps) {
  return (
    <CustomSvg {...props}>
      <path d="M2 10 Q12 3 22 10" />
      <path d="M12 6V3" />
      <path d="M6 10v9" />
      <path d="M18 10v9" />
      <path d="M10 19v-6h4v6" />
      <path d="M4 19h16" />
      <path d="M3 22h18" />
    </CustomSvg>
  );
}

/** Custom icon components keyed with a `"custom:"` prefix (mirrors `PHOSPHOR_ICONS`). */
export const CUSTOM_ICONS: Record<string, React.FC<LucideProps>> = {
  "custom:Torii": ToriiIcon,
  "custom:BuddhistTemple": BuddhistTempleIcon,
};

const CUSTOM_CATEGORY = "Religion & Culture";

/** Custom icons grouped by display category (keys are `"custom:"`-prefixed names). */
export const CUSTOM_ICONS_BY_CATEGORY: Record<string, string[]> = {
  [CUSTOM_CATEGORY]: Object.keys(CUSTOM_ICONS),
};

/** Custom category display names for the icon picker. */
export const CUSTOM_CATEGORY_NAMES: string[] = Object.keys(CUSTOM_ICONS_BY_CATEGORY);

export const CUSTOM_ICON_NAMES = Object.keys(CUSTOM_ICONS);

/** The icon rendered when a category has no icon set or an unknown name. */
const DEFAULT_ICON = Tag;

interface CategoryIconProps extends Omit<LucideProps, "name"> {
  /** A Lucide icon name (no prefix) or Phosphor icon name ("ph:" prefix);
   * falls back to a default icon when null/unknown. */
  name: string | null | undefined;
}

/** Render an icon by its stored name. Lucide icons have no prefix; Phosphor
 * icons are identified by a `"ph:"` prefix (e.g. `"ph:Airplane"`); app-authored
 * custom icons use a `"custom:"` prefix (e.g. `"custom:Torii"`). */
export function CategoryIcon({
  name, ...props
}: CategoryIconProps) {
  if (name?.startsWith("custom:")) {
    const Custom = CUSTOM_ICONS[name];
    return Custom ? <Custom {...props} /> : <DEFAULT_ICON {...props} />;
  }
  if (name?.startsWith("ph:")) {
    const PhIcon = PHOSPHOR_ICONS[name];
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
