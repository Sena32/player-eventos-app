/**
 * Tipos de contrato com a API externa (placeholder para integração futura).
 */
export type ExternalApiHealth = {
  status: "ok" | "degraded";
};

export type ExternalPaginated<T> = {
  items: T[];
  nextCursor: string | null;
};
