import _ from "lodash";

export const generateMessageTemplate = (payload: {
	subjectType: string;
	subjectName: string;
	actorFirstName: string;
	actorLastName: string;
}): string => {
	// this converts string like "BUSINESS_FUNCTION" to "business function"
	const formattedSubjectType = _.toLower(payload.subjectType);
	const actorFullName = _.join(
		[
			_.startCase(_.toLower(payload.actorLastName)),
			_.startCase(_.toLower(payload.actorFirstName)),
		],
		" ",
	);

	return `A new ${formattedSubjectType}, "${payload.subjectName}" was just created by ${actorFullName}.`;
};
