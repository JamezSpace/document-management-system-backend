import type { DispatchDocumentPort } from "../../../shared/application/port/intersubsystem/DispatchDocument.port.js";
import type { DispatchStaffPort } from "../../../shared/application/port/intersubsystem/DispatchStaff.port.js";
import type { IdGeneratorPort } from "../../../shared/application/port/services/IdGenerator.port.js";
import type { TransactionManager } from "../../../shared/application/port/TransactionManager.port.js";
import ApplicationError from "../../../shared/errors/ApplicationError.error.js";
import { ApplicationErrorEnum } from "../../../shared/errors/enum/application.enum.js";
import DispatchRecord from "../../domain/entities/DispatchRecord.js";
import type { InboxEntryRepositoryPort } from "../port/repos/InboxEntryRepository.port.js";
import { DispatchStatus } from "../../domain/enum/dispatchStatus.enum.js";
import { DispatchType } from "../../domain/enum/dispatchType.enum.js";
import type { DispatchRecordRepositoryPort } from "../port/repos/DispatchRecordRepository.port.js";
import type { RecipientResolverPort } from "../port/services/RecipientResolver.port.js";
import InboxEntry from "../../domain/entities/InboxEntry.js";
import { InboxEntryStatus } from "../../domain/enum/inboxEntryStatus.enum.js";
import type { DispatchRecordEvents } from "../port/events/DispatchRecordEvents.port.js";

class SendCorrespondenceUseCase {
	constructor(
		private readonly idGenerator: IdGeneratorPort,
		private readonly dispatchDocumentPort: DispatchDocumentPort,
		private readonly dispatchRecordRepo: DispatchRecordRepositoryPort,
		private readonly dispatchStaffRepo: DispatchStaffPort,
		private readonly inboxRepo: InboxEntryRepositoryPort,
		private readonly recipientResolver: RecipientResolverPort,
		private readonly dispatchEvents: DispatchRecordEvents,
		private readonly transactionManager: TransactionManager,
	) {}

	async execute(input: { docId: string; actorId: string }) {
		const result = await this.transactionManager.execute(
			async (transactionInstance) => {
				const doc = await this.dispatchDocumentPort.getDocumentById(
					input.docId,
					transactionInstance,
				);

				if (!doc)
					throw new ApplicationError(
						ApplicationErrorEnum.DOCUMENT_NOT_FOUND,
						{ message: "Document not found for dispatch" },
					);

				if (!doc.isDispatchable())
					throw new ApplicationError(
						ApplicationErrorEnum.NOT_ALLOWED,
						{ message: "Document is not valid to be dispatched" },
					);

				// this is redundant right now, given document addressee is in the core document, however this is left here solely for the case of dispatching a document to multiple designations. In that case, 'getDocAddresseeByDocIdMultiple' should be employed

				// const docAddressee =
				// 	await this.dispatchDocumentPort.getDocAddresseeByDocIdSingle(
				// 		doc.id,
				// 		transactionInstance,
				// 	);

				const senderDetails =
					await this.dispatchStaffRepo.getStaffDetailsById(
						doc.ownerId,
						transactionInstance,
					);

				// create dispatch record (intent only)
				const dispatch = new DispatchRecord({
					id: `D-RCD-${this.idGenerator.generate()}`,
					documentId: doc.id,

					senderStaffId: input.actorId,
					senderDesignationId: senderDetails.designationId,
					senderUnitId: senderDetails.unitId,

					recipientDesignationId:
						doc.addressee.addressedToDesignationId,
					recipientUnitId: doc.addressee.recipientUnitId,

					dispatchType: DispatchType.DIRECT,
					status: DispatchStatus.PENDING,

					dispatchedAt: new Date(),
					parentDispatchId: null,
				});

				await this.dispatchRecordRepo.save(
					dispatch,
					transactionInstance,
				);

				// resolving actual staff
				const recipients =
					await this.recipientResolver.resolveRecipients({
						documentId: doc.id,
					});

				if (recipients.length === 0)
					throw new ApplicationError(
						ApplicationErrorEnum.NOT_ALLOWED,
						{
							message: "No recipients resolved",
						},
					);

				// create inbox entries
				const inboxEntries = recipients.map(
					(r) =>
						new InboxEntry({
							id: `INBX-${this.idGenerator.generate()}`,
							dispatchId: dispatch.id,
							documentId: doc.id,

							staffId: r.staffId,
							designationId: r.designationId,
							unitId: r.unitId,

							status: InboxEntryStatus.UNREAD,
							receivedAt: new Date(),
						}),
				);

				await this.inboxRepo.saveMany(
					inboxEntries,
					transactionInstance,
				);

				return {
					dispatchRecord: dispatch,
					documentDispatched: doc,
					sender: senderDetails,
					recipients: recipients.map((r) => r.staffId),
				};
			},
		);

		await this.dispatchEvents.documentDispatched({
			document: {
				id: result.documentDispatched.id,
				type: result.documentDispatched.classification.documentTypeId,
				title: result.documentDispatched.title,
			},
			sender: {
				id: result.documentDispatched.ownerId,
                name: result.sender.fullName,
                officeName: result.sender.officeName
			},
			recipients: result.recipients,
		});

		return result.dispatchRecord;
	}
}

export default SendCorrespondenceUseCase;
