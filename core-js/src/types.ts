// EntryType represents the type of an entry
export type EntryType =
  | "text"
  | "markdown"
  | "metrics"
  | "media_ref"
  | "event"
  | "log";

export interface NewEntry {
  type: EntryType;
  tags?: string[];
  source?: string;
  device_id?: string;
  meta?: Record<string, unknown>;
  payload?: unknown;
}

export interface Entry {
  id: string;
  type: EntryType;
  created_at: string; // ISO8601
  updated_at: string; // ISO8601
  schema_version: number;
  tags?: string[];
  source?: string;
  device_id?: string;
  meta?: Record<string, unknown>;
  payload?: unknown;
}

export interface QueryFilter {
  time?: { from?: string; to?: string };
  type?: EntryType;
  tags?: string[];
}

export interface Pagination {
  limit?: number;
  offset?: number;
}

// Validation errors
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export function validateNewEntry(entry: NewEntry): void {
  if (!entry.type) {
    throw new ValidationError("Entry type is required");
  }

  // Validate entry type
  const validTypes: EntryType[] = [
    "text",
    "markdown",
    "metrics",
    "media_ref",
    "event",
    "log",
  ];

  if (!validTypes.includes(entry.type)) {
    throw new ValidationError("Invalid entry type");
  }

  // Validate tags
  if (entry.tags) {
    if (entry.tags.length > 20) {
      throw new ValidationError("Too many tags (maximum 20)");
    }
    for (const tag of entry.tags) {
      if (tag.length > 50) {
        throw new ValidationError("Tag too long (maximum 50 characters)");
      }
    }
  }

  // Validate source
  if (entry.source && entry.source.length > 50) {
    throw new ValidationError("Source too long (maximum 50 characters)");
  }

  // Validate device_id
  if (entry.device_id && entry.device_id.length > 100) {
    throw new ValidationError("Device ID too long (maximum 100 characters)");
  }

  // Validate meta
  if (entry.meta) {
    if (entry.meta.confidence !== undefined) {
      if (
        typeof entry.meta.confidence !== "number" ||
        entry.meta.confidence < 0 ||
        entry.meta.confidence > 1
      ) {
        throw new ValidationError(
          "Confidence must be a number between 0 and 1",
        );
      }
    }

    if (entry.meta.visibility !== undefined) {
      const validVisibility = ["public", "private", "friends"];
      if (
        typeof entry.meta.visibility !== "string" ||
        !validVisibility.includes(entry.meta.visibility)
      ) {
        throw new ValidationError("Invalid visibility value");
      }
    }

    if (entry.meta.sensitivity !== undefined) {
      const validSensitivity = ["low", "medium", "high"];
      if (
        typeof entry.meta.sensitivity !== "string" ||
        !validSensitivity.includes(entry.meta.sensitivity)
      ) {
        throw new ValidationError("Invalid sensitivity value");
      }
    }
  }

  // Validate payload is not empty
  if (entry.payload === undefined || entry.payload === null) {
    throw new ValidationError("Payload is required");
  }
}
