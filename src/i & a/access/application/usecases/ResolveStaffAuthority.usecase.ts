import type { RoleAssignmentRepositoryPort } from "../ports/RoleAssignmentsRepository.port.js";

class ResolveStaffAuthority {
  constructor(
    private readonly roleAssignmentRepo: RoleAssignmentRepositoryPort
  ) {}

  async execute(staffId: string) {
    const assignments =
      await this.roleAssignmentRepo.findRoleAssignmentsByStaffId(staffId);

    const active = assignments.filter(a => a.isActive());

    const capabilities = new Set<string>();
    const roles: string[] = [];

    active.forEach(a => {
      roles.push(a.role.name);

      a.role.getPermissions().forEach(p => {
        capabilities.add(p.getCode());
      });
    });

    return {
      roles,
      capabilities: Array.from(capabilities)
    };
  }
}

export default ResolveStaffAuthority;