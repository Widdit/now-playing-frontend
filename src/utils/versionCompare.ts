/**
 * Compares two software version numbers (e.g. "1.7.1" or "1.2b").
 *
 * This function was born in http://stackoverflow.com/a/6832721.
 *
 * @param {string} v1 The first version to be compared.
 * @param {string} v2 The second version to be compared.
 * @param {VersionCompareOptions} [options] Optional flags that affect comparison behavior:
 * <ul>
 *     <li>
 *         <tt>lexicographical: true</tt> compares each part of the version strings lexicographically instead of
 *         naturally; this allows suffixes such as "b" or "dev" but will cause "1.10" to be considered smaller than
 *         "1.2".
 *     </li>
 *     <li>
 *         <tt>zeroExtend: true</tt> changes the result if one version string has less parts than the other. In
 *         this case the shorter string will be padded with "zero" parts instead of being considered smaller.
 *     </li>
 * </ul>
 * @returns {number}
 * <ul>
 *    <li>0 if the versions are equal</li>
 *    <li>a negative integer if v1 < v2</li>
 *    <li>a positive integer if v1 > v2</li>
 *    <li>NaN if either version string is in the wrong format</li>
 * </ul>
 *
 * @copyright by Jon Papaioannou (["john", "papaioannou"].join(".") + "@gmail.com")
 * @license This function is in the public domain. Do what you want with it, no strings attached.
 */
export interface VersionCompareOptions {
  lexicographical?: boolean;
  zeroExtend?: boolean;
}

export function versionCompare(
  v1: string,
  v2: string,
  options?: VersionCompareOptions,
): number {
  const lexicographical = options?.lexicographical ?? false;
  const zeroExtend = options?.zeroExtend ?? false;
  let v1parts: string[] | number[] = v1.split(".");
  let v2parts: string[] | number[] = v2.split(".");

  const isValidPart = (x: string): boolean => {
    return (lexicographical ? /^\d+[A-Za-z]*$/ : /^\d+$/).test(x);
  };

  if (!v1parts.every(isValidPart) || !v2parts.every(isValidPart)) {
    return NaN;
  }

  if (zeroExtend) {
    while (v1parts.length < v2parts.length) {
      v1parts.push("0");
    }
    while (v2parts.length < v1parts.length) {
      v2parts.push("0");
    }
  }

  if (!lexicographical) {
    v1parts = v1parts.map(Number);
    v2parts = v2parts.map(Number);
  }

  for (let i = 0; i < v1parts.length; ++i) {
    if (v2parts.length === i) {
      return 1;
    }

    const part1 = v1parts[i];
    const part2 = v2parts[i];

    if (part1 === part2) {
      continue;
    }

    if (lexicographical) {
      const p1 = part1 as string;
      const p2 = part2 as string;

      return p1 > p2 ? 1 : -1;
    } else {
      const p1 = part1 as number;
      const p2 = part2 as number;

      return p1 > p2 ? 1 : -1;
    }
  }

  if (v1parts.length !== v2parts.length) {
    return -1;
  }

  return 0;
}
