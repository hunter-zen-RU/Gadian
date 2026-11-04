/**
 * Android Binary XML (AXML) Decoder for AndroidManifest.xml
 * Decodes raw binary XML from APK zip files into standard readable XML string.
 */

export function decodeBinaryXml(buffer: Uint8Array): string {
  try {
    const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    if (buffer.length < 8) {
      return fallbackExtractStrings(buffer);
    }

    const fileType = view.getUint32(0, true);
    // RES_XML_TYPE = 0x00080003
    if (fileType !== 0x00080003 && fileType !== 0x00080000) {
      return fallbackExtractStrings(buffer);
    }

    let offset = 8;
    const stringPool: string[] = [];

    // Chunk header parsing
    while (offset + 8 <= buffer.byteLength) {
      const chunkType = view.getUint32(offset, true);
      const chunkSize = view.getUint32(offset + 4, true);

      if (chunkSize <= 0 || offset + chunkSize > buffer.byteLength) {
        break;
      }

      if (chunkType === 0x001c0001) {
        // String Pool Chunk
        parseStringPool(view, buffer, offset, stringPool);
      }

      offset += chunkSize;
    }

    if (stringPool.length === 0) {
      return fallbackExtractStrings(buffer);
    }

    // Now reconstruct the XML tree
    offset = 8;
    let xml = '<?xml version="1.0" encoding="utf-8"?>\n';
    let indent = 0;

    while (offset + 8 <= buffer.byteLength) {
      const chunkType = view.getUint32(offset, true);
      const chunkSize = view.getUint32(offset + 4, true);

      if (chunkSize <= 0 || offset + chunkSize > buffer.byteLength) {
        break;
      }

      switch (chunkType) {
        case 0x00100102: {
          // START_ELEMENT
          if (offset + 36 <= buffer.byteLength) {
            const nameIdx = view.getInt32(offset + 20, true);
            const attrCount = view.getUint16(offset + 28, true);
            const tagName = getString(stringPool, nameIdx) || "element";

            xml += "  ".repeat(indent) + `<${tagName}`;

            // Parse attributes
            let attrOffset = offset + 36;
            for (let i = 0; i < attrCount; i++) {
              if (attrOffset + 20 > buffer.byteLength) break;
              const attrNameIdx = view.getInt32(attrOffset + 4, true);
              const attrValIdx = view.getInt32(attrOffset + 8, true);
              const attrType = view.getUint32(attrOffset + 12, true) >> 24;
              const attrData = view.getInt32(attrOffset + 16, true);

              const attrName = getString(stringPool, attrNameIdx) || `attr_${i}`;
              let attrVal = getString(stringPool, attrValIdx);

              if (!attrVal) {
                // Type resolution
                if (attrType === 0x12) {
                  // Boolean
                  attrVal = attrData !== 0 ? "true" : "false";
                } else if (attrType === 0x10 || attrType === 0x11) {
                  // Integer / Hex
                  attrVal = attrData.toString();
                } else if (attrType === 0x01) {
                  // Reference
                  attrVal = `@0x${attrData.toString(16)}`;
                } else {
                  attrVal = attrData.toString();
                }
              }

              // Prepend android: for known android manifest attributes
              const formattedName = isAndroidAttr(attrName) ? `android:${attrName}` : attrName;
              xml += ` ${formattedName}="${escapeXml(attrVal)}"`;
              attrOffset += 20;
            }

            xml += ">\n";
            indent++;
          }
          break;
        }

        case 0x00100103: {
          // END_ELEMENT
          if (offset + 24 <= buffer.byteLength) {
            const nameIdx = view.getInt32(offset + 20, true);
            const tagName = getString(stringPool, nameIdx) || "element";
            indent = Math.max(0, indent - 1);
            xml += "  ".repeat(indent) + `</${tagName}>\n`;
          }
          break;
        }

        case 0x00100104: {
          // CDATA_TEXT
          if (offset + 28 <= buffer.byteLength) {
            const nameIdx = view.getInt32(offset + 16, true);
            const text = getString(stringPool, nameIdx);
            if (text && text.trim()) {
              xml += "  ".repeat(indent) + `${escapeXml(text.trim())}\n`;
            }
          }
          break;
        }
      }

      offset += chunkSize;
    }

    if (xml.length < 50) {
      return fallbackExtractStrings(buffer);
    }

    return xml;
  } catch {
    return fallbackExtractStrings(buffer);
  }
}

