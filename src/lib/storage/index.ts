import { LocalStorageProvider } from "./local-storage-provider";
import { env } from "../../env";

export const storage = new LocalStorageProvider(env.STORAGE_ROOT);
