// TODO: implement this in the infrastructure layer
interface ReferenceNumberServicePort {
    generate(): Promise<{refNum: string}>
}

export type {ReferenceNumberServicePort};