import { library, dom } from "@fortawesome/fontawesome-svg-core";
import { faFilePdf } from "@fortawesome/free-regular-svg-icons";

// We are only using the file-pdf icon
library.add(faFilePdf);

// Replace any existing <i> tags with <svg> and set up a MutationObserver to
// continue doing this as the DOM changes.
dom.watch();

import { IInputs, IOutputs } from "./generated/ManifestTypes";
import { Annotation } from "./models/Annotation";

const PSPDFKit = require("pspdfkit");

export class DPPSPDFKit implements ComponentFramework.StandardControl<IInputs, IOutputs> {
    // reference to the component container HTMLDivElement
    // This element contains all elements of our code component example
    private _container: HTMLDivElement;

    // pspdfkit container
    private _psPdfKitContainer: HTMLDivElement;

    // reference to PowerApps component framework Context object
    private _context: ComponentFramework.Context<IInputs>;
   
    // no annotations found label element
    private _noAnnotationsFoundLabelElement: HTMLLabelElement;

    // array of annotations with PDF attachments
    private _annotations: Array<Annotation> = [];

    // PSPDFKit License Key
    private _psPdfKitLicenseKey: string;

    // modal
    private _divModal: HTMLDivElement;

    // modal title
    private _h5ModalTitle: HTMLHeadingElement;

	/**
	 * Empty constructor.
	 */
    constructor() {

    }

	/**
	 * Used to initialize the control instance. Controls can kick off remote server calls and other initialization actions here.
	 * Data-set values are not initialized here, use updateView.
	 * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to property names defined in the manifest, as well as utility functions.
	 * @param notifyOutputChanged A callback method to alert the framework that the control has new outputs ready to be retrieved asynchronously.
	 * @param state A piece of data that persists in one session for a single user. Can be set at any point in a controls life cycle by calling 'setControlState' in the Mode interface.
	 * @param container If a control is marked control-type='standard', it will receive an empty div element within which it can render its content.
	 */
    public init(context: ComponentFramework.Context<IInputs>, notifyOutputChanged: () => void, state: ComponentFramework.Dictionary, container: HTMLDivElement) {
        this._context = context;
        this._psPdfKitLicenseKey = context.parameters.psPdfKitLicenseKey.raw ? context.parameters.psPdfKitLicenseKey.raw : "";
        this._container = document.createElement("div");

        //// font awesome test
        //let faDiv = document.createElement("div");
        //let faIcon = document.createElement("i");
        //faIcon.classList.add("far", "fa-file-pdf", "fa-9x");
        //faDiv.appendChild(faIcon);
        //this._container.appendChild(faDiv);
        
        // get annotations with pdf attachments
        this.initializeAnnotations();
        this.initializePsPdfKitModal();

        container.appendChild(this._container);
    }

    private initializePsPdfKitModal() {
        let btnCloseModal = <HTMLButtonElement>this.createHtmlElement("button", "btn", "btn-secondary");
        btnCloseModal.type = "button";
        btnCloseModal.innerText = "Close";
        btnCloseModal.onclick = (evt) => { this._divModal.classList.add("hidden"); };

        let divModalFooter = <HTMLDivElement>this.createHtmlElement("div", "modal-footer");
        divModalFooter.appendChild(btnCloseModal);

        // add PSPDFKit container
        this._psPdfKitContainer = document.createElement("div");
        this._psPdfKitContainer.id = "pspdfkit";

        let divModalBody = <HTMLDivElement>this.createHtmlElement("div", "modal-body");
        divModalBody.appendChild(this._psPdfKitContainer);

        let spanCloseModal = document.createElement("span");
        spanCloseModal.setAttribute("aria-hidden", "true");
        spanCloseModal.innerText = "x";

        let btnHeaderCloseModal = <HTMLButtonElement>this.createHtmlElement("button", "close");
        btnHeaderCloseModal.type = "button";
        btnHeaderCloseModal.setAttribute("data-dismiss", "modal");
        btnHeaderCloseModal.setAttribute("area-label", "Close");
        btnHeaderCloseModal.onclick = (evt) => { this._divModal.classList.add("hidden"); };
        btnHeaderCloseModal.appendChild(spanCloseModal);

        // make this global
        this._h5ModalTitle = <HTMLHeadingElement>this.createHtmlElement("h5", "modal-title");
        this._h5ModalTitle.id = "pdfModalTitle";
        this._h5ModalTitle.innerText = "PDF Viewer";

        let divModalHeader = <HTMLDivElement>this.createHtmlElement("div", "modal-header");
        divModalHeader.appendChild(this._h5ModalTitle);
        divModalHeader.appendChild(btnHeaderCloseModal);

        let divModalContent = <HTMLDivElement>this.createHtmlElement("div", "modal-content");
        divModalContent.appendChild(divModalHeader);
        divModalContent.appendChild(divModalBody);
        divModalContent.appendChild(divModalFooter);

        let divModalDialog = <HTMLDivElement>this.createHtmlElement("div", "modal-dialog", "modal-xl", "modal-dialog-centered");
        divModalDialog.setAttribute("role", "document");
        divModalDialog.appendChild(divModalContent);

        this._divModal = <HTMLDivElement>this.createHtmlElement("div", "modal", "hidden");
        this._divModal.id = "pdfModal";
        this._divModal.tabIndex = -1;
        this._divModal.setAttribute("role", "dialog");
        this._divModal.setAttribute("aria-labelledby", "pdfModalTitle");
        this._divModal.setAttribute("aria-hidden", "true");
        this._divModal.appendChild(divModalDialog);
        
        //this._container.appendChild(this._divModal);
        document.body.appendChild(this._divModal);
    }

