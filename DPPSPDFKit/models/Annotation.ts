export interface IAnnotation {
    subject: string;
    annotationId: string;
    description: string;
    fileName: string;
    modifiedOn: Date;
    documentBody?: string;
}

export class Annotation implements IAnnotation {
    annotationId: string;
    subject: string;
    description: string;
    fileName: string;
    modifiedOn: Date;
    documentBody?: string;

    constructor(params: IAnnotation) {
        this.subject = params.subject;
        this.annotationId = params.annotationId;
        this.description = params.description;
        this.fileName = params.fileName;
        this.modifiedOn = params.modifiedOn;
        this.documentBody = params.documentBody;
    }
}