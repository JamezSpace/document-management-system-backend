import _ from "lodash";

export const generateMessageTemplate = (payload: {
	eventType: string;
	subjectType: string;
	subjectName: string;
	actorFirstName?: string | null;
	actorLastName?: string | null;
}): string => {
	const formattedSubjectType = _.toLower(payload.subjectType);

	const actorFullName =
		payload.actorFirstName && payload.actorLastName
			? _.join(
					[
						_.startCase(_.toLower(payload.actorLastName)),
						_.startCase(_.toLower(payload.actorFirstName)),
					],
					" ",
			  )
			: null;

	switch (payload.eventType) {
		case "BUSINESS_FUNCTION_CREATED":
			return `A new ${formattedSubjectType}, "${payload.subjectName}" was created${
				actorFullName ? ` by ${actorFullName}` : ""
			}.`;

		case "WORKFLOW_TASKS_ASSIGNED":
			return `You have a pending ${formattedSubjectType} task: "${payload.subjectName}".`;

		case "DOCUMENT_SUBMITTED":
			return `A document "${payload.subjectName}" has been submitted for review${
				actorFullName ? ` by ${actorFullName}` : ""
			}.`;

		default:
			return `${_.startCase(payload.eventType)} occurred on "${payload.subjectName}".`;
	}
};