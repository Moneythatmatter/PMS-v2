/** Allowed types and size limit for a file upload. */
export interface FileRule {
  /** Lowercase extensions without the dot. */
  extensions: string[];
  maxMB: number;
}

const MIME_BY_EXT: Record<string, string[]> = {
  pdf: ["application/pdf"],
  jpg: ["image/jpeg"],
  jpeg: ["image/jpeg"],
  png: ["image/png"],
  webp: ["image/webp"],
  doc: ["application/msword"],
  docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  xls: ["application/vnd.ms-excel"],
  xlsx: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  csv: ["text/csv", "application/vnd.ms-excel", "text/plain", "application/csv"],
};

export const FILE_RULES = {
  /** Photos stored inline (room / work-order / profile photos). */
  photo: { extensions: ["jpg", "jpeg", "png", "webp"], maxMB: 2 },
  /** Maintenance evidence: photo or scanned PDF. */
  evidence: { extensions: ["jpg", "jpeg", "png", "webp", "pdf"], maxMB: 2 },
  /** Guest ID proofs and supporting documents. */
  idDocument: { extensions: ["jpg", "jpeg", "png", "pdf"], maxMB: 5 },
  /** HR employee documents (Aadhaar, PAN, resume, offer letter). */
  hrDocument: { extensions: ["pdf", "jpg", "jpeg", "png", "doc", "docx"], maxMB: 5 },
  /** Complaint supporting proof. */
  complaintProof: { extensions: ["pdf", "jpg", "jpeg", "png"], maxMB: 5 },
  /** Lead import sheets. */
  csv: { extensions: ["csv"], maxMB: 2 },
} satisfies Record<string, FileRule>;

/** Value for an `<input type="file" accept>` attribute. */
export function fileAccept(rule: FileRule): string {
  const mimes = rule.extensions.flatMap((ext) => MIME_BY_EXT[ext] ?? []);
  return [...new Set([...rule.extensions.map((ext) => `.${ext}`), ...mimes])].join(",");
}

/** Short user-facing hint, e.g. "JPG, PNG, PDF · max 5 MB". */
export function fileRuleHint(rule: FileRule): string {
  const types = [...new Set(rule.extensions.map((ext) => (ext === "jpeg" ? "jpg" : ext).toUpperCase()))];
  return `${types.join(", ")} · max ${rule.maxMB} MB`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Returns an error message, or null when the file satisfies the rule. */
export function validateFile(file: File, rule: FileRule): string | null {
  const ext = (file.name.split(".").pop() ?? "").toLowerCase();
  const allowedMimes = rule.extensions.flatMap((e) => MIME_BY_EXT[e] ?? []);
  const typeLabel = fileRuleHint(rule).split(" · ")[0];
  if (!rule.extensions.includes(ext) || (file.type && !allowedMimes.includes(file.type))) {
    return `"${file.name}" is not an allowed file type. Upload ${typeLabel} only.`;
  }
  if (file.size === 0) return `"${file.name}" is empty.`;
  if (file.size > rule.maxMB * 1024 * 1024) {
    return `"${file.name}" is ${formatFileSize(file.size)}. Maximum size is ${rule.maxMB} MB.`;
  }
  return null;
}
