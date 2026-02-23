interface IntegrityMetadata {
  fileName: string
  mimeType: string
  fileSize: number
  checksum: string      // SHA-256 recommended
  storageLocation: string

  createdAt: Date
  createdByUserId: string

  lastModifiedAt: Date
  lastModifiedByUserId: string
}

export type {IntegrityMetadata};