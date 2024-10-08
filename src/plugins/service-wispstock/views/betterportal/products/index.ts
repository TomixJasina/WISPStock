import {
  BetterPortalUIComponentBaseTypeDefinition,
  BetterPortalUIView,
  BetterPortalUIComponentDataHandler,
  HTTP_DATA_METHOD,
} from "@bettercorp/betterportal";
import { z } from "zod";
import { Plugin } from "../../../plugin";
import { T_SUPPORTED_THEMES } from "../index";
import { ProductListItem, QueryCollections } from "../../../../../index";

const querySchema = z.object({
  page: z.coerce.number().min(1).optional(),
  search: z.string().optional(),
});
const outputSchema = z.object({
  products: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      sku: z.string(),
    })
  ),
  page: z.number(),
  total: z.number(),
  perPage: z.number(),
});

export interface ViewDefinition
  extends BetterPortalUIComponentBaseTypeDefinition {
  context?: Plugin;
  path: "/products";
  query: typeof querySchema;
  inboundData: null;
  outputData: typeof outputSchema;
  internalData?: {};
}

export const ViewSchema: ViewDefinition = {
  path: "/products",
  query: querySchema,
  inboundData: null,
  outputData: outputSchema,
  methods: ["GET"],
};

import { Component as Materio1 } from "./materio1";

export const ViewHandlers: Record<
  T_SUPPORTED_THEMES,
  BetterPortalUIView<ViewDefinition> | null
> = {
  materio1: Materio1,
};

export const DataHandler: BetterPortalUIComponentDataHandler<
  ViewDefinition
> = async (props) => {
  const session = props.context.RavenDB.openSession(),
    page = props.query?.page ?? 1;

  let query1 = session
      .query<ProductListItem>(QueryCollections.products)
      .whereEquals("enabled", true),
    query2 = session
      .query<ProductListItem>(QueryCollections.products)
      .whereEquals("enabled", true);

  if (props.query?.search) {
    query1 = query1.search("title",`*${props.query.search}*` ).orElse().search("sku", `*${props.query.search}*`);
    query2 = query2.search("title",`*${props.query.search}*`).orElse().search("sku", `*${props.query.search}*`);
  }

  const total = await query1.count(),
    products = await query2
      .skip(props.context.Config.maxProductsPerPage * (page - 1))
      .take(props.context.Config.maxProductsPerPage)
      .all();

  session.dispose();

  return {
    status: 200,
    content: {
      products: products.map((product) => ({
        id: product.id,
        title: product.title,
        sku: product.sku,
      })),
      page: page,
      total: total,
      perPage: props.context.Config.maxProductsPerPage
    },
  };
};
export const DataHandlers: Record<
  HTTP_DATA_METHOD,
  BetterPortalUIComponentDataHandler<ViewDefinition> | undefined
> = {
  POST: DataHandler,
  GET: DataHandler,
  PATCH: undefined,
  DELETE: undefined,
  PUT: undefined,
};
