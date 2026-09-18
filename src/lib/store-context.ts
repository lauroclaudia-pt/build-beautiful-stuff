import { createContext } from "react";
import type { StoreValue } from "./store";

/**
 * Contexto isolado do módulo que implementa o store.
 *
 * Manter a identidade do contexto num módulo sem componentes evita que uma
 * atualização rápida do StoreProvider deixe os consumidores ligados a uma
 * instância antiga do contexto.
 */
export const StoreContext = createContext<StoreValue | null>(null);