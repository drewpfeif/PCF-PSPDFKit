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

But```  Typescript complained that "(TS) Could not find a declaration file for module 'pspdfkit'".

I didn't find a Typescript declaration file (d.ts) for the PSPDFKit JavaScript library, and I didn't feel like creating my own for it, so I replace the import statement with a require statement so that I could use PSPDFKit as an "any" type.

`const PSPDFKit = require("pspdfkit");`

Good enough for me.

### Chapter 2 - Initial Design
I initially started out with a crude design that contained a drop-down list to hold the list of PDFs.  Selecting an item from the list would then load the PDF into the PSPDFKit viewer. I was able to get everything to work, but it wasn't free of roadblocks to overcome.

**Roadblock #1**

I first ran into issues when I packaged up my PCF component, imported it into my instance of Dynamics 365, and did my first test.  I could see in Chrome DevTools that PSPDFKit was trying to load a JavaScript file as a D365 Web Resource, but it was coming back with a 404 Not Found error.  I found that the missing file was in the pspdfkit-lib folder in the node_modules path for PSPDFKit, so I figured I would try and upload the missing JavaScript file to my D365 instance as a web resource.  I noticed in the 404 error that the web resource path had a "cc_" prefix in it.  When I created my D365 Solution to hold the web resources I created a new publisher and specified "cc" for the prefix so that my JavaScript web resource would have the "cc_" prefix.  I assumed "cc" stands for "custom control" in D365 land and was worried that using "cc" for my publisher prefix would by denied or would cause some side-effect, but never found that to be the case.

I tested my idea by adding the first 404 Not Found file to my D365 Solution, published it, and tested my PCF component again.  I was happy to see Chrome DevTools successfully get the JavaScript file, but then a different came up 404 Not Found.  So I repeated the process again... and again... and again, until I didn't have any more 404 errors.

**Roadblock #2**

One of the missing pspdfkit-lib files that I came across was a .wasm file.  When I tried adding it to my D365 Solution as a web resource it was denied, saying that the file type wasn't allowed.  I overcame this issue by renaming the file by appending a ".js" to the end of the file name.  Thankfully D365 doesn't use that file name and instead it uses whatever file name I specify as the Name property of the web resource.  On to the next roadblock...

**Roadblock #3**

Renaming the .wasm file took care of the previous roadblock, but when I tried to upload the file it failed again.  This time it was telling me the file size was too large.  I overcame this roadblock by increasing the Maximum file size in D365 System Settings / Email / Set the size limit for attachments.

**Roadblock #4**

Testing my PCF component again and another error comes up in Chrome DevTools - PSPDFKit License Key is too short.  There's a Property in the ControlManifest.Input.xml file that I use to store the PSPDFKit License Kit.  The "of-type" attribute of this property was set to "SingleLine.Text", and apparently using this setting didn't allow the full length of the license key to be saved.  I changed it to "SingleLine.TextArea", tested again, and... it worked!  But...

**Roadblock #5**

I came back the next day after fixing the "of-type" issue, made some additional updates to my PCF component, imported it into my D365 instance, tested my PCF component again, and... PSPDFKit License Key was too short again.  This time I changed the "of-type" attribute to "Multipe", which says can contain up to 1,048,576 text characters.  I tested again and it worked :)

**Roadblock #6**

One last issue that was more of an annoyance than anything (everything was working) was that I was seeing in Chrome DevTools an error referring to "wasm something and streaming something something..." (*note: not the actual error message, I couldn't remember exactly what it was and I didn't feel like reproducing it).  I googled the error and found some troubleshooting suggestings on the PSPDFKit website [here](https://pspdfkit.com/guides/web/current/pspdfkit-for-web/troubleshooting/) under "Workaround by disabling streaming instantiation".  I added the "disableWebAssemblyStreaming" option to my PSPDFKit.load() statement and that took care of the error.

```
PSPDFKit.load({
  disableWebAssemblyStreaming: true
  // ... other options
});
```

### Chapter 3 - Design Refinements
Having successfully implemented my crude design I decided to upgrade the look and feel to friendlier experience.  I decided to display each note/PDF record as a card, and when clicking on a card it would open a modal to dispaly the PDF in the PSPDFKit Viewer.

I installed Bootstrap for styling the cards and Font Awesome for a PDF icon.

```
npm install --save bootstrap
npm install --save @fortawesome/fontawesome-svg-core
npm install --save @fortawesome/free-regular-svg-icons
```

I just needed the bootstrap css file so I added it to the resources section of my ControlManifest.Input.xml file.

`<css path="../node_modules/bootstrap/dist/css/bootstrap.min.css" order="1" />`

I only used the pdf icon from Font Awesome.  Instead of loading everything from Font Awesome I singled out the pdf icon like this...

```
import { library, dom } from "@fortawesome/fontawesome-svg-core";
import { faFilePdf } from "@fortawesome/free-regular-svg-icons";

library.add(faFilePdf);

dom.watch();
```

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

## Managed Solutions

Also included in this repository are two managed solutions in the "managed solutions" folder.

**DrewPfeifPSPDFKit_1_0_0_0_managed.zip**
- this solution contains the PCF-PSPDFKit component

**pspdfkit_1_0_0_0_managed.zip**
- this solution contains the pspdfkit-lib files.  I included all of them instead of only the four or file files that were missing for me. 

## License
[MIT](https://choosealicense.com/licenses/mit/)