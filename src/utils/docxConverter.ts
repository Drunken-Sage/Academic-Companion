import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import PizZip from 'pizzip';

interface DocxContent {
  text: string;
  paragraphs: string[];
}

/**
 * Extract text content from DOCX file
 */
export const extractDocxText = async (file: File): Promise<DocxContent> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const zip = new PizZip(arrayBuffer);
    
    // Get the document.xml file which contains the main content
    const documentXml = zip.file('word/document.xml');
    if (!documentXml) {
      throw new Error('Invalid DOCX file: document.xml not found');
    }
    
    const xmlContent = documentXml.asText();
    
    // Parse XML and extract text from <w:t> elements
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
    
    // Get all text elements
    const textElements = xmlDoc.getElementsByTagName('w:t');
    const paragraphElements = xmlDoc.getElementsByTagName('w:p');
    
    let fullText = '';
    const paragraphs: string[] = [];
    
    // Extract paragraphs
    for (let i = 0; i < paragraphElements.length; i++) {
      const paragraph = paragraphElements[i];
      const textNodes = paragraph.getElementsByTagName('w:t');
      let paragraphText = '';
      
      for (let j = 0; j < textNodes.length; j++) {
        paragraphText += textNodes[j].textContent || '';
      }
      
      if (paragraphText.trim()) {
        paragraphs.push(paragraphText.trim());
        fullText += paragraphText.trim() + '\n\n';
      }
    }
    
    return {
      text: fullText.trim(),
      paragraphs: paragraphs
    };
  } catch (error) {
    console.error('Error extracting DOCX text:', error);
    throw new Error('Failed to extract text from DOCX file');
  }
};

/**
 * Convert DOCX content to PDF
 */
export const convertDocxToPdf = async (file: File): Promise<Uint8Array> => {
  try {
    const docxContent = await extractDocxText(file);
    
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const fontSize = 12;
    const lineHeight = 18;
    const margin = 50;
    
    let page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    let yPosition = height - margin;
    
    const maxWidth = width - (margin * 2);
    
    // Function to add a new page when needed
    const addNewPageIfNeeded = (requiredHeight: number) => {
      if (yPosition - requiredHeight < margin) {
        page = pdfDoc.addPage();
        yPosition = height - margin;
      }
    };
    
    // Function to wrap text to fit page width
    const wrapText = (text: string, maxWidth: number): string[] => {
      const words = text.split(' ');
      const lines: string[] = [];
      let currentLine = '';
      
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const textWidth = timesRomanFont.widthOfTextAtSize(testLine, fontSize);
        
        if (textWidth <= maxWidth) {
          currentLine = testLine;
        } else {
          if (currentLine) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            // Word is too long, break it
            lines.push(word);
          }
        }
      }
      
      if (currentLine) {
        lines.push(currentLine);
      }
      
      return lines;
    };
    
    // Add title
    const title = file.name.replace('.docx', '');
    const titleLines = wrapText(title, maxWidth);
    
    for (const line of titleLines) {
      addNewPageIfNeeded(lineHeight * 2);
      page.drawText(line, {
        x: margin,
        y: yPosition,
        size: fontSize + 4,
        font: timesRomanFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= lineHeight * 1.5;
    }
    
    yPosition -= lineHeight; // Extra space after title
    
    // Add content paragraphs
    for (const paragraph of docxContent.paragraphs) {
      if (!paragraph.trim()) continue;
      
      const lines = wrapText(paragraph, maxWidth);
      
      // Check if we need a new page for this paragraph
      addNewPageIfNeeded(lines.length * lineHeight + lineHeight);
      
      for (const line of lines) {
        page.drawText(line, {
          x: margin,
          y: yPosition,
          size: fontSize,
          font: timesRomanFont,
          color: rgb(0, 0, 0),
        });
        yPosition -= lineHeight;
      }
      
      yPosition -= lineHeight * 0.5; // Space between paragraphs
    }
    
    // Add footer with conversion info
    const pages = pdfDoc.getPages();
    pages.forEach((page, index) => {
      const footerText = `Converted from ${file.name} - Page ${index + 1} of ${pages.length}`;
      page.drawText(footerText, {
        x: margin,
        y: 30,
        size: 8,
        font: timesRomanFont,
        color: rgb(0.5, 0.5, 0.5),
      });
    });
    
    return await pdfDoc.save();
  } catch (error) {
    console.error('Error converting DOCX to PDF:', error);
    throw new Error('Failed to convert DOCX to PDF');
  }
};

/**
 * Create a blob URL for the converted PDF
 */
export const createPdfBlobUrl = (pdfBytes: Uint8Array): string => {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  return URL.createObjectURL(blob);
};

/**
 * Check if a file is a DOCX file
 */
export const isDocxFile = (file: { mime_type: string; original_name: string }): boolean => {
  return file.mime_type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
         file.original_name.toLowerCase().endsWith('.docx');
};
