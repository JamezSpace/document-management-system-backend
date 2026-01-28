interface AuthorizationResource {
  type: "document" | "workflow" | "user" | "system";
  id?: string;
}


export type { AuthorizationResource };