function parseStringPool(
  view: DataView,
  buffer: Uint8Array,
  poolOffset: number,
  output: string[]
) {
  const stringCount = view.getUint32(poolOffset + 8, true);
  const flags = view.getUint32(poolOffset + 16, true);
  const stringsStart = poolOffset + view.getUint32(poolOffset + 20, true);
  const isUtf8 = (flags & (1 << 8)) !== 0;

  const offsets: number[] = [];
  for (let i = 0; i < stringCount; i++) {
    offsets.push(view.getUint32(poolOffset + 28 + i * 4, true));
  }

  for (let i = 0; i < stringCount; i++) {
    const strStart = stringsStart + offsets[i];
    if (strStart >= buffer.byteLength) {
      output.push("");
      continue;
    }

    try {
      if (isUtf8) {
        // UTF-8 string: length prefix then null-terminated
        let pos = strStart;
        // Skip UTF-8 length byte(s)
        if (buffer[pos] & 0x80) pos += 2;
        else pos += 1;
        if (buffer[pos] & 0x80) pos += 2;
        else pos += 1;

        let end = pos;
        while (end < buffer.byteLength && buffer[end] !== 0) {
          end++;
        }
        const text = new TextDecoder("utf-8").decode(buffer.slice(pos, end));
        output.push(text);
      } else {
        // UTF-16LE string
        let pos = strStart;
        const charLen = view.getUint16(pos, true);
        pos += 2;
        if (charLen & 0x8000) {
          pos += 2; // extended len
        }

        const chars: string[] = [];
        let cur = pos;
        while (cur + 2 <= buffer.byteLength) {
          const code = view.getUint16(cur, true);
          if (code === 0) break;
          chars.push(String.fromCharCode(code));
          cur += 2;
        }
        output.push(chars.join(""));
      }
    } catch {
      output.push("");
    }
  }
}

function getString(pool: string[], idx: number): string | null {
  if (idx >= 0 && idx < pool.length) {
    return pool[idx];
  }
  return null;
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function isAndroidAttr(name: string): boolean {
  const common = [
    "name",
    "label",
    "icon",
    "theme",
    "permission",
    "exported",
    "enabled",
    "authorities",
    "process",
    "versionCode",
    "versionName",
    "minSdkVersion",
    "targetSdkVersion",
    "maxSdkVersion",
    "debuggable",
    "allowBackup",
    "usesCleartextTraffic",
    "networkSecurityConfig",
    "hardwareAccelerated",
  ];
  return common.includes(name);
}

function fallbackExtractStrings(buffer: Uint8Array): string {
  const decoder = new TextDecoder("latin1");
  const text = decoder.decode(buffer);
  const matches = text.match(/[\x20-\x7E]{4,}/g) || [];

  return `<!-- Binary Manifest - Extracted String Table -->
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${extractFirstMatching(matches, /([a-z][a-z0-9_]*(\.[a-z0-9_]+)+)/i) || "com.unknown.app"}">
    <!-- Strings discovered in manifest chunk: -->
${matches
  .filter((m) => m.includes("android") || m.includes("permission") || m.includes("Activity") || m.includes("Service"))
  .map((m) => `    <!-- ${escapeXml(m)} -->`)
  .slice(0, 50)
  .join("\n")}
</manifest>`;
}

function extractFirstMatching(strings: string[], regex: RegExp): string | null {
  for (const s of strings) {
    const match = s.match(regex);
    if (match && match[0]) return match[0];
  }
  return null;
}
