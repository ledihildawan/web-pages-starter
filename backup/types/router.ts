export type RoutePath<T extends string = string> = T;

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RouteConfig<TContext = unknown> {
  path: RoutePath;
  view: string;
  title: string;
  context?: TContext;
  method?: HttpMethod;
}

export interface Route<TContext extends Record<string, unknown> = Record<string, unknown>> extends RouteConfig<TContext> {
  name?: string;
  middleware?: RouteMiddleware<TContext>[];
}

export type RouteMiddleware<TContext = unknown> = (context: TContext) => void | Promise<void>;

export interface RouteRegistry {
  [key: string]: Route;
}

export type InferRouteContext<TRoute extends RouteConfig> = TRoute extends RouteConfig<infer TContext> ? TContext : Record<string, unknown>;

export type PathParams<TPath extends string> = TPath extends `${infer _}:${infer Param}/${infer Rest}`
  ? { [K in Param | keyof PathParams<`/${Rest}`>]: string }
  : TPath extends `${infer _}:${infer Param}`
    ? { [K in Param]: string }
    : Record<string, never>;

export type RouteContext<TContext extends Record<string, unknown> = Record<string, unknown>> = TContext;