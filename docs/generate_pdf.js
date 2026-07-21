import fs from 'fs';
import path from 'path';

// PDF Document Generator (Dependency-free PDF writer)
class SimplePDFWriter {
  constructor() {
    this.objects = [];
    this.pages = [];
    this.fonts = [];
    this.fontRef = null;
    this.boldFontRef = null;
    this.contentStream = '';
    this.currentPageRef = null;
    this.y = 750; // A4 height is 841.89, margin is 50
    this.pageWidth = 595.27;
    this.pageHeight = 841.89;
    this.margin = 50;
    this.pageCount = 0;
  }

  init() {
    // 1. Catalog
    this.catalogRef = this.createObject({ Type: '/Catalog', Pages: '2 0 R' }); // Will be Obj 1
    // 2. Pages object
    this.pagesRef = this.createObject({ Type: '/Pages', Kids: [], Count: 0 }); // Will be Obj 2

    // 3. Fonts
    this.fontRef = this.createObject({ Type: '/Font', Subtype: '/Type1', BaseFont: '/Helvetica' });
    this.boldFontRef = this.createObject({ Type: '/Font', Subtype: '/Type1', BaseFont: '/Helvetica-Bold' });
  }

  createObject(dict, stream = null) {
    const id = this.objects.length + 1;
    const obj = { id, dict, stream };
    this.objects.push(obj);
    return `${id} 0 R`;
  }

  newPage() {
    if (this.currentPageRef) {
      this.closePage();
    }
    this.pageCount++;
    this.y = 750;
    this.contentStream = '';
    // Create page object (contents ref will be updated later)
    this.currentPageRef = this.createObject({
      Type: '/Page',
      Parent: '2 0 R',
      MediaBox: `[0 0 ${this.pageWidth} ${this.pageHeight}]`,
      Resources: `<< /Font << /F1 ${this.fontRef} /F2 ${this.boldFontRef} >> >>`
    });
    this.pages.push(this.currentPageRef);
  }

  closePage() {
    // Write header/footer
    const footerText = `Page ${this.pageCount}`;
    const headerText = 'RestaurantOS System Documentation (v2.0-rc)';
    
    // Header
    let stream = `BT /F1 8 Tf 50 800 Td (${headerText}) Tj ET\n`;
    stream += `q 0.5 w 50 790 m 545 790 l S Q\n`; // Header divider line
    
    // Page Content
    stream += this.contentStream;
    
    // Footer
    stream += `q 0.5 w 50 60 m 545 60 l S Q\n`; // Footer divider line
    stream += `BT /F1 8 Tf 270 45 Td (${footerText}) Tj ET\n`;

    const contentRef = this.createObject({ Length: stream.length }, stream);
    
    // Update current page object dictionaries with Contents ref
    const pageObj = this.objects.find(o => `${o.id} 0 R` === this.currentPageRef);
    pageObj.dict.Contents = contentRef;
  }

  drawText(text, font, size, leading = 15) {
    if (this.y - leading < 70) {
      this.newPage();
    }
    // Escape special PDF characters
    const escaped = text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
    this.contentStream += `BT ${font} ${size} Tf 50 ${this.y} Td (${escaped}) Tj ET\n`;
    this.y -= leading;
  }

  drawTitle(text) {
    this.drawText(text, '/F2', 18, 25);
  }

  drawHeading(text) {
    this.drawText(text, '/F2', 14, 20);
  }

  drawSubheading(text) {
    this.drawText(text, '/F2', 11, 16);
  }

  drawBody(text) {
    // Simple line wrap at 80 characters
    const words = text.split(' ');
    let line = '';
    for (const word of words) {
      if (line.length + word.length > 80) {
        this.drawText(line, '/F1', 10, 14);
        line = '';
      }
      line += (line ? ' ' : '') + word;
    }
    if (line) {
      this.drawText(line, '/F1', 10, 14);
    }
  }

  drawCode(code) {
    const lines = code.split('\n');
    for (const line of lines) {
      this.drawText(line, '/F1', 8, 11);
    }
  }

