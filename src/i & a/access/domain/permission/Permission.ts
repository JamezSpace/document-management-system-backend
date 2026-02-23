class Permission {
  private constructor(private readonly value: string) {}

  public static readonly CREATE_DOCUMENT = new Permission("CREATE_DOCUMENT");
  public static readonly SUBMIT_DOCUMENT = new Permission("SUBMIT_DOCUMENT");
  public static readonly APPROVE_DOCUMENT = new Permission("APPROVE_DOCUMENT");
  public static readonly REJECT_DOCUMENT = new Permission("REJECT_DOCUMENT");
  public static readonly ARCHIVE_DOCUMENT = new Permission("ARCHIVE_DOCUMENT");

  public equals(other: Permission): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}

export default Permission;
