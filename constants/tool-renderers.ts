import JsonFormatter from "@/components/tools/json-formatter/JsonFormatter";
import { JwtDecoder } from "@/components/tools/jwt-decoder/JwtDecoder";
import { Base64Encoder } from "@/components/tools/base64-encoder/Base64Encoder";
import { UrlEncoder } from "@/components/tools/url-encoder/UrlEncoder";
import { RegexTester } from "@/components/tools/regex-tester/RegexTester";
import { PasswordGenerator } from "@/components/tools/password-generator/PasswordGenerator"
import { UuidGenerator } from "@/components/tools/uuid-generator/UuidGenerator"
import { HashGenerator } from "@/components/tools/hash-generator/HashGenerator"
import { UnixTimestampConverter } from "@/components/tools/unix-timestamp-converter/UnixTimestampConverter"
import { LoremIpsumGenerator } from "@/components/tools/lorem-ipsum-generator/LoremIpsumGenerator"
import { ColorConverter } from "@/components/tools/color-converter/ColorConverter"
export const TOOL_RENDERERS = {
  "json-formatter": JsonFormatter,
   "jwt-decoder": JwtDecoder,
   "base64-encoder-decoder": Base64Encoder,
    "url-encoder-decoder": UrlEncoder,
    "regex-tester": RegexTester,
    "password-generator" : PasswordGenerator,
    "uuid-generator" : UuidGenerator,
    "hash-generator" : HashGenerator,
    "unix-timestamp-converter" : UnixTimestampConverter,
    "color-converter" : ColorConverter,
    "lorem-ipsum-generator" :LoremIpsumGenerator,
    
};