  compile() {
    this.closePage();

    // Update Pages dictionary count and kids
    const pagesObj = this.objects.find(o => o.id === 2);
    pagesObj.dict.Kids = `[${this.pages.join(' ')}]`;
    pagesObj.dict.Count = this.pageCount;

    // Build the output stream
    let pdf = '%PDF-1.4\n';
    const offsets = [];

    for (const obj of this.objects) {
      offsets[obj.id] = pdf.length;
      pdf += `${obj.id} 0 obj\n<<\n`;
      for (const [key, value] of Object.entries(obj.dict)) {
        pdf += `/${key} ${value}\n`;
      }
      pdf += '>>\n';
      if (obj.stream !== null) {
        pdf += `stream\n${obj.stream}\nendstream\n`;
      }
      pdf += 'endobj\n';
    }

    const xrefOffset = pdf.length;
    pdf += 'xref\n';
    pdf += `0 ${this.objects.length + 1}\n`;
    pdf += '0000000000 65535 f \n';
    for (let i = 1; i <= this.objects.length; i++) {
      const offsetStr = String(offsets[i]).padStart(10, '0');
      pdf += `${offsetStr} 00000 n \n`;
    }

    pdf += 'trailer\n<<\n';
    pdf += `/Size ${this.objects.length + 1}\n`;
    pdf += '/Root 1 0 R\n';
    pdf += '>>\n';
    pdf += 'startxref\n';
    pdf += `${xrefOffset}\n`;
    pdf += '%%EOF\n';

    return pdf;
  }
}

// Main logic
const docsDir = 'c:/Users/Geetha Krishna/OneDrive/Desktop/Project Saas for all/docs';
const pdfDir = path.join(docsDir, 'pdf');

if (!fs.existsSync(pdfDir)) {
  fs.mkdirSync(pdfDir, { recursive: true });
}

const docFiles = [
  'README.md',
  'SYSTEM_ARCHITECTURE.md',
  'DATABASE_SCHEMA.md',
  'API_REFERENCE.md',
  'AUTHENTICATION.md',
  'MULTI_TENANT_ARCHITECTURE.md',
  'CUSTOMER_PORTAL.md',
  'OWNER_DASHBOARD.md',
  'WAITER_DASHBOARD.md',
  'KITCHEN_DASHBOARD.md',
  'SUPER_ADMIN.md',
  'COMPONENT_LIBRARY.md',
  'ROUTING.md',
  'STATE_MANAGEMENT.md',
  'FOLDER_STRUCTURE.md',
  'FEATURES.md',
  'KNOWN_ISSUES.md',
  'CHANGELOG.md',
  'TESTING_GUIDE.md',
  'SECURITY.md',
  'DEPLOYMENT.md',
  'ROADMAP.md',
  'PROJECT_STATUS.md',
  'MODULE_COMPLETION.md',
  'FIREBASE_SETUP.md',
  'UI_GUIDELINES.md',
  'CODING_STANDARDS.md',
  'CONTRIBUTING.md',
  'RELEASE_CHECKLIST.md'
];

const writer = new SimplePDFWriter();
writer.init();

// Cover Page
writer.newPage();
writer.y = 500;
writer.drawText('RestaurantOS', '/F2', 36, 45);
writer.drawText('Complete Software Documentation', '/F2', 20, 25);
writer.drawText('Version 2.0-rc', '/F1', 12, 18);
writer.drawText(`Generated on: ${new Date().toLocaleDateString()}`, '/F1', 12, 18);

// Process each file
for (const file of docFiles) {
  const filePath = path.join(docsDir, file);
  if (!fs.existsSync(filePath)) continue;

  writer.newPage();
  writer.drawTitle(file.replace('.md', '').replace(/_/g, ' '));
  
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  let inCode = false;
  let codeBlock = '';

  for (const line of lines) {
    if (line.startsWith('```')) {
      if (inCode) {
        writer.drawCode(codeBlock);
        codeBlock = '';
        inCode = false;
      } else {
        inCode = true;
      }
      continue;
    }

    if (inCode) {
      codeBlock += line + '\n';
      continue;
    }

    if (line.startsWith('# ')) {
      writer.drawTitle(line.slice(2));
    } else if (line.startsWith('## ')) {
      writer.drawHeading(line.slice(3));
    } else if (line.startsWith('### ')) {
      writer.drawSubheading(line.slice(4));
    } else if (line.trim() !== '') {
      writer.drawBody(line.trim());
    }
  }
}

const pdfData = writer.compile();
fs.writeFileSync(path.join(pdfDir, 'RestaurantOS_Complete_Documentation.pdf'), pdfData, 'binary');
console.log('Successfully generated docs/pdf/RestaurantOS_Complete_Documentation.pdf!');
