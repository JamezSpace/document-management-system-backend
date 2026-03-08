import { Type, type Static } from "@fastify/type-provider-typebox";
import { EmploymentType, Status } from "../../../domain/enum/staff.enum.js";

const createStaffSchema = Type.Object({
    identityId: Type.String(),
	staffNumber: Type.Number(),
	employmentType: Type.Enum(EmploymentType),
	unitId: Type.String(),
	officeId: Type.String(),
	designationId: Type.String(),
	status: Type.Enum(Status)
})

const registerStaffSchema = Type.Object({
    firstName: Type.String(),
  lastName: Type.String(),
  middleName: Type.String(),
  email: Type.String(),
  phoneNumber: Type.String(),

	staffNumber: Type.Number(),
	employmentType: Type.Enum(EmploymentType),
	unitId: Type.String(),
	officeId: Type.String(),
	designationId: Type.String()
})

const staffIdSchema = Type.Object({
    staffId: Type.String()
})

enum StaffMediaRequester {
    ME = 'me',
    OTHER = 'other'
}

const staffMediaNeededBySchema = Type.Object({
    requestMadeBy: Type.String()
})

const unitIdSchema = Type.Object({
    unitId: Type.Enum(StaffMediaRequester)
})

const editStaffSchema = Type.Partial(createStaffSchema)


type CreateStaffType = Static<typeof createStaffSchema>;
type RegisterStaffType = Static<typeof registerStaffSchema>;
type EditStaffType = Static<typeof editStaffSchema>;
type StaffIdType = Static<typeof staffIdSchema>
type UnitIdType = Static<typeof unitIdSchema>
type StaffMediaNeededByType = Static<typeof staffMediaNeededBySchema>

export {
    createStaffSchema, editStaffSchema, registerStaffSchema, staffIdSchema, staffMediaNeededBySchema, StaffMediaRequester, unitIdSchema, type CreateStaffType, type EditStaffType, type RegisterStaffType, type StaffIdType, type StaffMediaNeededByType, type UnitIdType
};

