# PCF-PSPDFKit (DEMO)
PowerApps Component Framework (PCF) Control that retrieves notes with PDF attachments and displays the selected PDF using [PSPDFKit](https://pspdfkit.com) (v2019.5)

## Backstory
A colleague inquired about a custom component using [PCF](https://docs.microsoft.com/en-us/powerapps/developer/component-framework/overview) that utilizes a PDF Viewer ([PSPDFKit](https://pspdfkit.com)). Inspired by the inquiry, I set out to learn more about developing PCF controls and hopefully help out a colleague along the way.

## The Journey
Following the PCF tutorial for ["Create your first component"](https://docs.microsoft.com/en-us/powerapps/developer/component-framework/implementing-controls-using-typescript), I set up my developer environment and quickly got up to speed with the basics.  I had prior experience with Typescript and I was confident that I could handle the task at hand.  I decided the functionality of my demo PCF component would be to retrieve notes with PDF attachments associated with an entitity and display the PDF using PSPDFKit.

### Chapter 1 - Getting PSPDFKit Into My PCF Project
In order to use PSPDFKit I needed a trial license.  I  went to [pspdfkit.com](https://pspdfkit.com), entered my email address, and clicked on the Download Trial button.  Moments later I received an email containing a link to PSPDFKit's trial page.  On the trial page I chose Get Started for PSPDFKit for Web.  A modal popped up and I selected "Integrate client" for Standalone - Client only solution.  This brought me to a page that included my trial license key, which I copied and pasted into OneNote to save for future use.

Reading through the prerequisites I found that I can bring the PSPDFKit package into my PCF project by using npm.

`npm install --save pspdfkit`

I added an import statement to the top of my index.ts file and was ready to move forward.

`import PSPDFKit from "pspdfkit";`

But...  Typescript complained that "(TS) Could not find a declaration file for module 'pspdfkit'".

I didn't find a Typescript declaration file (d.ts) for the PSPDFKit JavaScript library, and I didn't feel like creating my own for it, so I replace the import statement with a require statement so that I could use PSPDFKit as an "any" type.

`const PSPDFKit = require("pspdfkit");`

Good enough for me.

### Chapter 2 - Initial Design
I initially started out with a crude design that contained a drop-down list to hold the list of PDFs.  Selecting an item from the list would then load the PDF into the PSPDFKit viewer. I was able to get everything to work, but it wasn't free of roadblocks to overcome.

**Roadblock #1**

Manifest Property for storing the PSPDFKit License Key

**Roadblock #2**

Manifest Property for storing the PSPDFKit License Key, again

**Roadblock #3**

PSPDFKit-lib files

**Roadblock #4**

wasm file - solution found from PSPDFKit documentation

**Roadblock #5**


### Chapter 3 - Design Refinements
Having successfully implemented my crude design I decided to upgrade the look and feel to friendlier experience.  I decided to display each note/PDF record as a card, and when clicking on a card it would open a modal to dispaly the PDF in the PSPDFKit Viewer.

I installed Bootstrap for styling the cards and Font Awesome for a PDF icon.

...
npm install --save bootstrap
npm install --save @fortawesome/fontawesome-svg-core
npm install --save @fortawesome/free-regular-svg-icons
...

I just needed the bootstrap css file so I added it to my ControlManifest.Input.xml file.

`<css path="../node_modules/bootstrap/dist/css/bootstrap.min.css" order="1" />`

I only used the pdf icon from Font Awesome.  Instead of loading everything from Font Awesome I singled out the pdf icon like this...

...
import { library, dom } from "@fortawesome/fontawesome-svg-core";
import { faFilePdf } from "@fortawesome/free-regular-svg-icons";

library.add(faFilePdf);

dom.watch();
...

I was then able to use the pdf icon using the Font Awesome classes in my HTML markup.

`far fa-file-pdf`

I also used Bootstrap's Modal component for displaying the PDF, but right away I discovered the modal wasn't displaying when I clicked on a card.  I assumed it was because the Modal component needs jQuery in order to work, so I just added my own CSS and event handlers to show/hide the modal.

### Chapter 4 - The End Result

Cards

![Cards](https://github.com/drewpfeif/PCF-PSPDFKit/blob/master/images/cards.PNG?raw=true)

Cards - Hover

![Cards-Hover](https://github.com/drewpfeif/PCF-PSPDFKit/blob/master/images/cards_hover.PNG?raw=true)

PSPDFKit PDF Viewer

![PSPDFKit-PDF-Viwer](https://github.com/drewpfeif/PCF-PSPDFKit/blob/master/images/pdfviewer.PNG?raw=true)

## License
[MIT](https://choosealicense.com/licenses/mit/)