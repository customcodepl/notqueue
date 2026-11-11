import type messages from "./messages/en.json";

// en.json is the type source: an unknown key is a type error.
declare module "next-intl" {
  interface AppConfig {
    Messages: typeof messages;
  }
}
