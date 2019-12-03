export interface IAnnotation {
    subject: string;
    annotationId: string;
    description: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    documentBody: string;
    createdBy: string;
    modifiedOn: Date;
    entityImageUrl: string;
}

export class Annotation implements IAnnotation {
    subject: string;
    annotationId: string;
    description: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    documentBody: string;
    createdBy: string;
    modifiedOn: Date;
    entityImageUrl: string;

    constructor(params: IAnnotation) {
        this.subject = params.subject;
        this.annotationId = params.annotationId;
        this.description = params.description;
        this.fileName = params.fileName;
        this.fileType = params.fileType;
        this.fileSize = params.fileSize;
        this.documentBody = params.documentBody;
        this.createdBy = params.createdBy;
        this.modifiedOn = params.modifiedOn;
        this.entityImageUrl = params.entityImageUrl;
    }
}