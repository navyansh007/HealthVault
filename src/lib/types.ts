export type DocumentCategory =
  | 'prescription'
  | 'lab_report'
  | 'vaccination'
  | 'discharge_summary'
  | 'insurance'
  | 'scan'
  | 'other';

export const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  prescription: 'Prescription',
  lab_report: 'Lab Report',
  vaccination: 'Vaccination',
  discharge_summary: 'Discharge Summary',
  insurance: 'Insurance',
  scan: 'Scan / Imaging',
  other: 'Other',
};

export const CATEGORY_ORDER: DocumentCategory[] = [
  'prescription',
  'lab_report',
  'vaccination',
  'discharge_summary',
  'scan',
  'insurance',
  'other',
];

export type FileKind = 'image' | 'pdf';

/** Everything about a document that is encrypted on-device before it leaves the phone. */
export interface DocumentMetadata {
  title: string;
  category: DocumentCategory;
  date: string; // ISO date the document is dated (not the upload time)
  fileKind: FileKind;
  mimeType?: string;
  fileName?: string;
  facility?: string;
  notes?: string;
}

export interface VaultDocument extends DocumentMetadata {
  id: string;
  cid: string; // IPFS content id of the encrypted file
  sizeBytes: number;
  wrappedKey: string; // document key, wrapped with the master key
  addedAt: string; // ISO timestamp of when it entered the vault
}

export interface PatientProfile {
  name: string;
  dob: string; // ISO date
  gender: 'Male' | 'Female' | 'Other';
  bloodGroup: string;
  phone: string; // 10 digits
  address: string;
}

export interface UploadDraft {
  uri: string;
  fileKind: FileKind;
  mimeType?: string;
  fileName?: string;
}
