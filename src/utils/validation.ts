/**
 * @module Validation
 * @description Utilities for processing and validating form data.
 * Extends Zod-based validation with logic to handle common web form patterns,
 * such as HTMX-style arrays (key[] notation) and zip-mapping parallel arrays.
 */

import { z } from "zod";

/**
 * Interface representing a minimal Hono-like request object
 * that can parse a form body.
 */
export interface RequestWithBody {
  /** Function that parses and returns the request body. */
  parseBody: () => Promise<any>;
}

/**
 * Configuration for zip-mapping parallel form arrays into objects.
 */
export interface ZipMapping {
  /** Target key in the resulting object and its source-field mapping. */
  [targetKey: string]: {
    /** Target object field to source form key mapping. */
    [field: string]: string;
  };
}

/**
 * Configuration for field-level type coercion (e.g. converting string "true" to boolean true).
 */
export interface CoercionConfig {
  /** Path to the field and its target primitive type. */
  [path: string]: "boolean" | "number";
}

/**
 * Parses and validates raw form data against a Zod schema.
 * Automatically handles HTMX-style array notation (e.g., 'label[]' -> 'label')
 * and expands dot-notation keys (e.g., 'seo.title' -> { seo: { title: ... } }).
 *
 * @param req - The Hono request object (or equivalent with parseBody()).
 * @param schema - The Zod schema to validate against.
 * @param options - Optional mappings for zipping arrays or coercing types.
 * @returns A promise resolving to the validated and typed form data.
 */
export async function validateForm<T extends z.ZodTypeAny>(
  req: RequestWithBody,
  schema: T,
  options?: {
    zip?: ZipMapping;
    coerce?: CoercionConfig;
    /** If true, makes all fields in the schema optional recursively for partial form submissions. */
    partial?: boolean;
  },
): Promise<z.infer<T>> {
  const body = await req.parseBody();
  const processedBody: any = {};

  /**
   * Internal helper to set a value in a nested object based on a dot-delimited path string.
   * Ensures that intermediate objects are created if they do not exist.
   */
  const setPath = (obj: any, path: string, value: any) => {
    const keys = path.split(".");
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!current[key] || typeof current[key] !== "object") {
        current[key] = {};
      }
      current = current[key];
    }
    current[keys[keys.length - 1]] = value;
  };

  /**
   * Performs basic normalization of form keys and applies type coercion.
   * Handles HTMX-style array notation and converts string representations to primitives.
   */
  const normalizedBody: any = {};
  for (const [key, value] of Object.entries(body)) {
    let cleanKey = key;
    let finalValue: any = value;

    if (key.endsWith("[]")) {
      cleanKey = key.slice(0, -2);
      finalValue = Array.isArray(value) ? value : [value];
    }

    if (options?.coerce && options.coerce[cleanKey]) {
      const targetType = options.coerce[cleanKey];
      if (targetType === "boolean") {
        finalValue = finalValue === "true" || finalValue === "on";
      } else if (targetType === "number") {
        finalValue = Number(finalValue);
      }
    }
    normalizedBody[cleanKey] = finalValue;
  }

  /**
   * Expands dot-notation keys into a structured nested object.
   * This allows flat form field names to map to complex nested configurations.
   */
  for (const [key, value] of Object.entries(normalizedBody)) {
    if (key.includes(".")) {
      setPath(processedBody, key, value);
    } else {
      processedBody[key] = value;
    }
  }

  /**
   * Implements zip-mapping to merge parallel arrays from the form into a single
   * array of structured objects. This is used for dynamic list management.
   */
  if (options?.zip) {
    for (const [targetKey, fields] of Object.entries(options.zip)) {
      const zipped: any[] = [];
      const fieldEntries = Object.entries(fields);
      if (fieldEntries.length === 0) continue;

      const firstSourceKey = fieldEntries[0][1];
      const sourceData = body[firstSourceKey];

      if (sourceData) {
        const count = Array.isArray(sourceData) ? sourceData.length : 1;

        for (let i = 0; i < count; i++) {
          const item: any = {};
          let hasData = false;

          for (const [targetField, sourceKey] of fieldEntries) {
            const val = Array.isArray(body[sourceKey])
              ? body[sourceKey][i]
              : body[sourceKey];
            item[targetField] = val;
            if (val) hasData = true;
          }

          if (hasData) zipped.push(item);
        }
      }

      if (targetKey.includes(".")) {
        setPath(processedBody, targetKey, zipped);
      } else {
        processedBody[targetKey] = zipped;
      }
    }
  }

  /**
   * Optionally transforms the schema into a deep partial variant
   * to accommodate partial form updates.
   */
  let finalSchema = schema;
  if (options?.partial && "deepPartial" in (finalSchema as any)) {
    finalSchema = (finalSchema as any).deepPartial();
  }

  return finalSchema.parse(processedBody);
}
