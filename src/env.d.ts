/// <reference types="vite/client" />
import 'vue-router';

declare module '*.vue' {
    import type { DefineComponent } from 'vue';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
    const component: DefineComponent<{}, {}, any>;
    export default component;
}

declare module 'vue-router' {
    interface RouteMeta {
        title: string,
    }
}

interface ImportMetaEnv extends Readonly<Record<string, string>> {
    readonly VITE_APP_TITLE: string;
    readonly VITE_BASE_URL: string;
    readonly VITE_APP_API_URL: string;
    readonly VITE_ENV: 'LOCAL' | 'DEV' | 'PROD' | 'STG';
    readonly VITE_IS_LOCAL: boolean;
    readonly VITE_IS_DEV: boolean;
    readonly VITE_IS_STG: boolean;
    readonly VITE_IS_PROD: boolean;
    readonly VITE_CORE_LOGIN: string;
    readonly VITE_CORE_AUTH: string;
    // more env variables...
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
