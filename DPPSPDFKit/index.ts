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

    // Event Handler 'selectAnnotation' reference
    private _selectAnnotation: EventListenerOrEventListenerObject;
    // Event Handler 'refreshList' reference
    private _refreshList: EventListenerOrEventListenerObject;

    // drop down list of annotations
    private _headerContainer: HTMLDivElement;
    private _dropDownElement: HTMLSelectElement;

    // refresh button
    private _refreshButtonElement: HTMLButtonElement;

    // no annotations found label element
    private _noAnnotationsContainer: HTMLDivElement;
    private _noAnnotationsFoundLabelElement: HTMLLabelElement;

    // array of annotations with PDF attachments
    private _annotations: Array<Annotation> = [];

    // PSPDFKit License Key
    private _psPdfKitLicenseKey: string;


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
        this._selectAnnotation = this.selectAnnotation.bind(this);
        this._refreshList = this.refreshList.bind(this);

        // add drop down list
        this._headerContainer = document.createElement("div");
        this._headerContainer.id = "divHeader";
        this._dropDownElement = document.createElement("select");
        this._dropDownElement.id = "ddAnnotations";
        this._dropDownElement.className = "dd-annotations";
        this._dropDownElement.options.add(new Option("Select a PDF to display", ""));
        this._dropDownElement.addEventListener("change", this._selectAnnotation);
        this._headerContainer.appendChild(this._dropDownElement);
        this._refreshButtonElement = document.createElement("button");
        this._refreshButtonElement.id = "btnRefresh";
        this._refreshButtonElement.innerText = "Refresh";
        this._refreshButtonElement.addEventListener("click", this._refreshList);
        this._headerContainer.appendChild(this._refreshButtonElement);
        this._container.appendChild(this._headerContainer);

        // add hidden label
        this._noAnnotationsContainer = document.createElement("div");
        this._noAnnotationsContainer.hidden = true;
        this._noAnnotationsFoundLabelElement = document.createElement("label");
        this._noAnnotationsFoundLabelElement.id = "lblNoAnnoFound";
        this._noAnnotationsFoundLabelElement.innerHTML = "No Annotations Found";
        this._noAnnotationsContainer.appendChild(this._noAnnotationsFoundLabelElement);
        this._container.appendChild(this._noAnnotationsContainer);

        // add PSPDFKit container
        this._psPdfKitContainer = document.createElement("div");
        this._psPdfKitContainer.id = "pspdfkit";
        this._psPdfKitContainer.classList.add("hidden");
        this._container.appendChild(this._psPdfKitContainer);

        // get annotations with pdf attachments
        this.initializeAnnotations();

        container.appendChild(this._container);
    }

    private async initializeAnnotations() {
        const recordLogicalName = (<any>this._context).page.entityTypeName;
        const recordId = (<any>this._context).page.entityId;

        let annotations = await this.getAnnotations(recordId, recordLogicalName);

        // clear any existing options
        let currentOptions: Array<string> = [];
        const optionsLength = this._dropDownElement.options.length;
        for (var i = 0; i < optionsLength; i++) {
            const opt = this._dropDownElement.options.item(i);
            if (opt) {
                currentOptions.push(opt.value);
            }
        }

        if (annotations.length) {
            this._noAnnotationsContainer.hidden = true;

            annotations.forEach(a => {
                // add to drop down list only if it isn't in the list
                if (!currentOptions.find(c => c === a.annotationId)) {
                    this._dropDownElement.options.add(new Option(`${a.fileName}.${a.fileType}`, a.annotationId));
                    this._annotations.push(a);
                }
            });

            // remove options from the drop down list if they are not found in this._annotations
            for (var i = this._dropDownElement.options.length - 1; i >= 0; i--) {
                const opt = this._dropDownElement.options.item(i);
                if (opt && opt.value.length && !this._annotations.find(a => a.annotationId === opt.value)) {
                    this._dropDownElement.options.remove(i);
                    this._annotations.splice(this._annotations.findIndex(a => a.annotationId === opt.value));
                }
            }
        }
        else {
            if (currentOptions.length === 1) {
                this._noAnnotationsContainer.hidden = false;
            }            
        }
    }

    public selectAnnotation(evt: Event) {
        // unload pspdfkit container
        PSPDFKit.unload("#pspdfkit");

        const annotationId: string = (evt.target as any).value;
        const annotation = this._annotations.find(a => a.annotationId === annotationId);
        if (annotation) {
            if (this._psPdfKitContainer.classList.contains("hidden")) {
                this._psPdfKitContainer.classList.remove("hidden");
            }
            this.load(annotation.documentBody);
        }
        else {
            if (!this._psPdfKitContainer.classList.contains("hidden")) {
                this._psPdfKitContainer.classList.add("hidden");
            }
            if (annotationId.length) {
                alert(`annotation ${annotationId} not found!`);
            }            
        }
    }

    public refreshList(evt: Event) {
        this.initializeAnnotations();
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
        this.initializeAnnotations();
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
        this._dropDownElement.removeEventListener("change", this.selectAnnotation);
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
            const newAnno = new Annotation({
                annotationId: "0",
                createdBy: "drewpfeif",
                description: "description",
                documentBody: samplePdf,
                entityImageUrl: "",
                fileName: "sample",
                fileSize: 1000,
                fileType: "pdf",
                modifiedOn: new Date(),
                subject: "subject"
            });
            return Promise.resolve([newAnno]);
        }
        else {
            const query =
                "?$select=filename,subject,annotationid,filesize,documentbody,mimetype,notetext,modifiedon,mimetype" +
                "&$expand=createdby($select=fullname,entityimage_url)" +
                "&$filter=filename ne null and mimetype eq 'application/pdf' and _objectid_value eq " + recordId +
                " and objecttypecode eq '" + recordLogicalName + "' &$orderby=createdon desc";

            return this._context.webAPI.retrieveMultipleRecords("annotation", query).then(
            function success(result) {
                const annotations = result.entities.map(ent => {
                    return new Annotation({
                        subject: ent["subject"] ? ent["subject"].toString() : "",
                        annotationId: ent["annotationid"].toString(),
                        description: ent["description"] ? ent["description"].toString() : "",
                        fileName: ent["filename"].split('.')[0],
                        fileType: ent["filename"].split('.')[1],
                        fileSize: ent["filesize"],
                        documentBody: ent["documentbody"],
                        createdBy: ent["createdby"].fullname,
                        modifiedOn: new Date(ent["modifiedon"]),
                        entityImageUrl: ent["createdby"].entityimage_url
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
}