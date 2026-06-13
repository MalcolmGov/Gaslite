// Stub — Replit Object Storage is not available on Vercel.
// File upload endpoints will return 503 until replaced with Vercel Blob or S3.

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

export class ObjectStorageService {
  getPublicObjectSearchPaths(): string[] { return []; }
  getPrivateObjectDir(): string { return ""; }
  async searchPublicObject(_filePath: string) { return null; }
  async downloadObject(_file: any, res: any) {
    res.status(503).json({ error: "File storage not available" });
  }
  async getObjectEntityUploadURL(): Promise<string> {
    throw new Error("File upload not available on this deployment");
  }
  normalizeObjectEntityPath(rawPath: string): string { return rawPath; }
  async trySetObjectEntityAclPolicy(rawPath: string, _policy: any): Promise<string> { return rawPath; }
  async getObjectEntityFile(_objectPath: string): Promise<any> { throw new ObjectNotFoundError(); }
  async canAccessObjectEntity(_opts: any): Promise<boolean> { return false; }
}

export const objectStorageClient = {};
