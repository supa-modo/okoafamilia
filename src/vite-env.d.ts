/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_OKOA_FAMILIA_AGENT: string;
  readonly VITE_OKOA_FAMILIA_PLAN_SLUG: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

