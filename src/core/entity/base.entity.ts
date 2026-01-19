export type BaseEntityProps = {
    id: string;
    createdAt: Date
    updatedAt: Date
}

export abstract class BaseEntity {
    protected readonly id: BaseEntityProps['id'];
    protected createdAt: BaseEntityProps['createdAt'];
    protected updatedAt: BaseEntityProps['updatedAt'];

    constructor(parameters: BaseEntityProps) {
        this.id = parameters.id;
        this.createdAt = parameters.createdAt;
        this.updatedAt = parameters.updatedAt;
    }

    abstract serialize(): Record<string, unknown>;

    getId(): string {
        return this.id
    }

    getCreatedAt(): Date {
        return this.createdAt;
    }

    getUpdatedAt(): Date {
        return this.updatedAt;
    }
}