    private async initializeAnnotations() {
        const recordLogicalName = (<any>this._context).page.entityTypeName;
        const recordId = (<any>this._context).page.entityId;

        let annotations = await this.getAnnotations(recordId, recordLogicalName);
        
        if (annotations.length) {
            let cards = annotations.map(a => this.createCard(a));
            let divGridCards = <HTMLDivElement>this.createHtmlElement("div", "row");
            cards.forEach(c => divGridCards.appendChild(c));
            this._container.appendChild(divGridCards);
            this._annotations.push(...annotations);
        }
        else {
            this._noAnnotationsFoundLabelElement = document.createElement("label");
            this._noAnnotationsFoundLabelElement.id = "lblNoAnnoFound";
            this._noAnnotationsFoundLabelElement.innerHTML = "No Annotations Found";
            this._container.appendChild(this._noAnnotationsFoundLabelElement);
        }
    }

    private createHtmlElement(tag: string, ...classes: Array<string>): HTMLElement {
        let ele = document.createElement(tag);
        ele.classList.add(...classes);
        return ele;
    }

    private createCard(anno: Annotation): HTMLElement {
        let divColMb4 = <HTMLDivElement>this.createHtmlElement("div", "col", "mb-4");
        let divCard = <HTMLDivElement>this.createHtmlElement("div", "card");
        let divCardBody = <HTMLDivElement>this.createHtmlElement("div", "card-body", "h-100", "hide-on-hover");
        let h5CardTitle = <HTMLHeadingElement>this.createHtmlElement("h5", "card-title");
        let pCardText = <HTMLParagraphElement>this.createHtmlElement("p", "card-text");
        let ulListGroup = <HTMLUListElement>this.createHtmlElement("ul", "list-group", "list-group-flush");
        let liListGroupItemFileName = <HTMLLIElement>this.createHtmlElement("li", "list-group-item");
        let liListGroupItemModifiedDate = <HTMLLIElement>this.createHtmlElement("li", "list-group-item");
        //let divCardFooter = <HTMLDivElement>this.createHtmlElement("div", "card-footer");
        //let btnView = <HTMLButtonElement>this.createHtmlElement("button", "btn", "btn-primary", "btn-lg", "btn-block");
        let divCardBodyHover = <HTMLDivElement>this.createHtmlElement("div", "card-body", "h-100", "show-on-hover");
        let divHoverTitle = <HTMLHeadingElement>this.createHtmlElement("h5", "card-title");
        let divHoverIcon = this.createHtmlElement("i", "far", "fa-file-pdf");
        let pHoverText = <HTMLParagraphElement>this.createHtmlElement("p", "card-text");

        divCard.onmouseenter = () => { divCard.classList.add("hover"); };
        divCard.onmouseleave = () => { divCard.classList.remove("hover"); };

        h5CardTitle.innerText = anno.subject;
        pCardText.innerText = anno.description;
        liListGroupItemFileName.innerText = anno.fileName;
        liListGroupItemModifiedDate.innerText = anno.modifiedOn.toLocaleDateString();
        pHoverText.innerText = "View PDF";

        divCardBodyHover.onclick = (e) => {
            this.selectAnnotation(anno.annotationId);
        };

        //btnView.type = "button";
        //btnView.innerText = "View PDF";
        //btnView.value = anno.annotationId;
        //btnView.setAttribute("data-toggle", "modal");
        //btnView.setAttribute("data-target", "#pdfModal");
        //btnView.onclick = (e) => {
        //    this.selectAnnotation(e);
        //};

        divHoverTitle.appendChild(divHoverIcon);
        divCardBodyHover.appendChild(divHoverTitle);
        divCardBodyHover.appendChild(pHoverText);
        //divCardFooter.appendChild(btnView);
        ulListGroup.appendChild(liListGroupItemFileName);
        ulListGroup.appendChild(liListGroupItemModifiedDate);
        divCardBody.appendChild(h5CardTitle);
        divCardBody.appendChild(pCardText);
        divCard.appendChild(divCardBody);
        divCard.appendChild(divCardBodyHover);
        divCard.appendChild(ulListGroup);
        //divCard.appendChild(divCardFooter);
        divColMb4.appendChild(divCard);

        return divColMb4;
    }

