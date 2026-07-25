import JsonFormatter from "@/components/tools/json-formatter/JsonFormatter";
import { JwtDecoder } from "@/components/tools/jwt-decoder/JwtDecoder";
import { Base64Encoder } from "@/components/tools/base64-encoder/Base64Encoder";

export const TOOL_RENDERERS = {
  "json-formatter": JsonFormatter,
   "jwt-decoder": JwtDecoder,
   "base64-encoder-decoder": Base64Encoder,
};