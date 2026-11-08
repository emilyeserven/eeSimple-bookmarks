import type { CreateItemInput, Item, UpdateItemInput } from "@app/types";

import { createCrudApi } from "./client";

export const itemsApi = createCrudApi<Item, CreateItemInput, UpdateItemInput>("items");