    public async selectAnnotation(id: string) {
        // unload pspdfkit container
        PSPDFKit.unload("#pspdfkit");

        const annotation = this._annotations.find(a => a.annotationId === id);
        if (annotation) {
            if (!annotation.documentBody) {
                annotation.documentBody = await this.getPdfFile(annotation.annotationId);
            }
            this._h5ModalTitle.innerText = annotation.fileName;
            this._divModal.classList.remove("hidden");
            this.load(annotation.documentBody);
        }
        else {
            // make this a toast
            alert(`annotation ${id} not found!`);
        }
    }

    private load(pdf: string): void {
        console.log(`converting pdf to ArrayBuffer...`);
        const binaryString = atob(pdf);
        const bytes = new Uint8Array(pdf.length);
        for (var i = 0; i < pdf.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        const pdfToDisplay = bytes.buffer;

        console.log(`Loading pdf...`);
        PSPDFKit.load({
            disableWebAssemblyStreaming: true,
            pdf: pdfToDisplay,
            container: "#pspdfkit",
            licenseKey: this._psPdfKitLicenseKey,
            baseUrl: ""
        })
        .then((instance: any) => {
            instance.addEventListener("annotations.change", () => {
                console.log(`pdf loaded!`);
            });
        })
        .catch(console.error);
    }

	/**
	 * Called when any value in the property bag has changed. This includes field values, data-sets, global values such as container height and width, offline status, control metadata values such as label, visible, etc.
	 * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to names defined in the manifest, as well as utility functions
	 */
    public updateView(context: ComponentFramework.Context<IInputs>): void {
        this._context = context;
        this._psPdfKitLicenseKey = context.parameters.psPdfKitLicenseKey.raw ? context.parameters.psPdfKitLicenseKey.raw : "";
    }

	/** 
	 * It is called by the framework prior to a control receiving new data. 
	 * @returns an object based on nomenclature defined in manifest, expecting object[s] for property marked as “bound” or “output”
	 */
    public getOutputs(): IOutputs {
        return {};
    }

	/** 
	 * Called when the control is to be removed from the DOM tree. Controls should use this call for cleanup.
	 * i.e. cancelling any pending remote calls, removing listeners, etc.
	 */
    public destroy(): void {
        // Add code to cleanup control if necessary
        
    }

    /**
     * Get annotations with pdf attachments
     * @param recordId
     * @param recordLogicalName
     */
    private getAnnotations(recordId: string, recordLogicalName: string): Promise<Array<Annotation>> {
        // if running on local machine then return test annotation
        if (!(this._context as any).orgSettings.uniqueName) {
            const samplePdf = this._context.resources.getString("DrewPfeif_Sample_PDF");
            let annos: Array<Annotation> = [];
            for (var i = 0; i < 10; i++) {
                annos.push(new Annotation({
                    annotationId: `anno${i}`,
                    description: `my note ${i}`,
                    documentBody: samplePdf,
                    fileName: `And a one and a two SamplePdf_${i}.pdf`,
                    modifiedOn: new Date(),
                    subject: `my note ${i}`
                }));
            }
            
            return Promise.resolve(annos);
        }
        else {
            const query =
                "?$select=annotationid,subject,notetext,filename,modifiedon" +
                "&$filter=filename ne null and mimetype eq 'application/pdf' and _objectid_value eq " + recordId +
                " and objecttypecode eq '" + recordLogicalName + "' &$orderby=createdon desc";

            return this._context.webAPI.retrieveMultipleRecords("annotation", query).then(
                function success(result) {
                    const annotations = result.entities.map(ent => {
                        return new Annotation({
                            annotationId: ent["annotationid"].toString(),
                            subject: ent["subject"] ? ent["subject"].toString() : "",
                            description: ent["notetext"] ? ent["notetext"].toString() : "",
                            fileName: ent["filename"],
                            modifiedOn: new Date(ent["modifiedon"])
                        });
                    });
                    return annotations;
                }
                , function (error) {
                    console.log(error.message);
                    return [];
                }
            );
        }
    }

    private getPdfFile(annotationId: string): Promise<string> {
        const query = "?$select=documentbody";

        return this._context.webAPI.retrieveRecord("annotation", annotationId, query).then(
            function success(result) {
                return result["documentbody"].toString();
            }
            , function (error) {
                console.log(error.message);
                return null;
            }
        );
    }
}