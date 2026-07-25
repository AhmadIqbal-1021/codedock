import JsonFormatter from "@/components/tools/json-formatter/JsonFormatter";
import { JwtDecoder } from "@/components/tools/jwt-decoder/JwtDecoder";

export const TOOL_RENDERERS = {
  "json-formatter": JsonFormatter,
   "jwt-decoder": JwtDecoder,
};